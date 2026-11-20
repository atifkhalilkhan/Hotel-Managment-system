import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "manager", "receptionist", "housekeeping", "guest"],
      default: "guest",
    },
    phone: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },
    address: { type: String, trim: true, maxlength: [200, "Address is too long"] },
    city: { type: String, trim: true, maxlength: [60, "City is too long"] },
    country: { type: String, trim: true, maxlength: [60, "Country is too long"] },
    preferences: {
      roomType: { type: String, enum: ["single", "double", "deluxe", "suite"] },
      bedType: { type: String, enum: ["single", "double", "king", "twin"] },
      smoking: { type: Boolean, default: false },
      dietary: { type: String, trim: true, maxlength: [200, "Dietary note is too long"] },
      notes: { type: String, trim: true, maxlength: [500, "Notes are too long"] },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
