/* Shared labels and time formatting for housekeeping and maintenance screens. */
export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function relativeTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

export const housekeepingTypeMeta = {
  "checkout-cleaning": { label: "Checkout cleaning", icon: "logout" },
  "regular-cleaning": { label: "Regular cleaning", icon: "sparkles" },
  "deep-cleaning": { label: "Deep cleaning", icon: "spray" },
  inspection: { label: "Inspection", icon: "clipboard" },
};

export const housekeepingStatusMeta = {
  pending: { label: "Pending", tone: "warning", icon: "clock" },
  "in-progress": { label: "In progress", tone: "dark", icon: "loader" },
  completed: { label: "Completed", tone: "success", icon: "check" },
  cancelled: { label: "Cancelled", tone: "neutral", icon: "x" },
};

export const maintenanceStatusMeta = {
  open: { label: "Open", tone: "warning", icon: "circle" },
  "in-progress": { label: "In progress", tone: "dark", icon: "hammer" },
  resolved: { label: "Resolved", tone: "success", icon: "check" },
  cancelled: { label: "Cancelled", tone: "neutral", icon: "x" },
};

export const priorityMeta = {
  high: { label: "High", tone: "error", icon: "up" },
  normal: { label: "Normal", tone: "neutral", icon: "minus" },
  low: { label: "Low", tone: "neutral", icon: "down" },
};
