/* Shared invoice helpers for formatting totals, statuses, and line-item metadata. */

export function formatMoney(value = 0) {
  const amount = Number(value || 0);
  return `Rs. ${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateValue(value, options = {}) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  });
}

export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getInvoiceStatusMeta(status = "") {
  const map = {
    unpaid: { label: "Unpaid", tone: "warning", icon: "clock" },
    paid: { label: "Paid", tone: "success", icon: "check" },
    void: { label: "Void", tone: "neutral", icon: "ban" },
  };
  return map[status] || { label: status || "Unknown", tone: "neutral", icon: "dot" };
}

export function getChargeCategoryMeta(category = "other") {
  const map = {
    food: { label: "Food", tone: "warning" },
    laundry: { label: "Laundry", tone: "primary" },
    "room-service": { label: "Room service", tone: "neutral" },
    transport: { label: "Transport", tone: "primary" },
    minibar: { label: "Minibar", tone: "success" },
    other: { label: "Other", tone: "neutral" },
  };
  return map[category] || { label: category || "Other", tone: "neutral" };
}

export function getInvoicePaymentMethodLabel(method = "") {
  const labels = {
    cash: "Cash",
    card: "Card",
    stripe: "Stripe",
  };
  return labels[method] || method || "-";
}

export async function downloadInvoicePdf(invoiceId) {
  const token = localStorage.getItem("luxurystay-token");
  if (!token) throw new Error("Please sign in again to download this invoice.");

  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2008/api";
  const response = await fetch(`${baseURL}/invoices/${encodeURIComponent(invoiceId)}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Unable to download invoice (${response.status}).`);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition") || "";
  const filename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || `invoice-${invoiceId}.pdf`;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
