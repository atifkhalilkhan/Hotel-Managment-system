/* Persistent notification inbox with per-device Web Push controls. */
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  CalendarCheck,
  Check,
  ConciergeBell,
  FileText,
  MessageSquareQuote,
  Wrench,
  X,
} from "lucide-react";
import api from "../api/axios.js";
import { navigate } from "../router.js";

const toApplicationServerKey = (key) => {
  const padded = key.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(key.length / 4) * 4, "=");
  const raw = window.atob(padded);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
};

const iconByType = {
  booking: CalendarCheck,
  invoice: FileText,
  payment: FileText,
  service: ConciergeBell,
  maintenance: Wrench,
  housekeeping: ConciergeBell,
  feedback: MessageSquareQuote,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permission, setPermission] = useState(() => (
    typeof window !== "undefined" && "Notification" in window ? window.Notification.permission : "unsupported"
  ));
  const [pushSupported] = useState(() => (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "PushManager" in window &&
    "serviceWorker" in navigator &&
    window.isSecureContext
  ));
  const [pushStatus, setPushStatus] = useState(pushSupported ? "checking" : "unsupported");
  const [pushBusy, setPushBusy] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      try {
        const payload = await api.get("/notifications?page=1&limit=8");
        if (!active) return;
        const nextNotifications = payload.notifications || [];
        setNotifications(nextNotifications);
        setUnreadCount(Number(payload.unreadCount || 0));
        setError("");
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load notifications.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 20000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!pushSupported) return undefined;

    let active = true;
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await api.post("/notifications/subscribe", { subscription: subscription.toJSON() });
        }
        if (active) {
          setPermission(window.Notification.permission);
          setPushStatus(subscription ? "enabled" : "ready");
        }
      } catch (requestError) {
        if (active) {
          setPushStatus("ready");
          setError(requestError.message || "Unable to initialize Web Push on this device.");
        }
      }
    };

    checkSubscription();
    return () => {
      active = false;
    };
  }, [pushSupported]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const enablePush = async () => {
    if (!pushSupported) {
      setError("Web Push requires HTTPS and a browser that supports push notifications.");
      return;
    }

    setPushBusy(true);
    try {
      const nextPermission = permission === "granted"
        ? "granted"
        : await window.Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        setPushStatus("ready");
        if (nextPermission === "denied") setError("Notifications are blocked. Allow them in your browser or device settings.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const { publicKey } = await api.get("/notifications/push-key");
        if (!publicKey) throw new Error("The server did not provide a Web Push public key.");
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toApplicationServerKey(publicKey),
        });
      }

      await api.post("/notifications/subscribe", { subscription: subscription.toJSON() });
      setPushStatus("enabled");
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to enable push notifications.");
      setPushStatus("ready");
    } finally {
      setPushBusy(false);
    }
  };

  const disablePush = async () => {
    setPushBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api.post("/notifications/unsubscribe", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setPushStatus("ready");
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to disable push notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  const markRead = async (item) => {
    setOpen(false);
    if (!item.readAt) {
      try {
        await api.patch(`/notifications/${item._id}/read`, {});
        setNotifications((current) => current.map((entry) => entry._id === item._id ? { ...entry, readAt: new Date().toISOString() } : entry));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (requestError) {
        setError(requestError.message || "Unable to mark notification as read.");
        return;
      }
    }
    if (item.link) navigate(item.link);
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all", {});
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || readAt })));
      setUnreadCount(0);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to mark notifications as read.");
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:bg-page"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {unreadCount ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <section aria-label="Recent notifications" className="absolute right-[-3rem] top-[calc(100%+0.5rem)] z-50 flex max-h-[min(34rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl sm:top-[calc(100%+0.75rem)] lg:right-0" role="dialog">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div><h2 className="font-semibold">Notifications</h2><p className="text-xs text-muted">{unreadCount} unread</p></div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && <button aria-label="Mark all notifications read" className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-dark hover:bg-primary-soft" onClick={markAllRead} title="Mark all as read" type="button"><Check className="h-5 w-5" /></button>}
              <button aria-label="Close notifications" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-page" onClick={() => setOpen(false)} type="button"><X className="h-5 w-5" /></button>
            </div>
          </div>

          {error && <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}
          {pushSupported ? (
            <div className="flex items-center justify-between gap-3 border-b border-line bg-page/70 px-4 py-3">
              <p className="min-w-0 break-words text-xs text-muted">
                {permission === "denied"
                  ? "Notifications are blocked in browser settings."
                  : pushStatus === "enabled"
                    ? "Web Push is enabled on this device."
                    : "Get booking and hotel updates, even when the app is closed."}
              </p>
              {permission !== "denied" && (
                <button
                  className="shrink-0 text-xs font-semibold text-primary-dark disabled:opacity-50"
                  disabled={pushBusy || pushStatus === "checking"}
                  onClick={pushStatus === "enabled" ? disablePush : enablePush}
                  type="button"
                >
                  {pushBusy ? "Saving..." : pushStatus === "enabled" ? "Turn off" : "Enable"}
                </button>
              )}
            </div>
          ) : <p className="border-b border-line bg-page/70 px-4 py-3 text-xs text-muted">Web Push needs a secure HTTPS connection and a supported browser.</p>}

          <div className="overflow-y-auto">
            {loading ? <div className="space-y-3 p-4"><div className="h-14 animate-pulse rounded-lg bg-page" /><div className="h-14 animate-pulse rounded-lg bg-page" /><div className="h-14 animate-pulse rounded-lg bg-page" /></div>
              : notifications.length ? notifications.map((item) => {
                const Icon = iconByType[item.type] || Bell;
                return (
                  <button className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-page ${item.readAt ? "" : "bg-primary-soft/50"}`} key={item._id} onClick={() => markRead(item)} type="button">
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.readAt ? "bg-page text-muted" : "bg-primary-soft text-primary-dark"}`}><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2"><span className="min-w-0 break-words text-sm font-semibold">{item.title}</span>{!item.readAt && <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}</span>
                      <span className="mt-0.5 block break-words text-xs leading-5 text-muted">{item.message}</span>
                      <time className="mt-1 block break-words text-[10px] text-muted">{new Date(item.createdAt).toLocaleString()}</time>
                    </span>
                  </button>
                );
              }) : <div className="px-5 py-10 text-center"><Bell className="mx-auto h-8 w-8 text-muted/50" /><p className="mt-3 text-sm font-medium">You’re all caught up</p><p className="mt-1 text-xs text-muted">New updates will appear here.</p></div>}
          </div>

          <button className="h-11 shrink-0 border-t border-line text-sm font-semibold text-primary-dark hover:bg-page" onClick={() => { setOpen(false); navigate("/notifications"); }} type="button">View all notifications</button>
        </section>
      )}
    </div>
  );
}
