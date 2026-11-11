import stripe from "../config/stripe.js";
import Invoice from "../models/Invoice.js";

const CURRENCY = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Stripe amount chhoti ikai mein leta hai: 50.25 -> 5025
const toMinorUnits = (amount) => Math.round(amount * 100);

// Stripe session se invoice ko paid karna (webhook aur verify dono yahi use karte hain)
const applyPaidSession = async (session) => {
  const invoiceId = session.metadata?.invoiceId;
  if (!invoiceId || session.payment_status !== "paid") return;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice || invoice.status !== "unpaid") return;

  if (session.amount_total !== toMinorUnits(invoice.total)) {
    console.error(`Amount mismatch for invoice ${invoiceId}`);
    return;
  }

  invoice.status = "paid";
  invoice.paymentMethod = "stripe";
  invoice.paidAt = new Date();
  invoice.stripeSessionId = session.id;
  await invoice.save();
};


// ============ 1. STRIPE PAYMENT PAGE BANANA ============
// body: { invoiceId }
export const createCheckoutSession = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.body.invoiceId).populate("reservation", "bookingCode");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Guest sirf apna invoice bhar sakta hai
    if (req.user.role === "guest" && invoice.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only pay your own invoices" });
    }

    if (invoice.status !== "unpaid") {
      return res.status(400).json({ message: `Invoice is already ${invoice.status}` });
    }
    if (invoice.total <= 0) {
      return res.status(400).json({ message: "Nothing to pay on this invoice" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: toMinorUnits(invoice.total),   // amount database se, frontend se nahi
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Booking ${invoice.reservation?.bookingCode || ""}`.trim(),
            },
          },
        },
      ],
      metadata: { invoiceId: invoice._id.toString() },  // webhook is se invoice pehchanega
      success_url: `${CLIENT_URL}/payment/success?invoice=${invoice._id}`,
      cancel_url: `${CLIENT_URL}/payment/cancelled?invoice=${invoice._id}`,
    });

    invoice.stripeSessionId = session.id;
    await invoice.save();

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
};


// ============ 2. WEBHOOK (Stripe batata hai: payment ho gayi) ============
// Ye route app.js mein RAW body ke saath lagta hai, is liye next/errorHandler yahan nahi.
export const handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    // Signature check: sach mein Stripe ne bheja hai ya kisi ne nakli request?
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      await applyPaidSession(event.data.object);
    }

    res.json({ received: true });
  } catch (error) {
    // 500 dene se Stripe baad mein dobara koshish karta hai
    console.error("Webhook error:", error.message);
    res.status(500).json({ message: "Webhook handler failed" });
  }
};

// ============ 3. PAYMENT VERIFY (success page isay bulata hai) ============
// GET /api/payments/verify/:invoiceId
export const verifyPayment = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (req.user.role === "guest" && invoice.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only check your own invoices" });
    }

    if (invoice.status !== "unpaid" || !invoice.stripeSessionId) {
      return res.json({ status: invoice.status });
    }

    const session = await stripe.checkout.sessions.retrieve(invoice.stripeSessionId);
    if (session.metadata?.invoiceId === invoice._id.toString()) {
      await applyPaidSession(session);
    }

    const fresh = await Invoice.findById(invoice._id);
    res.json({ status: fresh.status });
  } catch (error) {
    next(error);
  }
};