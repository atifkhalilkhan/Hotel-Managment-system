/* Compact event timeline shared by housekeeping and maintenance details. */
import { CheckCircle2, Clock3, Flag, Hammer, PlusCircle, XCircle } from "lucide-react";
import { formatDateTime } from "../lib/operationsUtils.js";

const icons = {
  created: PlusCircle,
  reported: Flag,
  started: Hammer,
  completed: CheckCircle2,
  resolved: CheckCircle2,
  cancelled: XCircle,
};

export default function OperationTimeline({ events }) {
  const visibleEvents = events.filter((event) => event.time);
  return (
    <ol className="space-y-0">
      {visibleEvents.length ? visibleEvents.map((event, index) => {
        const Icon = icons[event.icon] || Clock3;
        return (
          <li className="relative flex gap-3 pb-4 last:pb-0" key={`${event.label}-${event.time}`}>
            {index < visibleEvents.length - 1 && <span aria-hidden="true" className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-line" />}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-page text-muted"><Icon className="h-4 w-4" /></span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-sm font-medium">{event.label}</span>
              <time className="block text-xs text-muted" dateTime={event.time}>{formatDateTime(event.time)}</time>
            </span>
          </li>
        );
      }) : <li className="text-sm text-muted">No timeline activity yet.</li>}
    </ol>
  );
}
