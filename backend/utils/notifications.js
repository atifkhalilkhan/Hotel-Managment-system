import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendPushNotifications } from "./webPush.js";

export async function notifyUsers(recipients, notification, actorId) {
  const excludedActor = actorId ? String(actorId) : null;
  const recipientIds = [...new Set((recipients || []).filter(Boolean).map(String))]
    .filter((id) => id !== excludedActor);
  if (!recipientIds.length) return;

  try {
    const savedNotifications = await Notification.insertMany(recipientIds.map((recipient) => ({
      recipient,
      actor: actorId,
      ...notification,
    })));
    void sendPushNotifications(savedNotifications).catch((error) => {
      console.error("Unable to send web push notifications:", error.message);
    });
  } catch (error) {
    console.error("Unable to save in-app notifications:", error.message);
  }
}

export async function notifyRoles(roles, notification, actorId) {
  try {
    const users = await User.find({ role: { $in: roles }, isActive: true }).select("_id").lean();
    await notifyUsers(users.map((user) => user._id), notification, actorId);
  } catch (error) {
    console.error("Unable to find notification recipients:", error.message);
  }
}
