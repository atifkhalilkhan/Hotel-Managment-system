import Invoice from "../models/Invoice.js";
import HotelSettings from "../models/HotelSettings.js";
import { notifyUsers } from "./notifications.js";

// Sirf jo guest aa chuka hai (ya ja chuka hai) uska bill banta hai
export const BILLABLE_STATUSES = ["checked-in", "checked-out"];

// INV-0001, INV-0002 ... (sab se bara number + 1, taake count se takrao na ho)
const nextInvoiceNumber = async () => {
  const last = await Invoice.findOne({ invoiceNumber: /^INV-\d+$/ })
    .sort({ createdAt: -1 })
    .select("invoiceNumber")
    .lean();
  const lastNumber = last ? Number(last.invoiceNumber.slice(4)) : 0;
  const count = await Invoice.countDocuments();
  return `INV-${String(Math.max(lastNumber, count) + 1).padStart(4, "0")}`;
};

const taxRateNow = async () => {
  const settings = await HotelSettings.findOne({ key: "default" }).select("taxRate").lean();
  const envTaxRate = Number(process.env.TAX_RATE);
  return settings?.taxRate ?? (Number.isFinite(envTaxRate) && envTaxRate >= 0 ? envTaxRate : 0);
};

/**
 * Booking ka invoice lao; na ho to bana do. Check-in, check-out, service charge aur staff ka
 * "Create invoice" sab yahi use karte hain, is liye ek booking ka hamesha ek hi invoice hota hai
 * (model mein `reservation` unique bhi hai).
 *
 * Wapas: { invoice, created } — `created` false matlab pehle se maujood tha.
 */
export async function ensureReservationInvoice(reservation, actorId) {
  const existing = await Invoice.findOne({ reservation: reservation._id });
  if (existing) return { invoice: existing, created: false };

  if (!BILLABLE_STATUSES.includes(reservation.status)) {
    const error = new Error("Invoice can only be created after check-in");
    error.statusCode = 400;
    throw error;
  }

  const taxRate = await taxRateNow();
  // Do staff ek saath banayen to number takra sakta hai: dobara koshish karo
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const invoice = new Invoice({
        invoiceNumber: await nextInvoiceNumber(),
        reservation: reservation._id,
        guest: reservation.guest?._id ?? reservation.guest,
        roomCharges: reservation.totalAmount, // booking ka kiraya (copy)
        taxRate,
      });
      invoice.recalculate(); // subtotal, tax, total
      await invoice.save();

      await notifyUsers(
        [invoice.guest],
        {
          type: "invoice",
          title: "New invoice",
          message: `Invoice ${invoice.invoiceNumber} is ready to review.`,
          link: "/my-invoices",
        },
        actorId
      );
      return { invoice, created: true };
    } catch (error) {
      if (error?.code !== 11000) throw error;
      // Kisi aur ne isi booking ka invoice abhi bana diya
      const raced = await Invoice.findOne({ reservation: reservation._id });
      if (raced) return { invoice: raced, created: false };
      // Warna sirf invoice number takraya tha: agle number ke saath dobara
    }
  }
  throw new Error("Could not create the invoice. Please try again.");
}
