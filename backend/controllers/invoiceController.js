import Invoice from "../models/Invoice.js";
import Reservation from "../models/Reservation.js";
import { buildInvoicePdf } from "../utils/generateInvoicePdf.js";

const TAX_RATE = Number(process.env.TAX_RATE) || 0;
const round = (n) => Math.round(n * 100) / 100;

// Invoice dikhate waqt guest aur booking ki zaroori details bharo
const POPULATE_GUEST = { path: "guest", select: "name email phone" };
const POPULATE_RESERVATION = {
  path: "reservation",
  select: "bookingCode checkIn checkOut nights guestsCount status",
  populate: { path: "room", select: "roomNumber type floor" },
};

// INV-0001, INV-0002 ...
const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  return `INV-${String(count + 1).padStart(4, "0")}`;
};


// ============ 1. INVOICE BANANA (booking se) ============
export const createInvoice = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.body.reservation);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Sirf jo guest aa chuka hai (ya ja chuka hai) uska bill banta hai
    if (!["checked-in", "checked-out"].includes(reservation.status)) {
      return res.status(400).json({ message: "Invoice can only be created after check-in" });
    }

    const exists = await Invoice.findOne({ reservation: reservation._id });
    if (exists) {
      return res.status(400).json({ message: "Invoice already exists for this reservation" });
    }

    const invoice = new Invoice({
      invoiceNumber: await generateInvoiceNumber(),
      reservation: reservation._id,
      guest: reservation.guest,
      roomCharges: reservation.totalAmount,   // booking ka kiraya (copy)
      taxRate: TAX_RATE,                      // tax ki copy (.env se)
    });

    invoice.recalculate();                    // subtotal, tax, total nikalo
    await invoice.save();

    await invoice.populate([POPULATE_GUEST, POPULATE_RESERVATION]);
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
};


// ============ 2. SAB INVOICES (staff) ============
// GET /api/invoices?status=unpaid&search=INV-00&page=1&limit=10
export const getInvoices = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const filter = {};
    if (status) filter.status = status;
    if (req.query.reservation) filter.reservation = req.query.reservation;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.invoiceNumber = new RegExp(safe, "i");
    }

    const total = await Invoice.countDocuments(filter);

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_GUEST)
      .populate(POPULATE_RESERVATION);

    res.json({ invoices, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};


// ============ 3. GUEST KE APNE INVOICES ============
export const getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ guest: req.user._id })
      .sort({ createdAt: -1 })
      .populate(POPULATE_RESERVATION);

    res.json(invoices);
  } catch (error) {
    next(error);
  }
};


// ============ 4. EK INVOICE ============
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate(POPULATE_GUEST)
      .populate(POPULATE_RESERVATION);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Guest sirf apna invoice dekh sakta hai
    if (req.user.role === "guest" && invoice.guest._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only view your own invoices" });
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};


// ============ 5. EXTRA CHARGE LAGANA ============
// body: { description, category, quantity, unitPrice }
export const addCharge = async (req, res, next) => {
  try {
    const { description, category, quantity = 1, unitPrice } = req.body;

    const qty = Number(quantity);
    const price = Number(unitPrice);

    if (!description || isNaN(price)) {
      return res.status(400).json({ message: "Description and unit price are required" });
    }
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "Quantity must be a whole number, at least 1" });
    }
    if (price < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (invoice.status !== "unpaid") {
      return res.status(400).json({ message: `Cannot add charges to a ${invoice.status} invoice` });
    }

    invoice.charges.push({
      description,
      category,
      quantity: qty,
      unitPrice: price,
      amount: round(qty * price),     // amount server nikalta hai, frontend nahi
      addedBy: req.user._id,
    });

    invoice.recalculate();
    await invoice.save();

    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
};


// ============ 6. CHARGE HATANA ============
export const removeCharge = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (invoice.status !== "unpaid") {
      return res.status(400).json({ message: `Cannot change a ${invoice.status} invoice` });
    }

    const charge = invoice.charges.id(req.params.chargeId);
    if (!charge) {
      return res.status(404).json({ message: "Charge not found" });
    }

    invoice.charges.pull(req.params.chargeId);
    invoice.recalculate();
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};


// ============ 7. DISCOUNT ============
// body: { discount }   (amount mein, percent nahi)
export const applyDiscount = async (req, res, next) => {
  try {
    const discount = Number(req.body.discount);

    if (isNaN(discount) || discount < 0) {
      return res.status(400).json({ message: "Discount must be a number, 0 or more" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (invoice.status !== "unpaid") {
      return res.status(400).json({ message: `Cannot change a ${invoice.status} invoice` });
    }
    if (discount > invoice.subtotal) {
      return res.status(400).json({ message: "Discount cannot be more than the subtotal" });
    }

    invoice.discount = discount;
    invoice.recalculate();
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};


// ============ 8. PAID MARK KARNA (cash ya card counter par) ============
// body: { method: "cash" | "card" }   ("stripe" sirf webhook se lagega)
export const markPaid = async (req, res, next) => {
  try {
    const { method } = req.body;

    if (!["cash", "card"].includes(method)) {
      return res.status(400).json({ message: "Payment method must be cash or card" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (invoice.status !== "unpaid") {
      return res.status(400).json({ message: `Invoice is already ${invoice.status}` });
    }

    invoice.status = "paid";
    invoice.paymentMethod = method;
    invoice.paidAt = new Date();
    invoice.receivedBy = req.user._id;
    await invoice.save();

    res.json({ message: "Invoice marked as paid", invoice });
  } catch (error) {
    next(error);
  }
};


// ============ 9. INVOICE RADD KARNA (sirf admin) ============
export const voidInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (invoice.status !== "unpaid") {
      return res.status(400).json({ message: `Cannot void a ${invoice.status} invoice` });
    }

    invoice.status = "void";
    await invoice.save();

    res.json({ message: "Invoice voided", status: invoice.status });
  } catch (error) {
    next(error);
  }
};

// ============ 10. BILLING REPORT (admin, manager) ============
// GET /api/invoices/report?from=2026-12-01&to=2026-12-31   (dono optional)
const parseDay = (value) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const getBillingReport = async (req, res, next) => {
  try {
    const from = req.query.from ? parseDay(req.query.from) : null;
    const to = req.query.to ? parseDay(req.query.to) : null;

    if ((req.query.from && !from) || (req.query.to && !to)) {
      return res.status(400).json({ message: "Invalid dates" });
    }

    // "to" wala din bhi shamil karne ke liye ek din aage tak
    const toEnd = to ? new Date(to.getTime() + 24 * 60 * 60 * 1000) : null;

    // Kisi bhi date field par range ka filter banana
    const range = (field) => {
      const r = {};
      if (from) r.$gte = from;
      if (toEnd) r.$lt = toEnd;
      return Object.keys(r).length ? { [field]: r } : {};
    };

    const [statusStats, methodStats, dailyStats, recentPayments] = await Promise.all([
      // 1. Status ke hisaab se: kitne invoice, kitna paisa
      Invoice.aggregate([
        { $match: range("createdAt") },
        { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$total" } } },
      ]),
      // 2. Paid invoices: cash / card / stripe ke hisaab se
      Invoice.aggregate([
        { $match: { status: "paid", ...range("paidAt") } },
        { $group: { _id: "$paymentMethod", count: { $sum: 1 }, amount: { $sum: "$total" } } },
      ]),
      // 3. Din ke hisaab se revenue (chart ke liye)
      Invoice.aggregate([
        { $match: { status: "paid", ...range("paidAt") } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
            count: { $sum: 1 },
            amount: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // 4. Aakhri 10 payments
      Invoice.find({ status: "paid", ...range("paidAt") })
        .sort({ paidAt: -1 })
        .limit(10)
        .populate(POPULATE_GUEST)
        .select("invoiceNumber guest total paymentMethod paidAt"),
    ]);

    const stat = (key) => {
      const found = statusStats.find((s) => s._id === key);
      return { count: found?.count || 0, amount: round(found?.amount || 0) };
    };

    res.json({
      range: { from, to },
      summary: {
        totalInvoices: statusStats.reduce((sum, s) => sum + s.count, 0),
        paid: stat("paid"),
        unpaid: stat("unpaid"),
        void: stat("void"),
      },
      revenue: round(methodStats.reduce((sum, m) => sum + m.amount, 0)),
      byMethod: methodStats.map((m) => ({ method: m._id, count: m.count, amount: round(m.amount) })),
      daily: dailyStats.map((d) => ({ date: d._id, count: d.count, amount: round(d.amount) })),
      recentPayments,
    });
  } catch (error) {
    next(error);
  }
};

// ============ 11. INVOICE PDF ============
export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate(POPULATE_GUEST)
      .populate(POPULATE_RESERVATION);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (req.user.role === "guest" && invoice.guest._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only download your own invoices" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    buildInvoicePdf(invoice, res);
  } catch (error) {
    next(error);
  }
};