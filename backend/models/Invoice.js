import mongoose from "mongoose";

// Ek extra charge (khana, laundry, taxi...)
const chargeSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["food", "laundry", "room-service", "transport", "minibar", "other"],
      default: "other",
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Price cannot be negative"],
    },
    amount: {
      type: Number,
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomCharges: {
      type: Number,
      required: true,
      min: 0,
    },
    charges: [chargeSchema],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: [0, "Discount cannot be negative"] },
    taxRate: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["unpaid", "paid", "void"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "stripe"],
    },
    paidAt: { type: Date },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    stripeSessionId: { type: String },
  },
  { timestamps: true }
);

// Hisaab dobara lagana (charge jode/hataye ya discount badle to chalana hai)
invoiceSchema.methods.recalculate = function () {
  const round = (n) => Math.round(n * 100) / 100;

  const chargesTotal = this.charges.reduce((sum, c) => sum + c.amount, 0);
  this.subtotal = round(this.roomCharges + chargesTotal);

  const taxable = Math.max(this.subtotal - this.discount, 0);
  this.taxAmount = round((taxable * this.taxRate) / 100);
  this.total = round(taxable + this.taxAmount);
};

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;