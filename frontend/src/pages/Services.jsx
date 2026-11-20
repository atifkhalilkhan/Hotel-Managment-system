/* Staff service request queue and status management. */
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Eye, Play, Plus, RefreshCw, XCircle, BellRing, CarFront, ConciergeBell, Sparkles } from "lucide-react";
import api from "../api/axios.js";
import ServiceRequestModal from "../components/ServiceRequestModal.jsx";
import Pagination from "../components/Pagination.jsx";
import SearchInput from "../components/SearchInput.jsx";
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, Modal, PageHeader, Select, Table, Textarea, Input } from "../components/UI.jsx";
import { formatDateTime, relativeTime } from "../lib/operationsUtils.js";
import { formatMoney } from "../lib/invoiceUtils.js";

const types = [
  { value: "room-service", label: "Room service", Icon: ConciergeBell },
  { value: "wake-up-call", label: "Wake-up call", Icon: BellRing },
  { value: "transportation", label: "Transportation", Icon: CarFront },
  { value: "other", label: "Other", Icon: Sparkles },
];
const statuses = [
  { value: "pending", label: "Pending", tone: "warning" },
  { value: "in-progress", label: "In progress", tone: "primary" },
  { value: "completed", label: "Completed", tone: "success" },
  { value: "cancelled", label: "Cancelled", tone: "neutral" },
];
const typeLabel = Object.fromEntries(types.map(({ value, label }) => [value, label]));
const statusTone = Object.fromEntries(statuses.map(({ value, tone }) => [value, tone]));

function ServiceStatus({ status }) {
  return <Badge tone={statusTone[status] || "neutral"}>{statuses.find((item) => item.value === status)?.label || status}</Badge>;
}

function ServiceType({ type }) {
  const item = types.find((entry) => entry.value === type);
  const Icon = item?.Icon || Sparkles;
  return <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 text-primary-dark" />{item?.label || type}</span>;
}

function RequestActions({ request, busy, onView, onStart, onComplete, onCancel }) {
  return (
    <div className="flex items-center gap-2">
      <IconButton ariaLabel={`View ${request.requestNumber}`} onClick={onView} title="View request"><Eye className="h-4 w-4" /></IconButton>
      {request.status === "pending" && <IconButton ariaLabel={`Start ${request.requestNumber}`} disabled={busy} onClick={onStart} title="Start request">{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}</IconButton>}
      {["pending", "in-progress"].includes(request.status) && <IconButton ariaLabel={`Complete ${request.requestNumber}`} disabled={busy} onClick={onComplete} title="Complete request">{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}</IconButton>}
      {["pending", "in-progress"].includes(request.status) && <IconButton ariaLabel={`Cancel ${request.requestNumber}`} className="text-red-600 hover:border-red-200 hover:bg-red-50" disabled={busy} onClick={onCancel} title="Cancel request"><XCircle className="h-4 w-4" /></IconButton>}
    </div>
  );
}

export default function Services() {
  const [requests, setRequests] = useState([]);
  const [activeReservations, setActiveReservations] = useState([]);
  const [stats, setStats] = useState({ pending: 0, "in-progress": 0, completed: 0, cancelled: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("status");
    return statuses.some((item) => item.value === requested) ? requested : "";
  });
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [staffNotes, setStaffNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState("");
  const requestId = useRef(0);

  const fetchRequests = useCallback(async (silent = false) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (debouncedSearch) params.set("search", debouncedSearch);
    try {
      const [payload, ...counts] = await Promise.all([
        api.get(`/services?${params}`),
        ...statuses.map((item) => api.get(`/services?status=${item.value}&limit=1`)),
      ]);
      if (requestId.current !== id) return;
      setRequests(payload.requests || []);
      setTotal(Number(payload.total || 0));
      setTotalPages(Number(payload.pages || 1));
      setStats(Object.fromEntries(statuses.map((item, index) => [item.value, Number(counts[index]?.total || 0)])));
    } catch (requestError) {
      if (requestId.current === id) setError(requestError.message || "Unable to load service requests.");
    } finally {
      if (requestId.current === id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [debouncedSearch, page, pageSize, status, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchRequests(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchRequests]);

  useEffect(() => {
    let active = true;
    api.get("/reservations?status=checked-in&limit=50")
      .then((payload) => { if (active) setActiveReservations(payload.reservations || []); })
      .catch((requestError) => { if (active) setError(requestError.message || "Unable to load active stays."); });
    return () => { active = false; };
  }, []);

  const changeStatus = async (request, nextStatus, notes = "", chargeAmount) => {
    if (!request) return;
    setBusy(request._id);
    setError("");
    setSuccess("");
    try {
      const payload = await api.patch(`/services/${request._id}/status`, {
        status: nextStatus,
        ...(notes.trim() ? { staffNotes: notes.trim() } : {}),
        ...(chargeAmount !== undefined && chargeAmount !== "" ? { amount: chargeAmount } : {}),
      });
      setSelected((current) => current?._id === request._id ? payload : current);
      setCompleteTarget(null);
      setCancelTarget(null);
      setSuccess(nextStatus === "completed" && payload.chargedToInvoice
        ? `${request.requestNumber} completed and ${formatMoney(payload.amount)} added to the invoice.`
        : `${request.requestNumber} marked ${nextStatus}.`);
      await fetchRequests(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to update service request.");
    } finally {
      setBusy("");
    }
  };

  const openComplete = (request) => {
    setSelected(request);
    setCompleteTarget(request);
    setStaffNotes(request.staffNotes || "");
    setAmount("");
  };
  const clearFilters = () => { setStatus(""); setType(""); setSearch(""); setPage(1); };
  const rowActions = (request) => (
    <RequestActions
      request={request}
      busy={busy === request._id}
      onView={() => setSelected(request)}
      onStart={() => changeStatus(request, "in-progress")}
      onComplete={() => openComplete(request)}
      onCancel={() => setCancelTarget(request)}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${total} service requests`}
        icon={ConciergeBell}
        title="Services"
        action={<div className="flex flex-wrap gap-2"><Button disabled={refreshing} onClick={() => fetchRequests(true)} type="button" variant="outline"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button><Button onClick={() => setFormOpen(true)} type="button"><Plus className="h-4 w-4" />New request</Button></div>}
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert onClose={() => setSuccess("")} type="success">{success}</Alert>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statuses.map((item) => <button aria-pressed={status === item.value} className={`rounded-lg border p-4 text-left shadow-sm hover:border-primary ${status === item.value ? "border-primary bg-primary-soft" : "border-line bg-white"}`} key={item.value} onClick={() => { setStatus(status === item.value ? "" : item.value); setPage(1); }} type="button"><p className="text-sm text-muted">{item.label}</p><p className="mt-2 text-2xl font-semibold">{stats[item.value]}</p></button>)}
      </div>

      <Card className="space-y-3">
        <SearchInput ariaLabel="Search service request number" onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search request number (SRV-0001)" value={search} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select aria-label="Filter by service type" className="sm:max-w-xs" onChange={(event) => { setType(event.target.value); setPage(1); }} value={type}><option value="">All service types</option>{types.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Select aria-label="Filter by status" className="sm:max-w-xs" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="">All statuses</option>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Button onClick={clearFilters} type="button" variant="outline">Clear filters</Button>
        </div>
      </Card>

      {loading ? <Card className="divide-y divide-line p-0">{Array.from({ length: 5 }, (_, index) => <div className="flex h-14 gap-3 p-3" key={index}><div className="w-24 animate-pulse rounded bg-page" /><div className="flex-1 animate-pulse rounded bg-page" /><div className="w-20 animate-pulse rounded bg-page" /></div>)}</Card>
        : requests.length ? (
          <>
            <Card className={`hidden overflow-hidden p-0 transition-opacity lg:block ${refreshing ? "opacity-70" : ""}`}>
              <Table headings={["Request", "Service", "Guest / room", "Scheduled", "Status", "Created", "Actions"]}>
                {requests.map((request) => <tr key={request._id}>
                  <td className="px-4 py-3"><p className="font-medium">{request.requestNumber}</p><p className="max-w-52 truncate text-xs text-muted">{request.details || "No details"}</p></td>
                  <td className="px-4 py-3"><ServiceType type={request.type} /></td>
                  <td className="px-4 py-3"><p className="font-medium">{request.guest?.name || "Guest"}</p><p className="text-xs text-muted">Room {request.room?.roomNumber || "-"}</p></td>
                  <td className="px-4 py-3 text-sm">{request.scheduledFor ? formatDateTime(request.scheduledFor) : "—"}</td>
                  <td className="px-4 py-3"><ServiceStatus status={request.status} /></td>
                  <td className="px-4 py-3 text-sm" title={formatDateTime(request.createdAt)}>{relativeTime(request.createdAt)}</td>
                  <td className="px-4 py-3">{rowActions(request)}</td>
                </tr>)}
              </Table>
            </Card>
            <div className={`grid gap-3 transition-opacity sm:grid-cols-2 lg:hidden ${refreshing ? "opacity-70" : ""}`}>
              {requests.map((request) => <Card className="space-y-3" key={request._id}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium text-muted">{request.requestNumber}</p><h2 className="mt-1 font-semibold"><ServiceType type={request.type} /></h2></div><ServiceStatus status={request.status} /></div>
                <p className="text-sm text-muted">{request.details || "No details provided."}</p>
                <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{request.guest?.name || "Guest"} · Room {request.room?.roomNumber || "-"}</span>{request.scheduledFor && <span>{formatDateTime(request.scheduledFor)}</span>}</div>
                {request.chargedToInvoice && <p className="text-sm font-medium text-green-700">Invoice charge: {formatMoney(request.amount)}</p>}
                <div className="flex items-center justify-between border-t border-line pt-3"><time className="text-xs text-muted" title={formatDateTime(request.createdAt)}>{relativeTime(request.createdAt)}</time>{rowActions(request)}</div>
              </Card>)}
            </div>
            <Pagination itemLabel="requests" onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} totalItems={total} totalPages={totalPages} />
          </>
        ) : <Card><EmptyState icon={Clock3} title="No service requests" description="There are no requests matching these filters." /></Card>}

      <ServiceRequestModal key={formOpen ? "open" : "closed"} initialReservationId={activeReservations.length === 1 ? activeReservations[0]._id : ""} onClose={() => setFormOpen(false)} onCreated={(created) => { setFormOpen(false); setSuccess(`Request ${created.requestNumber} submitted.`); setStatus(""); setType(""); setPage(1); fetchRequests(true); }} open={formOpen} reservations={activeReservations} />
      <Modal onClose={() => setCompleteTarget(null)} open={Boolean(completeTarget)} title="Complete service request">
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <p className="text-sm text-muted">Optionally add staff notes and charge the service to the guest’s unpaid invoice.</p>
          <Textarea label="Staff notes (optional)" maxLength={300} onChange={(event) => setStaffNotes(event.target.value)} rows={3} value={staffNotes} />
          <Input label="Invoice charge amount (optional)" min="0" onChange={(event) => setAmount(event.target.value)} placeholder="Leave blank to complete without a charge" step="0.01" type="number" value={amount} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button disabled={Boolean(busy)} onClick={() => setCompleteTarget(null)} type="button" variant="outline">Cancel</Button><Button loading={busy === completeTarget?._id} onClick={() => changeStatus(completeTarget, "completed", staffNotes, amount)} type="button">Complete request</Button></div>
        </div>
      </Modal>
      <Modal onClose={() => setSelected(null)} open={Boolean(selected) && !completeTarget} title={`Service request ${selected?.requestNumber || ""}`}>
        {selected && <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-wrap items-center justify-between gap-3"><ServiceType type={selected.type} /><ServiceStatus status={selected.status} /></div>
          <div className="grid gap-3 rounded-lg border border-line p-4 text-sm sm:grid-cols-2">
            <p><span className="text-muted">Guest:</span> {selected.guest?.name || "Guest"}</p><p><span className="text-muted">Room:</span> {selected.room?.roomNumber || "-"}</p>
            <p><span className="text-muted">Requested:</span> {formatDateTime(selected.createdAt)}</p><p><span className="text-muted">Scheduled:</span> {selected.scheduledFor ? formatDateTime(selected.scheduledFor) : "Not scheduled"}</p>
          </div>
          <div><p className="text-xs uppercase tracking-wide text-muted">Request details</p><p className="mt-1 whitespace-pre-wrap text-sm">{selected.details || "No details provided."}</p></div>
          {selected.staffNotes && <div><p className="text-xs uppercase tracking-wide text-muted">Staff notes</p><p className="mt-1 whitespace-pre-wrap text-sm">{selected.staffNotes}</p></div>}
          {selected.chargedToInvoice && <p className="text-sm font-medium text-green-700">{formatMoney(selected.amount)} charged to invoice</p>}
          <div className="flex flex-wrap gap-2">
            {selected.status === "pending" && <Button disabled={Boolean(busy)} onClick={() => changeStatus(selected, "in-progress")} type="button" variant="outline"><Play className="h-4 w-4" />Start</Button>}
            {["pending", "in-progress"].includes(selected.status) && <Button onClick={() => openComplete(selected)} type="button"><CheckCircle2 className="h-4 w-4" />Complete</Button>}
            {["pending", "in-progress"].includes(selected.status) && <Button onClick={() => { setCancelTarget(selected); setSelected(null); }} type="button" variant="danger">Cancel request</Button>}
          </div>
        </div>}
      </Modal>
      <ConfirmDialog loading={busy === cancelTarget?._id} onClose={() => setCancelTarget(null)} onConfirm={() => changeStatus(cancelTarget, "cancelled")} open={Boolean(cancelTarget)} title="Cancel service request">
        {error && <Alert>{error}</Alert>}
        Cancel {cancelTarget?.requestNumber} ({typeLabel[cancelTarget?.type] || "service"})?
      </ConfirmDialog>
    </div>
  );
}
