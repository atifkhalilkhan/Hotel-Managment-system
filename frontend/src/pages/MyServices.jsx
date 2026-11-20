/* Guest service requests for an active hotel stay. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, CarFront, ConciergeBell, Eye, RefreshCw, Sparkles, XCircle } from "lucide-react";
import api from "../api/axios.js";
import ServiceRequestModal from "../components/ServiceRequestModal.jsx";
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, Modal, PageHeader } from "../components/UI.jsx";
import { formatDateTime, relativeTime } from "../lib/operationsUtils.js";

const filters = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
const typeMeta = {
  "room-service": { label: "Room service", Icon: ConciergeBell },
  "wake-up-call": { label: "Wake-up call", Icon: BellRing },
  transportation: { label: "Transportation", Icon: CarFront },
  other: { label: "Other", Icon: Sparkles },
};
const statusTones = { pending: "warning", "in-progress": "primary", completed: "success", cancelled: "neutral" };

function RequestType({ type }) {
  const { label, Icon } = typeMeta[type] || typeMeta.other;
  return <span className="inline-flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-primary-dark" />{label}</span>;
}

export default function MyServices() {
  const [requests, setRequests] = useState([]);
  const [activeReservations, setActiveReservations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    try {
      const [serviceRequests, reservations] = await Promise.all([
        api.get("/services/my"),
        api.get("/reservations/my"),
      ]);
      setRequests(serviceRequests || []);
      setActiveReservations((reservations || []).filter((reservation) => reservation.status === "checked-in"));
    } catch (requestError) {
      setError(requestError.message || "Unable to load your service requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const visibleRequests = useMemo(
    () => filter === "all" ? requests : requests.filter((request) => request.status === filter),
    [filter, requests]
  );

  const cancelRequest = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.patch(`/services/${cancelTarget._id}/cancel`, {});
      setSuccess(result.message || "Service request cancelled.");
      setCancelTarget(null);
      setSelected((current) => current?._id === cancelTarget._id ? { ...current, status: "cancelled" } : current);
      await fetchData(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to cancel this request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description="Request room service, transportation, wake-up calls, and more during your stay."
        icon={ConciergeBell}
        title="My Services"
        action={<div className="flex gap-2"><Button disabled={refreshing} onClick={() => fetchData(true)} type="button" variant="outline"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button><Button disabled={!activeReservations.length} onClick={() => setFormOpen(true)} type="button"><ConciergeBell className="h-4 w-4" />Request service</Button></div>}
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert onClose={() => setSuccess("")} type="success">{success}</Alert>}

      {activeReservations.length > 0 && (
        <Card className="border-primary/20 bg-primary-soft">
          <p className="text-sm font-semibold text-primary-dark">Your active stay</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-primary-dark">
            {activeReservations.map((reservation) => <span key={reservation._id}>{reservation.bookingCode} · Room {reservation.room?.roomNumber || "-"}</span>)}
          </div>
        </Card>
      )}

      <Card className="p-3 sm:p-4">
        <div aria-label="Filter service requests" className="flex flex-wrap gap-2" role="group">
          {filters.map((item) => <button aria-pressed={filter === item.value} className={`min-h-11 rounded-full px-4 text-sm font-medium ${filter === item.value ? "bg-primary text-white" : "border border-line bg-white hover:bg-page"}`} key={item.value} onClick={() => setFilter(item.value)} type="button">{item.label}</button>)}
        </div>
      </Card>

      {loading ? <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Card className="h-48 animate-pulse bg-page" key={index} />)}</div>
        : visibleRequests.length ? (
          <div className={`grid gap-4 sm:grid-cols-2 transition-opacity ${refreshing ? "opacity-70" : ""}`}>
            {visibleRequests.map((request) => (
              <Card className="space-y-4" key={request._id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-xs font-medium text-muted">{request.requestNumber} · Room {request.room?.roomNumber || "-"}</p><h2 className="mt-2"><RequestType type={request.type} /></h2></div>
                  <Badge tone={statusTones[request.status] || "neutral"}>{filters.find((item) => item.value === request.status)?.label || request.status}</Badge>
                </div>
                <p className="line-clamp-3 min-h-12 text-sm text-muted">{request.details || (request.type === "wake-up-call" ? "Wake-up call requested." : "No additional details.")}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <time title={formatDateTime(request.createdAt)}>{relativeTime(request.createdAt)}</time>
                  {request.scheduledFor && <span>Scheduled: {formatDateTime(request.scheduledFor)}</span>}
                </div>
                {request.staffNotes && <p className="rounded-lg bg-page p-3 text-sm"><span className="font-medium">Staff note:</span> {request.staffNotes}</p>}
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <IconButton ariaLabel={`View ${request.requestNumber}`} onClick={() => setSelected(request)} title="View request"><Eye className="h-4 w-4" /></IconButton>
                  {request.status === "pending" && <Button className="h-10 min-h-10 px-3" onClick={() => setCancelTarget(request)} type="button" variant="outline"><XCircle className="h-4 w-4" />Cancel</Button>}
                </div>
              </Card>
            ))}
          </div>
        ) : <Card><EmptyState icon={ConciergeBell} title="No service requests" description={filter === "all" ? "You have not requested any services yet." : `There are no ${filter.replace("-", " ")} requests.`} /></Card>}

      {!loading && !activeReservations.length && (
        <Alert type="info">You can request hotel services once you have checked in to a reservation.</Alert>
      )}

      <ServiceRequestModal
        key={formOpen ? "open" : "closed"}
        initialReservationId={activeReservations.length === 1 ? activeReservations[0]._id : ""}
        onClose={() => setFormOpen(false)}
        onCreated={(created) => {
          setFormOpen(false);
          setFilter("all");
          setSuccess(`Request ${created.requestNumber} submitted.`);
          fetchData(true);
        }}
        open={formOpen}
        reservations={activeReservations}
      />
      <Modal onClose={() => setSelected(null)} open={Boolean(selected)} title={`Service request ${selected?.requestNumber || ""}`}>
        {selected && <div className="space-y-4">
          <div className="flex items-center justify-between gap-3"><RequestType type={selected.type} /><Badge tone={statusTones[selected.status] || "neutral"}>{selected.status}</Badge></div>
          <p className="whitespace-pre-wrap text-sm text-muted">{selected.details || "No details provided."}</p>
          {selected.scheduledFor && <p className="text-sm"><span className="text-muted">Scheduled:</span> {formatDateTime(selected.scheduledFor)}</p>}
          {selected.staffNotes && <p className="rounded-lg bg-page p-3 text-sm"><span className="font-medium">Staff note:</span> {selected.staffNotes}</p>}
        </div>}
      </Modal>
      <ConfirmDialog loading={busy} onClose={() => setCancelTarget(null)} onConfirm={cancelRequest} open={Boolean(cancelTarget)} title="Cancel service request">
        Cancel {cancelTarget?.requestNumber}? You can only cancel a request while it is pending.
      </ConfirmDialog>
    </div>
  );
}
