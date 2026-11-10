/* Flat room status badge used inside cards and modals. */
import { CheckCircle2, DoorClosed, Sparkles, Wrench } from "lucide-react";
import { Badge } from "./UI.jsx";

const styles = {
  available: { tone: "success", icon: CheckCircle2, label: "Available" },
  occupied: { tone: "error", icon: DoorClosed, label: "Occupied" },
  cleaning: { tone: "warning", icon: Sparkles, label: "Cleaning" },
  maintenance: { tone: "dark", icon: Wrench, label: "Maintenance" },
};

export default function StatusBadge({ status }) {
  const meta = styles[status] || styles.available;
  const Icon = meta.icon;
  return <Badge tone={meta.tone}><span className="flex items-center gap-1"><Icon className="h-3.5 w-3.5" />{meta.label}</span></Badge>;
}
