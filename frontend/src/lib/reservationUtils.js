/* Helper functions for reservation pricing, dates, and status labels. */
export const reservationStatusOptions = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked-in", label: "Checked in" },
  { value: "checked-out", label: "Checked out" },
  { value: "cancelled", label: "Cancelled" },
];

export function formatPrice(value) {
  const amount = Number(value || 0);
  return `Rs. ${Number.isFinite(amount) ? amount.toLocaleString("en-US") : "0"}`;
}

export function formatDate(value, options = {}) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  });
}

export function nightsLabel(value) {
  const nights = Number(value || 0);
  return `${nights} night${nights === 1 ? "" : "s"}`;
}

export function reservationStatusLabel(value) {
  return reservationStatusOptions.find((entry) => entry.value === value)?.label || value;
}
