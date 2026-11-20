/* Maintenance request detail sheet with reporter information and event timeline. */
import { AlertTriangle, Ban, MapPin, Phone } from "lucide-react";
import { Alert, Badge, Button, Modal } from "./UI.jsx";
import OperationTimeline from "./OperationTimeline.jsx";
import { MaintenanceStatusBadge } from "./OperationBadges.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { formatDateTime } from "../lib/operationsUtils.js";

export default function MaintenanceDetailsModal({ request, role, busy = false, error = "", canReporterCancel = false, onClose, onStart, onResolve, onCancel, onReporterCancel }) {
  if (!request) return null;
  const canManage = ["admin", "manager"].includes(role);
  const location = request.room ? `Room ${request.room.roomNumber}` : request.location;

  return (
    <Modal onClose={onClose} open={Boolean(request)} title={request.ticketNumber || "Maintenance request"}>
      <div className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{request.title}</h2><MaintenanceStatusBadge status={request.status} /></div>
        {request.description && <p className="whitespace-pre-wrap text-sm text-muted">{request.description}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs text-muted">Location</p>
            <p className="mt-1 flex items-center gap-2 font-medium">{request.room ? <>{location}{request.room.status && <StatusBadge status={request.room.status} />}</> : <><MapPin className="h-4 w-4 text-muted" />{location || "Not specified"}</>}</p>
            {request.room && <p className="mt-1 text-sm text-muted">{request.room.type || "Room"} · Floor {request.room.floor ?? "-"}</p>}
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs text-muted">Reported by</p>
            <p className="mt-1 font-medium">{request.reportedBy?.name || "Reporter"}</p>
            <Badge>{request.reportedBy?.role || "User"}</Badge>
            {request.reportedBy?.phone && <a className="mt-1 flex items-center gap-2 text-sm text-primary-dark" href={`tel:${request.reportedBy.phone}`}><Phone className="h-4 w-4" />{request.reportedBy.phone}</a>}
          </div>
        </div>
        {request.blocksRoom && <div className="flex items-center gap-2 rounded-lg border border-line bg-page p-3 text-sm"><Ban className="h-4 w-4 shrink-0 text-muted" />Room blocked due to this issue</div>}
        {request.resolutionNotes && <div className="rounded-lg border border-line p-3"><p className="text-sm font-semibold">Resolution notes</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted">{request.resolutionNotes}</p></div>}
        {request.blocksRoom && ["resolved", "cancelled"].includes(request.status) && <Alert type="info">If this ticket was blocking {location}, the room is available again.</Alert>}
        <div className="rounded-lg border border-line p-4"><h3 className="mb-4 text-sm font-semibold">Timeline</h3><OperationTimeline events={[{ label: "Reported", time: request.createdAt, icon: "reported" }, { label: "In progress", time: request.startedAt, icon: "started" }, { label: request.status === "cancelled" ? "Cancelled" : "Resolved", time: request.resolvedAt, icon: request.status === "cancelled" ? "cancelled" : "resolved" }]} /></div>
        <div className="flex flex-wrap justify-end gap-2">
          {canManage && request.status === "open" && <Button loading={busy} onClick={onStart} type="button"><AlertTriangle className="h-4 w-4" />Start</Button>}
          {canManage && ["open", "in-progress"].includes(request.status) && <Button loading={busy} onClick={onResolve} type="button">Resolve</Button>}
          {canManage && ["open", "in-progress"].includes(request.status) && <Button loading={busy} onClick={onCancel} type="button" variant="danger">Cancel</Button>}
          {canReporterCancel && request.status === "open" && <Button loading={busy} onClick={onReporterCancel} type="button" variant="danger">Cancel report</Button>}
        </div>
        <p className="text-xs text-muted">Last updated: {formatDateTime(request.updatedAt || request.createdAt)}</p>
      </div>
    </Modal>
  );
}
