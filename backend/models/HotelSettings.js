import mongoose from "mongoose";

const hotelSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    taxRate: { type: Number, min: 0, max: 100, default: null },
    roomRates: {
      single: { type: Number, min: 0, default: null },
      double: { type: Number, min: 0, default: null },
      deluxe: { type: Number, min: 0, default: null },
      suite: { type: Number, min: 0, default: null },
    },
    policies: {
      checkInTime: { type: String, default: "14:00" },
      checkOutTime: { type: String, default: "11:00" },
      cancellation: {
        type: String,
        default: "Contact the hotel as early as possible to change or cancel a reservation.",
        maxlength: 1000,
      },
      smoking: {
        type: String,
        default: "Smoking is not permitted in guest rooms.",
        maxlength: 500,
      },
      children: {
        type: String,
        default: "Children are welcome. Contact the hotel for cot availability.",
        maxlength: 500,
      },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const HotelSettings = mongoose.model("HotelSettings", hotelSettingsSchema);

export default HotelSettings;
