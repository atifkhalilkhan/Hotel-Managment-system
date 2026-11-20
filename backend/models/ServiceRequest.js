import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["room-service", "wake-up-call", "transportation", "other"],
      required: [true, "Service type is required"],
    },
    details: { type: String, trim: true, maxlength: [500, "Details are too long"] },
    scheduledFor: { type: Date },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    staffNotes: { type: String, trim: true, maxlength: [300, "Notes are too long"] },
    amount: { type: Number, default: 0, min: 0 },
    chargedToInvoice: { type: Boolean, default: false },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ status: 1, createdAt: -1 });
serviceRequestSchema.index({ guest: 1, createdAt: -1 });

const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);

export default ServiceRequest;
