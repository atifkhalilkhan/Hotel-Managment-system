/* Staff maintenance request board with status workflow and issue reporting. */
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Eye, LoaderCircle, MapPin, Play, RefreshCw, Wrench, XCircle } from "lucide-react";
import api from "../api/axios.js";
import MaintenanceDetailsModal from "../components/MaintenanceDetailsModal.jsx";
import { MaintenanceStatusBadge } from "../components/OperationBadges.jsx";
import Pagination from "../components/Pagination.jsx";
import ReportIssueModal from "../components/ReportIssueModal.jsx";
import SearchInput from "../components/SearchInput.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, Modal, PageHeader, Select, Table, Textarea } from "../components/UI.jsx";
import { formatDateTime, relativeTime } from "../lib/operationsUtils.js";

const ticketStatuses = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "cancelled", label: "Cancelled" },
];

function MaintenanceActions({ request, canManage, busy, onView, onStart, onResolve, onCancel }) {
  return (
    <div className="flex items-center gap-2">
      <IconButton ariaLabel={`View ${request.ticketNumber}`} onClick={onView} title="View"><Eye className="h-4 w-4" /></IconButton>
      {canManage && request.status === "open" && <IconButton ariaLabel={`Start ${request.ticketNumber}`} disabled={busy} onClick={onStart} title="Start">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}</IconButton>}
      {canManage && ["open", "in-progress"].includes(request.status) && <IconButton ariaLabel={`Resolve ${request.ticketNumber}`} disabled={busy} onClick={onResolve} title="Resolve">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}</IconButton>}
      {canManage && ["open", "in-progress"].includes(request.status) && <IconButton ariaLabel={`Cancel ${request.ticketNumber}`} className="text-red-600 hover:border-red-200 hover:bg-red-50" disabled={busy} onClick={onCancel} title="Cancel">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}</IconButton>}
    </div>
  );
}

export default function Maintenance({ role = "receptionist" }) {
  const canManage = ["admin", "manager"].includes(role);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ open: 0, "in-progress": 0, resolved: 0, cancelled: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("status");
    return ticketStatuses.some((item) => item.value === requested) ? requested : "";
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busy, setBusy] = useState("");
  const requestId = useRef(0);

  const fetchRequests = useCallback(async (silent = false) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (status) params.set("status", status);
    if (debouncedSearch) params.set("search", debouncedSearch);
    try {
      const [payload, ...counts] = await Promise.all([
        api.get(`/maintenance?${params}`),
        ...ticketStatuses.map((item) => api.get(`/maintenance?status=${item.value}&limit=1`)),
      ]);
      if (requestId.current !== id) return;
      setRequests(payload.requests || []);
      setTotal(Number(payload.total || 0));
      setTotalPages(Number(payload.pages || 1));
      setStats(Object.fromEntries(ticketStatuses.map((item, index) => [item.value, Number(counts[index]?.total || 0)])));
    } catch (requestError) {
      if (requestId.current === id) setError(requestError.message || "Unable to load maintenance requests.");
    } finally {
      if (requestId.current === id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [debouncedSearch, page, pageSize, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchRequests(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchRequests]);

  const changeStatus = async (request, nextStatus, notes = "") => {
    setBusy(request._id);
    setError("");
    setSuccess("");
    try {
      const payload = await api.patch(`/maintenance/${request._id}/status`, { status: nextStatus, ...(notes ? { resolutionNotes: notes } : {}) });
      setSelected((current) => current?._id === request._id ? { ...current, ...(payload.request || {}), status: payload.status || nextStatus, ...(notes ? { resolutionNotes: notes } : {}) } : current);
      setSuccess(payload.message || `Request ${nextStatus}.`);
      setResolveOpen(false);
      setCancelTarget(null);
      if (request.blocksRoom && ["resolved", "cancelled"].includes(nextStatus) && request.room?.roomNumber) {
        setSuccess(`${payload.message || `Request ${nextStatus}.`} If this ticket was blocking Room ${request.room.roomNumber}, the room is available again.`);
      }
      await fetchRequests(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to update maintenance request.");
    } finally {
      setBusy("");
    }
  };

  const rowActions = (request) => (
    <MaintenanceActions
      request={request}
      canManage={canManage}
      busy={busy === request._id}
      onView={() => setSelected(request)}
      onStart={() => changeStatus(request, "in-progress")}
      onResolve={() => { setSelected(request); setResolutionNotes(request.resolutionNotes || ""); setResolveOpen(true); }}
      onCancel={() => setCancelTarget(request)}
    />
  );

  const clearFilters = () => { setStatus(""); setSearch(""); setPage(1); };

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${total} maintenance requests`}
        icon={Wrench}
        title="Maintenance"
        action={<div className="flex flex-wrap gap-2"><Button disabled={refreshing} onClick={() => fetchRequests(true)} type="button" variant="outline"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button><Button onClick={() => setReportOpen(true)} type="button"><AlertTriangle className="h-4 w-4" />Report Issue</Button></div>}
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert onClose={() => setSuccess("")} type="success">{success}</Alert>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {ticketStatuses.map((item) => <button className={`rounded-lg border p-4 text-left shadow-sm hover:border-primary ${status === item.value ? "border-primary bg-primary-soft" : "border-line bg-white"}`} key={item.value} onClick={() => { setStatus(status === item.value ? "" : item.value); setPage(1); }} type="button"><p className="text-sm text-muted">{item.label}</p><p className="mt-2 text-2xl font-semibold">{stats[item.value]}</p></button>)}
      </div>

      <Card className="space-y-3">
        <SearchInput ariaLabel="Search ticket number or title" onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search ticket number or title" value={search} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select aria-label="Filter by status" className="sm:max-w-xs" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="">All statuses</option>{ticketStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Button onClick={clearFilters} type="button" variant="outline">Clear filters</Button>
        </div>
      </Card>

      {loading ? <Card className="divide-y divide-line p-0">{Array.from({ length: 5 }, (_, index) => <div className="flex h-14 animate-pulse gap-3 p-3" key={index}><div className="w-24 rounded bg-page" /><div className="flex-1 rounded bg-page" /><div className="w-20 rounded bg-page" /></div>)}</Card>
        : requests.length ? (
          <>
            <Card className={`hidden overflow-hidden p-0 transition-opacity lg:block ${refreshing ? "opacity-70" : ""}`}>
              <Table headings={["Ticket", "Issue", "Location", "Reported by", "Room", "Status", "Created", "Actions"]}>
                {requests.map((request) => <tr key={request._id}>
                  <td className="px-4 py-3 font-medium">{request.ticketNumber}</td>
                  <td className="max-w-56 px-4 py-3"><p className="truncate font-medium">{request.title}</p><p className="truncate text-xs text-muted">{request.description}</p></td>
                  <td className="px-4 py-3">{request.room ? <><p className="font-medium">Room {request.room.roomNumber}</p>{request.room.status && <StatusBadge status={request.room.status} />}</> : <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-muted" />{request.location || "-"}</span>}</td>
                  <td className="px-4 py-3"><p>{request.reportedBy?.name || "Reporter"}</p><Badge>{request.reportedBy?.role || "User"}</Badge></td>
                  <td className="px-4 py-3">{request.blocksRoom ? <Badge tone="warning"><span className="inline-flex items-center gap-1"><Ban className="h-3.5 w-3.5" />Room blocked</span></Badge> : "-"}</td>
                  <td className="px-4 py-3"><MaintenanceStatusBadge status={request.status} /></td>
                  <td className="px-4 py-3"><time title={formatDateTime(request.createdAt)}>{relativeTime(request.createdAt)}</time></td>
                  <td className="px-4 py-3">{rowActions(request)}</td>
                </tr>)}
              </Table>
            </Card>
            <div className={`grid gap-3 transition-opacity sm:grid-cols-2 lg:hidden ${refreshing ? "opacity-70" : ""}`}>
              {requests.map((request) => <Card className="space-y-3" key={request._id}>
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted">{request.ticketNumber}</p><h2 className="font-semibold">{request.title}</h2></div><MaintenanceStatusBadge status={request.status} /></div>
                <p className="line-clamp-2 text-sm text-muted">{request.description || "No description provided."}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="inline-flex items-center gap-2">{request.room ? <>Room {request.room.roomNumber}{request.room.status && <StatusBadge status={request.room.status} />}</> : <><MapPin className="h-4 w-4" />{request.location}</>}</span>{request.blocksRoom && <Badge tone="warning"><Ban className="mr-1 h-3.5 w-3.5" />Blocked</Badge>}</div>
                <div className="flex items-center justify-between border-t border-line pt-3"><span className="text-xs text-muted">{request.reportedBy?.name || "Reporter"} · {relativeTime(request.createdAt)}</span>{rowActions(request)}</div>
              </Card>)}
            </div>
            <Pagination itemLabel="requests" onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} totalItems={total} totalPages={totalPages} />
          </>
        ) : <Card><EmptyState icon={Wrench} title="No maintenance requests" description="No requests match the current filters." /></Card>}

      <ReportIssueModal open={reportOpen} onClose={() => setReportOpen(false)} role={role} onCreated={(created) => { setSuccess(`Report ${created.ticketNumber} submitted.`); setStatus(""); setPage(1); fetchRequests(true); }} />
      <MaintenanceDetailsModal request={selected} role={role} busy={busy === selected?._id} error={selected && error} onClose={() => setSelected(null)} onStart={() => changeStatus(selected, "in-progress")} onResolve={() => { setResolutionNotes(selected?.resolutionNotes || ""); setResolveOpen(true); }} onCancel={() => setCancelTarget(selected)} />

      <Modal onClose={() => setResolveOpen(false)} open={resolveOpen} title="Resolve maintenance request">
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <p className="text-sm text-muted">Add optional notes about the resolution.</p>
          <Textarea label="Resolution notes (optional)" onChange={(event) => setResolutionNotes(event.target.value)} rows={4} value={resolutionNotes} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button onClick={() => setResolveOpen(false)} type="button" variant="outline">Cancel</Button><Button loading={busy === selected?._id} onClick={() => changeStatus(selected, "resolved", resolutionNotes.trim())} type="button">Resolve request</Button></div>
        </div>
      </Modal>
      <ConfirmDialog loading={busy === cancelTarget?._id} onClose={() => setCancelTarget(null)} onConfirm={() => changeStatus(cancelTarget, "cancelled")} open={Boolean(cancelTarget)} title="Cancel maintenance request">
        {error && <Alert>{error}</Alert>}
        Cancel {cancelTarget?.ticketNumber}: {cancelTarget?.title}?
      </ConfirmDialog>
    </div>
  );
}
