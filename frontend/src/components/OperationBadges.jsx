/* Consistent icon badges for task priority, statuses, and task types. */
import {
  CheckCircle2,
  ChevronDown,
  ChevronsUp,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Hammer,
  LoaderCircle,
  LogOut,
  Minus,
  SprayCan,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Badge } from "./UI.jsx";
import { housekeepingStatusMeta, housekeepingTypeMeta, maintenanceStatusMeta, priorityMeta } from "../lib/operationsUtils.js";

const priorityIcons = { up: ChevronsUp, minus: Minus, down: ChevronDown };
const statusIcons = {
  clock: Clock3,
  loader: LoaderCircle,
  check: CheckCircle2,
  x: XCircle,
  circle: CircleDot,
  hammer: Hammer,
};
const taskTypeIcons = { logout: LogOut, sparkles: Sparkles, spray: SprayCan, clipboard: ClipboardCheck };

export function PriorityBadge({ priority = "normal" }) {
  const meta = priorityMeta[priority] || priorityMeta.normal;
  const Icon = priorityIcons[meta.icon];
  const toneClass = priority === "high" ? "bg-red-100 text-red-600" : priority === "low" ? "bg-gray-100 text-gray-500" : "bg-gray-200 text-gray-700";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}><Icon aria-hidden="true" className="h-3.5 w-3.5" />{meta.label}</span>;
}

export function HousekeepingStatusBadge({ status = "pending" }) {
  const meta = housekeepingStatusMeta[status] || housekeepingStatusMeta.pending;
  const Icon = statusIcons[meta.icon];
  return <Badge tone={meta.tone}><span className="inline-flex items-center gap-1"><Icon aria-hidden="true" className="h-3.5 w-3.5" />{meta.label}</span></Badge>;
}

export function MaintenanceStatusBadge({ status = "open" }) {
  const meta = maintenanceStatusMeta[status] || maintenanceStatusMeta.open;
  const Icon = statusIcons[meta.icon];
  return <Badge tone={meta.tone}><span className="inline-flex items-center gap-1"><Icon aria-hidden="true" className="h-3.5 w-3.5" />{meta.label}</span></Badge>;
}

export function HousekeepingType({ type = "regular-cleaning" }) {
  const meta = housekeepingTypeMeta[type] || { label: type, icon: "sparkles" };
  const Icon = taskTypeIcons[meta.icon] || Sparkles;
  return <span className="inline-flex items-center gap-2"><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" /><span>{meta.label}</span></span>;
}
