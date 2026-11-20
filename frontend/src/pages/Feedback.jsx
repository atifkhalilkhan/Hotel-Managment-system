/* Admin and manager moderation queue for guest and website feedback. */
import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, MessageSquareQuote, RefreshCw, ShieldCheck, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import api from "../api/axios.js";
import Pagination from "../components/Pagination.jsx";
import { Alert, Badge, Button, Card, EmptyState, Modal, PageHeader, Select, Textarea } from "../components/UI.jsx";
import { formatDateTime, relativeTime } from "../lib/operationsUtils.js";

const filters = [
  { value: "", label: "All feedback" },
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];
const tones = { pending: "warning", approved: "success", rejected: "error" };

function Rating({ value }) {
  return (
    <span aria-label={`${value} out of 5 stars`} className="inline-flex items-center gap-0.5 text-primary">
      {Array.from({ length: 5 }, (_, index) => <Star className={`h-4 w-4 ${index < value ? "fill-primary" : "text-line"}`} key={index} />)}
      <span className="ml-1 text-sm font-medium text-ink">{value}/5</span>
    </span>
  );
}

export default function Feedback() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const latestRequest = useRef(0);

  const fetchFeedback = useCallback(async (silent = false) => {
    const id = ++latestRequest.current;
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (filter) params.set("status", filter);
    try {
      const [payload, pending, approved, rejected] = await Promise.all([
        api.get(`/feedback?${params}`),
        api.get("/feedback?status=pending&limit=1"),
        api.get("/feedback?status=approved&limit=1"),
        api.get("/feedback?status=rejected&limit=1"),
      ]);
      if (latestRequest.current !== id) return;
      setItems(payload.feedback || []);
      setTotal(Number(payload.total || 0));
      setTotalPages(Number(payload.pages || 1));
      setStats({
        pending: Number(pending.total || 0),
        approved: Number(approved.total || 0),
        rejected: Number(rejected.total || 0),
      });
    } catch (requestError) {
      if (latestRequest.current === id) setError(requestError.message || "Unable to load feedback.");
    } finally {
      if (latestRequest.current === id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filter, page, pageSize]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchFeedback(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchFeedback]);

  const moderate = async (status) => {
    if (!selected) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/feedback/${selected._id}/moderate`, {
        status,
        ...(moderationNotes.trim() ? { moderationNotes: moderationNotes.trim() } : {}),
      });
      setSuccess(status === "approved" ? "Feedback approved and now eligible for public display." : "Feedback rejected and hidden from public display.");
      setSelected(null);
      setModerationNotes("");
      await fetchFeedback(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to update feedback status.");
    } finally {
      setBusy(false);
    }
  };

  const openReview = (item) => {
    setSelected(item);
    setModerationNotes(item.moderationNotes || "");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review guest and website submissions before they appear publicly."
        icon={MessageSquareQuote}
        title="Feedback moderation"
        action={<Button disabled={refreshing} onClick={() => fetchFeedback(true)} type="button" variant="outline"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button>}
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert onClose={() => setSuccess("")} type="success">{success}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { key: "pending", label: "Pending review", Icon: MessageSquareQuote },
          { key: "approved", label: "Approved", Icon: BadgeCheck },
          { key: "rejected", label: "Rejected", Icon: ThumbsDown },
        ].map(({ key, label, Icon }) => (
          <button aria-pressed={filter === key} className={`rounded-lg border p-4 text-left shadow-sm hover:border-primary ${filter === key ? "border-primary bg-primary-soft" : "border-line bg-white"}`} key={key} onClick={() => { setFilter(filter === key ? "" : key); setPage(1); }} type="button">
            <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary-dark" /><div><p className="text-sm text-muted">{label}</p><p className="text-2xl font-semibold">{stats[key]}</p></div></div>
          </button>
        ))}
      </div>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Select className="sm:max-w-xs" label="Filter feedback" onChange={(event) => { setFilter(event.target.value); setPage(1); }} value={filter}>
          {filters.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
        </Select>
        <p className="text-sm text-muted">{total} submission{total === 1 ? "" : "s"}</p>
      </Card>

      {loading ? <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Card className="h-48 animate-pulse bg-page" key={index} />)}</div>
        : items.length ? (
          <>
            <div className={`grid gap-4 md:grid-cols-2 transition-opacity ${refreshing ? "opacity-70" : ""}`}>
              {items.map((item) => (
                <Card className="flex flex-col gap-4" key={item._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-semibold">{item.displayName || item.guest?.name || "Guest"}</p><p className="mt-1 text-xs text-muted">{item.source === "website" ? "Website submission" : "Guest portal"}{item.reservation?.bookingCode ? ` · ${item.reservation.bookingCode}` : ""}</p></div>
                    <Badge tone={tones[item.status] || "neutral"}>{item.status}</Badge>
                  </div>
                  <Rating value={item.rating} />
                  <p className="line-clamp-4 min-h-20 whitespace-pre-wrap text-sm text-muted">{item.message}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <div className="text-xs text-muted">
                      <time title={formatDateTime(item.createdAt)}>{relativeTime(item.createdAt)}</time>
                      {item.verifiedStay && <span className="ml-2 inline-flex items-center gap-1 text-green-700"><ShieldCheck className="h-3.5 w-3.5" />Verified stay</span>}
                    </div>
                    <Button className="h-10 min-h-10 px-3" onClick={() => openReview(item)} type="button" variant="outline">Review</Button>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination itemLabel="feedback" onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} totalItems={total} totalPages={totalPages} />
          </>
        ) : <Card><EmptyState icon={MessageSquareQuote} title="No feedback found" description={filter ? `There are no ${filter} submissions.` : "Guest and website feedback will appear here."} /></Card>}

      <Modal onClose={() => setSelected(null)} open={Boolean(selected)} title="Review feedback">
        {selected && <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-semibold">{selected.displayName || selected.guest?.name || "Guest"}</p><p className="text-sm text-muted">{selected.source === "website" ? "Website submission" : "Guest portal"}{selected.reservation?.bookingCode ? ` · ${selected.reservation.bookingCode}` : ""}</p></div>
            <Badge tone={tones[selected.status] || "neutral"}>{selected.status}</Badge>
          </div>
          <Rating value={selected.rating} />
          <p className="whitespace-pre-wrap rounded-lg bg-page p-4 text-sm">{selected.message}</p>
          {selected.verifiedStay && <Badge tone="success"><span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Verified stay</span></Badge>}
          <Textarea label="Internal moderation note (optional)" maxLength={300} onChange={(event) => setModerationNotes(event.target.value)} rows={3} value={moderationNotes} />
          {selected.reviewedBy?.name && <p className="text-xs text-muted">Last reviewed by {selected.reviewedBy.name}{selected.reviewedAt ? ` · ${formatDateTime(selected.reviewedAt)}` : ""}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button disabled={busy} onClick={() => setSelected(null)} type="button" variant="outline">Close</Button>
            {selected.status !== "rejected" && <Button disabled={busy} onClick={() => moderate("rejected")} type="button" variant="danger"><ThumbsDown className="h-4 w-4" />Reject</Button>}
            {selected.status !== "approved" && <Button loading={busy} onClick={() => moderate("approved")} type="button"><ThumbsUp className="h-4 w-4" />Approve for website</Button>}
          </div>
        </div>}
      </Modal>
    </div>
  );
}
