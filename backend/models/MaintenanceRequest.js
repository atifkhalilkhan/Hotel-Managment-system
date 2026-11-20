import mongoose from "mongoose";

const maintenanceRequestSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    location: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "cancelled"],
      default: "open",
    },
    blocksRoom: {
      type: Boolean,
      default: false,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    startedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

maintenanceRequestSchema.index({ status: 1, createdAt: -1 });
maintenanceRequestSchema.index({ room: 1, status: 1 });

const MaintenanceRequest = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);

export default MaintenanceRequest;