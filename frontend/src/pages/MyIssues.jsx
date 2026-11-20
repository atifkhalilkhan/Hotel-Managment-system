/* Guest and housekeeping issue history with status filters and cancellation. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Eye, RefreshCw, XCircle } from "lucide-react";
import api from "../api/axios.js";
import MaintenanceDetailsModal from "../components/MaintenanceDetailsModal.jsx";
import { MaintenanceStatusBadge } from "../components/OperationBadges.jsx";
import ReportIssueModal from "../components/ReportIssueModal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import useAuth from "../context/useAuth.js";
import { Alert, Button, Card, ConfirmDialog, EmptyState, IconButton, PageHeader } from "../components/UI.jsx";
import { formatDateTime, relativeTime } from "../lib/operationsUtils.js";

const filters = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

export default function MyIssues() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [reportOpen, setReportOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busy, setBusy] = useState("");
  const requestId = useRef(0);

  const fetchIssues = useCallback(async (silent = false) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    try {
      const params = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
      const result = await api.get(`/maintenance/my${params}`);
      if (requestId.current === id) setIssues(result || []);
    } catch (requestError) {
      if (requestId.current === id) setError(requestError.message || "Unable to load your reports.");
    } finally {
      if (requestId.current === id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchIssues(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchIssues]);

  const filteredIssues = useMemo(() => filter === "all" ? issues : issues.filter((item) => item.status === filter), [filter, issues]);

  const viewIssue = async (issue) => {
    setError("");
    try {
      const details = await api.get(`/maintenance/${issue._id}`);
      setSelected(details);
    } catch (requestError) {
      setError(requestError.message || "Unable to load report details.");
    }
  };

  const cancelIssue = async () => {
    if (!cancelTarget) return;
    setBusy(cancelTarget._id);
    setError("");
    try {
      const result = await api.patch(`/maintenance/${cancelTarget._id}/cancel`, {});
      setSuccess(result.message || "Report cancelled.");
      setCancelTarget(null);
      setSelected((current) => current?._id === cancelTarget._id ? { ...current, status: "cancelled" } : current);
      await fetchIssues(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to cancel report.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description="Track issues you have reported"
        icon={AlertTriangle}
        title="Report an Issue"
        action={<div className="flex gap-2"><Button disabled={refreshing} onClick={() => fetchIssues(true)} type="button" variant="outline"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button><Button onClick={() => setReportOpen(true)} type="button"><AlertTriangle className="h-4 w-4" />New Report</Button></div>}
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert onClose={() => setSuccess("")} type="success">{success}</Alert>}

      <Card className="p-3 sm:p-4">
        <div aria-label="Filter reports" className="flex flex-wrap gap-2" role="group">
          {filters.map((item) => <button aria-pressed={filter === item.value} className={`min-h-11 rounded-full px-4 text-sm font-medium ${filter === item.value ? "bg-primary text-white" : "border border-line bg-white hover:bg-page"}`} key={item.value} onClick={() => setFilter(item.value)} type="button">{item.label}</button>)}
        </div>
      </Card>

      {loading ? <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Card className="h-48 animate-pulse bg-page" key={index} />)}</div>
        : filteredIssues.length ? (
          <div className={`grid gap-4 transition-opacity sm:grid-cols-2 ${refreshing ? "opacity-70" : ""}`}>
            {filteredIssues.map((issue) => (
              <Card className="space-y-4" key={issue._id}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium text-muted">{issue.ticketNumber}</p><h2 className="mt-1 truncate font-semibold">{issue.title}</h2></div><MaintenanceStatusBadge status={issue.status} /></div>
                <p className="line-clamp-2 min-h-10 text-sm text-muted">{issue.description || "No description provided."}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm"><span className="truncate">{issue.room ? `Room ${issue.room.roomNumber}` : issue.location || "Location not specified"}</span>{issue.room?.status && <StatusBadge status={issue.room.status} />}</div>
                  <time className="shrink-0 text-xs text-muted" title={formatDateTime(issue.createdAt)}>{relativeTime(issue.createdAt)}</time>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <IconButton ariaLabel={`View report ${issue.ticketNumber}`} onClick={() => viewIssue(issue)} title="View report"><Eye className="h-4 w-4" /></IconButton>
                  {issue.status === "open" && <Button className="h-10 min-h-10 px-3" onClick={() => setCancelTarget(issue)} type="button" variant="outline"><XCircle className="h-4 w-4" />Cancel</Button>}
                </div>
              </Card>
            ))}
          </div>
        ) : <Card><EmptyState title="You have not reported any issues" description={filter === "all" ? "Use New Report to tell us about a maintenance issue." : `There are no ${filters.find((item) => item.value === filter)?.label.toLowerCase()} reports.`} /></Card>}

      <ReportIssueModal open={reportOpen} onClose={() => setReportOpen(false)} role={user?.role} onCreated={(created) => { setSuccess(`Report ${created.ticketNumber} submitted.`); setFilter("all"); fetchIssues(true); }} />
      <MaintenanceDetailsModal request={selected} role={user?.role} canReporterCancel onClose={() => setSelected(null)} onReporterCancel={() => setCancelTarget(selected)} />
      <ConfirmDialog loading={busy === cancelTarget?._id} onClose={() => setCancelTarget(null)} onConfirm={cancelIssue} open={Boolean(cancelTarget)} title="Cancel issue report">
        {error && <Alert>{error}</Alert>}
        Cancel report {cancelTarget?.ticketNumber}: {cancelTarget?.title}?
      </ConfirmDialog>
    </div>
  );
}
