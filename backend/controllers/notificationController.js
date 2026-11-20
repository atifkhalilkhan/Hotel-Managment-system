import Notification from "../models/Notification.js";
import PushSubscription from "../models/PushSubscription.js";
import { getVapidPublicKey, isSupportedPushEndpoint } from "../utils/webPush.js";

export const getPushPublicKey = (req, res, next) => {
  try {
    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      return res.status(503).json({ message: "Web Push is not configured on the server yet" });
    }
    return res.json({ publicKey });
  } catch (error) {
    return next(error);
  }
};

export const savePushSubscription = async (req, res, next) => {
  try {
    const subscription = req.body?.subscription;
    if (
      !subscription ||
      typeof subscription.endpoint !== "string" ||
      subscription.endpoint.length > 2048 ||
      typeof subscription.keys?.p256dh !== "string" ||
      !subscription.keys.p256dh ||
      subscription.keys.p256dh.length > 200 ||
      typeof subscription.keys?.auth !== "string" ||
      !subscription.keys.auth ||
      subscription.keys.auth.length > 100
    ) {
      return res.status(400).json({ message: "A valid push subscription is required" });
    }

    if (!isSupportedPushEndpoint(subscription.endpoint)) {
      return res.status(400).json({ message: "Push subscription endpoint is invalid or unsupported" });
    }

    try {
      await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint, user: req.user._id },
        {
          $set: {
            endpoint: subscription.endpoint,
            expirationTime: Number.isFinite(subscription.expirationTime) ? subscription.expirationTime : null,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          $setOnInsert: { user: req.user._id },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "This device is registered to another account. Disable its push subscription first." });
      }
      throw error;
    }

    return res.status(200).json({ message: "Push notifications enabled for this device" });
  } catch (error) {
    return next(error);
  }
};

export const removePushSubscription = async (req, res, next) => {
  try {
    const endpoint = req.body?.endpoint;
    if (typeof endpoint !== "string" || !endpoint) {
      return res.status(400).json({ message: "Push subscription endpoint is required" });
    }

    await PushSubscription.deleteOne({ endpoint, user: req.user._id });
    return res.json({ message: "Push notifications disabled for this device" });
  } catch (error) {
    return next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const filter = { recipient: req.user._id };
    if (req.query.filter === "unread") filter.readAt = null;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, readAt: null }),
    ]);

    res.json({
      notifications,
      page,
      pages: Math.ceil(total / limit),
      total,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ message: "Notifications marked as read", updated: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};
