/* Admin and manager billing report sourced from invoice report aggregates. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, ReceiptText, TrendingUp } from "lucide-react";
import api from "../api/axios.js";
import Link from "../components/Link.jsx";
import { Alert, Badge, Card, EmptyState, PageHeader, Table } from "../components/UI.jsx";
import { formatDateTime, formatDateValue, formatMoney, getInvoicePaymentMethodLabel } from "../lib/invoiceUtils.js";

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthStart() {
  const now = new Date();
  return localDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
}

const datePresets = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

const methodIcons = { cash: Banknote, card: CreditCard, stripe: CreditCard };

export default function Billing() {
  const [from, setFrom] = useState(getMonthStart);
  const [to, setTo] = useState(() => localDateKey(new Date()));
  const [preset, setPreset] = useState("month");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    try {
      const payload = await api.get(`/invoices/report${query ? `?${query}` : ""}`);
      setReport(payload);
    } catch (requestError) {
      setError(requestError.message || "Unable to load billing report.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    const timer = window.setTimeout(fetchReport, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReport]);

  const daily = report?.daily || [];
  const maxDaily = Math.max(1, ...daily.map((entry) => Number(entry.amount || 0)));
  const labelStep = Math.max(1, Math.ceil(daily.length / 7));
  const byMethod = useMemo(() => {
    const existing = new Map((report?.byMethod || []).map((entry) => [entry.method, entry]));
    return ["cash", "card", "stripe"].map((method) => existing.get(method) || { method, amount: 0, count: 0 });
  }, [report]);
  const paidTotal = Number(report?.revenue || 0);

  const applyPreset = (value) => {
    const today = new Date();
    const end = localDateKey(today);
    setPreset(value);
    if (value === "today") {
      setFrom(end);
      setTo(end);
    } else if (value === "7days") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      setFrom(localDateKey(start));
      setTo(end);
    } else if (value === "month") {
      setFrom(localDateKey(new Date(today.getFullYear(), today.getMonth(), 1)));
      setTo(end);
    } else {
      setFrom("");
      setTo("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader description="Revenue, payments, and invoice activity" title="Billing Report" />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {datePresets.map((item) => (
            <button
              aria-pressed={preset === item.value}
              className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${preset === item.value ? "bg-primary text-white" : "border border-line bg-white hover:bg-page"}`}
              key={item.value}
              onClick={() => applyPreset(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium" htmlFor="report-from">From
            <input className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm" id="report-from" onChange={(event) => { setFrom(event.target.value); setPreset(""); }} type="date" value={from} />
          </label>
          <label className="space-y-1.5 text-sm font-medium" htmlFor="report-to">To
            <input className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm" id="report-to" min={from || undefined} onChange={(event) => { setTo(event.target.value); setPreset(""); }} type="date" value={to} />
          </label>
        </div>
      </Card>

      {loading && !report ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Card className="h-28 animate-pulse bg-page" key={index} />)}
        </div>
      ) : report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: formatMoney(report.revenue), icon: TrendingUp, note: `${report.summary?.paid?.count || 0} paid invoices` },
              { label: "Paid", value: formatMoney(report.summary?.paid?.amount), icon: ReceiptText, note: `${report.summary?.paid?.count || 0} invoices` },
              { label: "Outstanding", value: formatMoney(report.summary?.unpaid?.amount), icon: CreditCard, note: `${report.summary?.unpaid?.count || 0} unpaid invoices` },
              { label: "Void", value: formatMoney(report.summary?.void?.amount), icon: Banknote, note: `${report.summary?.void?.count || 0} invoices` },
            ].map(({ label, value, icon: Icon, note }) => (
              <Card className="flex items-center gap-4" key={label}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Icon className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <p className="text-sm text-muted">{label}</p>
                  <p className="mt-1 truncate text-xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs text-muted">{note}</p>
                </div>
              </Card>
            ))}
          </div>

          <section aria-label="Payments by method" className="grid gap-4 md:grid-cols-3">
            {byMethod.map((entry) => {
              const percentage = paidTotal > 0 ? Math.min(100, (Number(entry.amount || 0) / paidTotal) * 100) : 0;
              const Icon = methodIcons[entry.method] || CreditCard;
              return (
                <Card key={entry.method}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-page"><Icon className="h-5 w-5 text-primary-dark" /></div>
                      <div><p className="font-medium">{getInvoicePaymentMethodLabel(entry.method)}</p><p className="text-xs text-muted">{entry.count} payments</p></div>
                    </div>
                    <p className="font-semibold">{formatMoney(entry.amount)}</p>
                  </div>
                  <div aria-label={`${percentage.toFixed(1)} percent of revenue`} className="mt-4 h-2 overflow-hidden rounded-full bg-page">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs text-muted">{percentage.toFixed(1)}%</p>
                </Card>
              );
            })}
          </section>

          <Card className="overflow-hidden">
            <div className="mb-4">
              <h2 className="font-semibold">Daily revenue</h2>
              <p className="mt-1 text-sm text-muted">Paid invoice revenue by day</p>
            </div>
            {daily.length ? (
              <div className="no-scrollbar overflow-x-auto">
                <div className="flex h-64 min-w-[620px] items-end gap-3 border-b border-line px-2 pt-5">
                  {daily.map((entry, index) => {
                    const height = Math.max(4, (Number(entry.amount || 0) / maxDaily) * 190);
                    return (
                      <div className="group relative flex h-full min-w-[44px] flex-1 flex-col items-center justify-end" key={entry.date}>
                        <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block group-focus-within:block">
                          {formatDateValue(entry.date)} · {formatMoney(entry.amount)} ({entry.count})
                        </div>
                        <div aria-label={`${formatDateValue(entry.date)}: ${formatMoney(entry.amount)}`} className="w-full max-w-12 rounded-t-md bg-primary transition-opacity hover:opacity-80" style={{ height }} tabIndex={0} title={`${formatDateValue(entry.date)}: ${formatMoney(entry.amount)} · ${entry.count} payments`} />
                        <span className="mt-2 h-5 text-center text-[10px] text-muted">
                          {index % labelStep === 0 || index === daily.length - 1 ? new Date(`${entry.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }) : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <EmptyState description="No paid invoices were recorded in this date range." title="No revenue data" />}
          </Card>

          <Card className="p-0">
            <div className="p-4 sm:p-5"><h2 className="font-semibold">Recent payments</h2><p className="mt-1 text-sm text-muted">Most recent successful payments in this range</p></div>
            {report.recentPayments?.length ? (
              <>
                <div className="hidden md:block">
                  <Table headings={["Invoice", "Guest", "Paid at", "Method", "Amount"]}>
                    {report.recentPayments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-4 py-3"><Link className="font-medium text-primary-dark hover:underline" href={`/invoices/${payment._id}`}>{payment.invoiceNumber}</Link></td>
                        <td className="px-4 py-3">{payment.guest?.name || "Guest"}</td>
                        <td className="px-4 py-3">{formatDateTime(payment.paidAt)}</td>
                        <td className="px-4 py-3"><Badge>{getInvoicePaymentMethodLabel(payment.paymentMethod)}</Badge></td>
                        <td className="px-4 py-3 font-medium">{formatMoney(payment.total)}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
                <div className="divide-y divide-line md:hidden">
                  {report.recentPayments.map((payment) => (
                    <div className="space-y-2 p-4" key={payment._id}>
                      <div className="flex items-center justify-between gap-3">
                        <Link className="font-medium text-primary-dark" href={`/invoices/${payment._id}`}>{payment.invoiceNumber}</Link>
                        <span className="font-semibold">{formatMoney(payment.total)}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                        <span>{payment.guest?.name || "Guest"}</span><span>{getInvoicePaymentMethodLabel(payment.paymentMethod)}</span>
                      </div>
                      <p className="text-xs text-muted">{formatDateTime(payment.paidAt)}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="px-4 pb-4"><EmptyState description="No payments were found in this date range." title="No recent payments" /></div>}
          </Card>
        </>
      )}
      {loading && report && <p aria-live="polite" className="text-sm text-muted">Updating report...</p>}
    </div>
  );
}
