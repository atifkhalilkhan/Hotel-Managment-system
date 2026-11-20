import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getPushPublicKey,
  savePushSubscription,
  removePushSubscription,
} from "../controllers/notificationController.js";

const notificationRoutes = Router();

notificationRoutes.use(protect);
notificationRoutes.get("/push-key", getPushPublicKey);
notificationRoutes.post("/subscribe", savePushSubscription);
notificationRoutes.post("/unsubscribe", removePushSubscription);
notificationRoutes.get("/", getNotifications);
notificationRoutes.patch("/read-all", markAllNotificationsRead);
notificationRoutes.patch("/:id/read", markNotificationRead);

export default notificationRoutes;
