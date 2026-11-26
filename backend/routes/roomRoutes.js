import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  createRoom,
  getRooms,
  getPublicRooms,
  getPublicAvailableRooms,
  getAvailableRooms,
  getRoomById,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
} from "../controllers/roomController.js";

const roomRoutes = Router();

// Public website room catalog; only guest-facing fields are returned.
roomRoutes.get("/public", getPublicRooms);

// Website ka "Check availability": bina login, dates ke hisaab se khali rooms.
// Har search database query hai, is liye ek IP se hadd rakhi hai.
const publicAvailabilityLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many searches. Please wait a minute and try again." },
});
roomRoutes.get("/public/available", publicAvailabilityLimit, getPublicAvailableRooms);

// Sab logged-in users (guest ko controller sirf available rooms dikhata hai)
roomRoutes.get("/", protect, getRooms);

// "/available" ko "/:id" se PEHLE likhna zaroori hai
roomRoutes.get("/available", protect, getAvailableRooms);

roomRoutes.get("/:id", protect, getRoomById);

// Admin aur manager: room banana aur edit (tasveerein upload ke saath)
roomRoutes.post(
  "/",
  protect,
  authorize("admin", "manager"),
  upload.array("images", 5),
  createRoom
);

roomRoutes.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  upload.array("images", 5),
  updateRoom
);

// Status: reception aur housekeeping bhi badal sakte hain
roomRoutes.patch(
  "/:id/status",
  protect,
  authorize("admin", "manager", "receptionist", "housekeeping"),
  updateRoomStatus
);

// Delete sirf admin
roomRoutes.delete("/:id", protect, authorize("admin"), deleteRoom);

export default roomRoutes;
