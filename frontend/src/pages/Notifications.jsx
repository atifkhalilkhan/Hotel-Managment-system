/* Full notification history with unread filtering and read actions. */
import { useCallback, useEffect, useState } from "react";
import { Bell, Check, CheckCheck, ConciergeBell, FileText, MessageSquareQuote, CalendarCheck, Wrench, RefreshCw } from "lucide-react";
import api from "../api/axios.js";
import Pagination from "../components/Pagination.jsx";
import { Alert, Button, Card, EmptyState, PageHeader, Select } from "../components/UI.jsx";
import { navigate } from "../router.js";

const typeIcons = {
  booking: CalendarCheck,
  invoice: FileText,
  payment: FileText,
  service: ConciergeBell,
  maintenance: Wrench,
  housekeeping: ConciergeBell,
  feedback: MessageSquareQuote,
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (filter === "unread") params.set("filter", "unread");
    try {
      const payload = await api.get(`/notifications?${params}`);
      setItems(payload.notifications || []);
      setTotal(Number(payload.total || 0));
      setTotalPages(Number(payload.pages || 1));
      setUnreadCount(Number(payload.unreadCount || 0));
    } catch (requestError) {
      setError(requestError.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, page, pageSize]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchNotifications(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all", {});
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to mark notifications as read.");
    }
  };

  const openNotification = async (item) => {
    if (!item.readAt) {
      try {
        await api.patch(`/notifications/${item._id}/read`, {});
        setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, readAt: new Date().toISOString() } : entry));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (requestError) {
        setError(requestError.message || "Unable to mark notification as read.");
        return;
      }
    }
    if (item.link) navigate(item.link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description={unreadCount ? `${unreadCount} unread updates` : "You are up to date."}
        icon={Bell}
        title="Notifications"
        action={<div className="flex gap-2"><Button disabled={refreshing} onClick={() => fetchNotifications(true)} type="button" variant="outline"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button>{unreadCount > 0 && <Button onClick={markAllRead} type="button" variant="outline"><CheckCheck className="h-4 w-4" />Mark all read</Button>}</div>}
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Select className="sm:max-w-xs" label="Show" onChange={(event) => { setFilter(event.target.value); setPage(1); }} value={filter}>
          <option value="all">All notifications</option><option value="unread">Unread only</option>
        </Select>
        <p className="text-sm text-muted">{total} notification{total === 1 ? "" : "s"}</p>
      </Card>

      {loading ? <Card className="space-y-3">{Array.from({ length: 5 }, (_, index) => <div className="h-16 animate-pulse rounded-lg bg-page" key={index} />)}</Card>
        : items.length ? (
          <>
            <Card className="divide-y divide-line p-0">
              {items.map((item) => {
                const Icon = typeIcons[item.type] || Bell;
                return (
                  <div className={`flex items-start gap-3 p-4 sm:gap-4 ${item.readAt ? "" : "bg-primary-soft/30"}`} key={item._id}>
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.readAt ? "bg-page text-muted" : "bg-primary-soft text-primary-dark"}`}><Icon className="h-5 w-5" /></span>
                    <button className="min-w-0 flex-1 text-left" onClick={() => openNotification(item)} type="button">
                      <span className="flex flex-wrap items-center gap-2"><span className="font-semibold">{item.title}</span>{!item.readAt && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary-dark">New</span>}</span>
                      <span className="mt-1 block text-sm text-muted">{item.message}</span>
                      <time className="mt-2 block text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</time>
                    </button>
                    {!item.readAt && <Button aria-label={`Mark ${item.title} as read`} className="h-10 min-h-10 w-10 shrink-0 px-0" onClick={async () => {
                      try {
                        await api.patch(`/notifications/${item._id}/read`, {});
                        setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, readAt: new Date().toISOString() } : entry));
                        setUnreadCount((count) => Math.max(0, count - 1));
                      } catch (requestError) {
                        setError(requestError.message || "Unable to mark notification as read.");
                      }
                    }} title="Mark as read" type="button" variant="outline"><Check className="h-4 w-4" /></Button>}
                  </div>
                );
              })}
            </Card>
            <Pagination itemLabel="notifications" onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} totalItems={total} totalPages={totalPages} />
          </>
        ) : <Card><EmptyState icon={Bell} title="No notifications" description={filter === "unread" ? "You have no unread notifications." : "Updates from your hotel activity will appear here."} /></Card>}
    </div>
  );
}
