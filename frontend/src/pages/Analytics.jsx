/* Reservation, occupancy, and revenue analytics for hotel managers. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarCheck, CalendarX, CreditCard, Gauge, Hotel, TrendingUp } from "lucide-react";
import api from "../api/axios.js";
import { Alert, Badge, Card, EmptyState, Input, PageHeader } from "../components/UI.jsx";
import { formatMoney } from "../lib/invoiceUtils.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date) {
  return dayKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

const statuses = [
  { key: "confirmed", label: "Confirmed", tone: "bg-primary" },
  { key: "checkedIn", label: "Checked in", tone: "bg-green-500" },
  { key: "checkedOut", label: "Checked out", tone: "bg-slate-400" },
  { key: "cancelled", label: "Cancelled", tone: "bg-red-500" },
];

export default function Analytics() {
  const [to, setTo] = useState(() => dayKey(new Date()));
  const [from, setFrom] = useState(() => startOfMonth(new Date()));
  const [preset, setPreset] = useState("month");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from, to });
      setReport(await api.get(`/reports/analytics?${params}`));
    } catch (requestError) {
      setError(requestError.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    const timer = window.setTimeout(fetchReport, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReport]);

  const chartData = useMemo(() => {
    const daily = report?.daily || [];
    const bucketSize = Math.max(1, Math.ceil(daily.length / 31));
    const buckets = [];
    for (let index = 0; index < daily.length; index += bucketSize) {
      const entries = daily.slice(index, index + bucketSize);
      buckets.push({
        date: entries[0].date,
        endDate: entries[entries.length - 1].date,
        revenue: entries.reduce((sum, entry) => sum + Number(entry.revenue || 0), 0),
      });
    }
    return buckets;
  }, [report?.daily]);
  const maximumRevenue = Math.max(1, ...chartData.map((entry) => entry.revenue));
  const labelStep = Math.max(1, Math.ceil(chartData.length / 7));
  const statusTotal = useMemo(
    () => statuses.reduce((sum, item) => sum + Number(report?.bookings?.[item.key] || 0), 0),
    [report]
  );

  const applyPreset = (value) => {
    const today = new Date();
    const end = dayKey(today);
    setPreset(value);
    setTo(end);
    if (value === "today") setFrom(end);
    else if (value === "7days") setFrom(dayKey(new Date(today.getTime() - (6 * DAY_MS))));
    else if (value === "month") setFrom(startOfMonth(today));
    else if (value === "90days") setFrom(dayKey(new Date(today.getTime() - (89 * DAY_MS))));
    else setFrom(dayKey(new Date(today.getTime() - (365 * DAY_MS))));
  };

  const metrics = [
    { label: "Bookings", value: report?.bookings?.total ?? 0, note: `${report?.bookings?.checkIns ?? 0} check-ins · ${report?.bookings?.checkOuts ?? 0} check-outs`, Icon: CalendarCheck },
    { label: "Occupancy", value: `${Number(report?.occupancy?.rate || 0).toFixed(1)}%`, note: `${report?.occupancy?.bookedRoomNights ?? 0} / ${report?.occupancy?.totalRoomNights ?? 0} room nights`, Icon: Hotel },
    { label: "Paid revenue", value: formatMoney(report?.revenue?.paid), note: `${report?.revenue?.unpaidInvoices ?? 0} unpaid invoices`, Icon: CreditCard },
    { label: "Cancellations", value: report?.cancellations ?? 0, note: "Cancelled during this period", Icon: CalendarX },
    { label: "ADR", value: formatMoney(report?.revenue?.averageDailyRate), note: "Room revenue per paid room night", Icon: TrendingUp },
    { label: "RevPAR", value: formatMoney(report?.revenue?.revPAR), note: "Room revenue per available room night", Icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description="Track reservations, room occupancy, cancellations, and revenue."
        icon={BarChart3}
        title="Reports & Analytics"
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {[
            ["today", "Today"],
            ["7days", "Last 7 days"],
            ["month", "This month"],
            ["90days", "Last 90 days"],
            ["year", "Last 12 months"],
          ].map(([value, label]) => (
            <button
              aria-pressed={preset === value}
              className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${preset === value ? "bg-primary text-white" : "border border-line bg-white hover:bg-page"}`}
              key={value}
              onClick={() => applyPreset(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="analytics-from"
            label="From"
            max={to || undefined}
            onChange={(event) => {
              const value = event.target.value;
              setFrom(value);
              if (value && to && value > to) setTo(value);
              setPreset("");
            }}
            type="date"
            value={from}
          />
          <Input
            id="analytics-to"
            label="To"
            min={from || undefined}
            onChange={(event) => { setTo(event.target.value); setPreset(""); }}
            type="date"
            value={to}
          />
        </div>
      </Card>

      {loading && !report ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <Card className="h-28 animate-pulse bg-page" key={index} />)}
        </div>
      ) : report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map(({ label, value, note, Icon }) => (
              <Card className="flex min-w-0 items-center gap-4" key={label}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Icon aria-hidden="true" className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <p className="text-sm text-muted">{label}</p>
                  <p className="mt-1 truncate text-xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs text-muted">{note}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <Card className="min-w-0 overflow-hidden">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Daily paid revenue</h2>
                  <p className="mt-1 text-sm text-muted">Revenue is grouped by payment date.</p>
                </div>
                <Badge tone="primary">{report.range.days} days</Badge>
              </div>
              {chartData.length ? (
                <div className="min-w-0 overflow-hidden">
                  <div className="grid h-56 min-w-0 items-end gap-1 border-b border-line px-1 pt-5" style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}>
                    {chartData.map((entry, index) => {
                      const height = Math.max(4, (entry.revenue / maximumRevenue) * 165);
                      const date = new Date(`${entry.date}T00:00:00Z`);
                      const endDate = new Date(`${entry.endDate}T00:00:00Z`);
                      const label = entry.date === entry.endDate
                        ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })
                        : `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })} – ${endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })}`;
                      return (
                        <div className="group relative flex h-full min-w-0 flex-col items-center justify-end" key={entry.date}>
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block group-focus-within:block">
                            {label} · {formatMoney(entry.revenue)}
                          </div>
                          <div
                            aria-label={`${label}: ${formatMoney(entry.revenue)}`}
                            className="w-full max-w-12 rounded-t-md bg-primary transition-opacity hover:opacity-80"
                            role="img"
                            style={{ height }}
                            tabIndex={0}
                            title={`${label}: ${formatMoney(entry.revenue)}`}
                          />
                          <span className="mt-2 h-5 min-w-0 text-center text-[10px] text-muted">
                            {(index % labelStep === 0 || index === chartData.length - 1) && (
                              <>
                                <span className="hidden sm:inline">{date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })}</span>
                                <span className="sm:hidden">{date.getUTCDate()}</span>
                              </>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <EmptyState description="No payments were recorded in this period." title="No revenue data" />}
            </Card>

            <Card className="space-y-5">
              <div>
                <h2 className="font-semibold">Reservation status</h2>
                <p className="mt-1 text-sm text-muted">Booking status at creation; cancellations above use the cancellation date.</p>
              </div>
              {statusTotal ? statuses.map(({ key, label, tone }) => {
                const count = Number(report.bookings?.[key] || 0);
                const percentage = (count / statusTotal) * 100;
                return (
                  <div className="space-y-2" key={key}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted">{label}</span>
                      <span className="font-medium">{count} <span className="text-xs text-muted">({percentage.toFixed(0)}%)</span></span>
                    </div>
                    <div aria-label={`${label}: ${percentage.toFixed(0)} percent`} className="h-2 overflow-hidden rounded-full bg-page">
                      <div className={`h-full rounded-full ${tone}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              }) : <EmptyState description="Bookings will appear here when they are created." title="No bookings in this period" />}
              <div className="border-t border-line pt-4 text-sm">
                <div className="flex items-center justify-between gap-3"><span className="text-muted">Rooms in inventory</span><span className="font-medium">{report.occupancy.rooms}</span></div>
                <div className="mt-2 flex items-center justify-between gap-3"><span className="text-muted">Outstanding invoices</span><span className="font-medium">{formatMoney(report.revenue.outstanding)}</span></div>
              </div>
            </Card>
          </div>
        </>
      )}
      {loading && report && <p aria-live="polite" className="text-sm text-muted">Updating analytics...</p>}
    </div>
  );
}
