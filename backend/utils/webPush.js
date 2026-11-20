import webPush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

let configuredKeys;

export function isSupportedPushEndpoint(value) {
  let endpoint;
  try {
    endpoint = new URL(value);
  } catch {
    return false;
  }

  const host = endpoint.hostname.toLowerCase();
  const allowedPushHost = host === "fcm.googleapis.com" ||
    host === "push.services.mozilla.com" ||
    host.endsWith(".push.services.mozilla.com") ||
    host.endsWith(".notify.windows.com") ||
    host.endsWith(".push.apple.com");

  return endpoint.protocol === "https:" &&
    allowedPushHost &&
    !endpoint.username &&
    !endpoint.password &&
    !endpoint.port;
}

export function getVapidPublicKey() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return null;

  const fingerprint = `${subject}:${publicKey}:${privateKey}`;
  if (configuredKeys !== fingerprint) {
    webPush.setVapidDetails(subject, publicKey, privateKey);
    configuredKeys = fingerprint;
  }

  return publicKey;
}

export async function sendPushNotifications(notifications) {
  if (!getVapidPublicKey() || !notifications.length) return;

  const recipientIds = [...new Set(notifications.map((item) => String(item.recipient)))];
  const subscriptions = await PushSubscription.find({ user: { $in: recipientIds } }).lean();
  const notificationsByRecipient = new Map(
    notifications.map((item) => [String(item.recipient), item])
  );

  await Promise.all(subscriptions.map(async (subscription) => {
    const notification = notificationsByRecipient.get(String(subscription.user));
    if (!notification) return;

    const url = notification.link?.startsWith("/") ? notification.link : "/notifications";
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: "/icons/pwa-192.png",
      badge: "/icons/pwa-badge.svg",
      tag: `notification-${notification._id}`,
      data: { url },
    });

    try {
      await webPush.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        payload,
        { TTL: 60 * 60 * 24, urgency: "high" }
      );
    } catch (error) {
      if ([404, 410].includes(error.statusCode)) {
        await PushSubscription.deleteOne({ _id: subscription._id });
      } else {
        console.error("Unable to deliver web push notification:", error.message);
      }
    }
  }));
}

