import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  createRoom,
  getRooms,
  getAvailableRooms,
  getRoomById,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
} from "../controllers/roomController.js";

const roomRoutes = Router();

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