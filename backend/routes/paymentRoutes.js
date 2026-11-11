import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { createCheckoutSession, verifyPayment } from "../controllers/paymentController.js";

const paymentRoutes = Router();

paymentRoutes.post(
  "/create-checkout-session",
  protect,
  authorize("admin", "receptionist", "guest"),
  createCheckoutSession
);

paymentRoutes.get(
  "/verify/:invoiceId",
  protect,
  authorize("admin", "receptionist", "guest"),
  verifyPayment
);

export default paymentRoutes;