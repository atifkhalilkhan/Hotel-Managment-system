import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createReservation,
  getReservations,
  getMyReservations,
  getReservationById,
  cancelReservation,
  checkIn,
  checkOut,
} from "../controllers/reservationController.js";

const reservationRoutes = Router();

// Booking banana: staff kisi bhi guest ke liye, guest sirf apne liye
reservationRoutes.post(
  "/",
  protect,
  authorize("admin", "manager", "receptionist", "guest"),
  createReservation
);

// Sab bookings: sirf staff
reservationRoutes.get(
  "/",
  protect,
  authorize("admin", "manager", "receptionist"),
  getReservations
);

// Guest ki apni bookings ("/my" ko "/:id" se PEHLE likhna zaroori hai)
reservationRoutes.get("/my", protect, authorize("guest"), getMyReservations);

// Ek booking (controller guest ko sirf apni dikhata hai)
reservationRoutes.get(
  "/:id",
  protect,
  authorize("admin", "manager", "receptionist", "guest"),
  getReservationById
);

// Cancel: staff ya apna guest
reservationRoutes.patch(
  "/:id/cancel",
  protect,
  authorize("admin", "manager", "receptionist", "guest"),
  cancelReservation
);

// Check-in aur check-out: sirf staff
reservationRoutes.patch(
  "/:id/check-in",
  protect,
  authorize("admin", "manager", "receptionist"),
  checkIn
);

reservationRoutes.patch(
  "/:id/check-out",
  protect,
  authorize("admin", "manager", "receptionist"),
  checkOut
);

export default reservationRoutes;