import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      unique: true,
      sparse: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [80, "Name is too long"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
      validate: { validator: Number.isInteger, message: "Rating must be a whole number" },
    },
    message: {
      type: String,
      required: [true, "Feedback is required"],
      trim: true,
      maxlength: [1000, "Feedback is too long"],
    },
    source: {
      type: String,
      enum: ["guest-app", "website"],
      required: true,
    },
    verifiedStay: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: { type: Date },
    moderationNotes: {
      type: String,
      trim: true,
      maxlength: [300, "Moderation notes are too long"],
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1, createdAt: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
