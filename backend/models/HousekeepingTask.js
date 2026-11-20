import mongoose from "mongoose";

const housekeepingTaskSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
    },
    type: {
      type: String,
      enum: ["checkout-cleaning", "regular-cleaning", "deep-cleaning", "inspection"],
      required: [true, "Task type is required"],
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task creator is required"],
    },
    notes: {
      type: String,
      trim: true,
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

housekeepingTaskSchema.index({ status: 1, createdAt: -1 });
housekeepingTaskSchema.index({ assignedTo: 1, status: 1 });
housekeepingTaskSchema.index({ room: 1, status: 1 });

const HousekeepingTask = mongoose.model("HousekeepingTask", housekeepingTaskSchema);

export default HousekeepingTask;
