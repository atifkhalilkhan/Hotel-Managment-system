/* Role-specific overview with live user and reservation statistics. */
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, BarChart3, CalendarCheck, ClipboardList, ConciergeBell, CreditCard, ReceiptText, RefreshCw, ShieldCheck, SprayCan, TrendingUp, UserRound, Users, Wrench } from "lucide-react";
import api from "../api/axios.js";
import useAuth from "../context/useAuth.js";
import Link from "../components/Link.jsx";
import { Alert, Badge, Card, Loader } from "../components/UI.jsx";
import { formatDate, formatPrice, nightsLabel } from "../lib/reservationUtils.js";
import { formatMoney } from "../lib/invoiceUtils.js";

const reservationStatusTiles = [
  { key: "confirmed", label: "Confirmed", color: "var(--color-primary)" },
  { key: "checked-in", label: "In-house", color: "var(--color-primary-dark)" },
  { key: "checked-out", label: "Checked out", color: "#FDBA74" },
  { key: "cancelled", label: "Cancelled", color: "#9A3412" },
];

function getRecentRevenueDays(daily) {
  const amounts = new Map((daily || []).map((entry) => [entry.date, entry]));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - 6 + index);
    const key = date.toISOString().slice(0, 10);
    return amounts.get(key) || { date: key, amount: 0, count: 0 };
  });
}

function formatCompactMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  })}`;
}

function RevenueTrendChart({ days, loading }) {
  const maximum = Math.max(0, ...days.map((day) => Number(day.amount || 0)));
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, maximum)));
  const axisMaximum = maximum ? Math.ceil(maximum / magnitude) * magnitude : 1;
  const total = days.reduce((sum, day) => sum + Number(day.amount || 0), 0);
  const peakDay = days.reduce((peak, day) => Number(day.amount || 0) > Number(peak.amount || 0) ? day : peak, days[0] || { amount: 0 });
  const yTicks = Array.from({ length: 5 }, (_, index) => axisMaximum * (1 - (index / 4)));

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-dark"><TrendingUp aria-hidden="true" className="h-4 w-4" /></span>
            <h2 className="font-semibold">Revenue trend</h2>
          </div>
          <p className="mt-2 text-sm text-muted">Paid invoice totals for the last seven days</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-right">
          <div>
            <p className="text-xs text-muted">7-day total</p>
            <p className="mt-1 text-sm font-semibold sm:text-base">{loading ? "..." : formatMoney(total)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Best day</p>
            <p className="mt-1 text-sm font-semibold sm:text-base">{loading ? "..." : Number(peakDay.amount || 0) > 0 ? formatMoney(peakDay.amount) : "—"}</p>
            {!loading && Number(peakDay.amount || 0) > 0 && <p className="text-[10px] text-muted">{new Date(`${peakDay.date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", timeZone: "UTC" })}</p>}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col justify-center">
        {loading ? (
          <div className="h-56 animate-pulse rounded-xl bg-page" />
        ) : total === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-xl bg-page text-sm text-muted">No paid invoices in the last seven days.</div>
        ) : (
          <div aria-label="Daily paid revenue for the last seven days" className="mt-4 flex min-h-56 flex-1 flex-col" role="group">
            <div className="flex min-h-[190px] flex-1 gap-2">
              <div className="flex w-[68px] shrink-0 flex-col justify-between pb-1 text-right text-[10px] text-muted tabular-nums">
                {yTicks.map((tick, index) => <span key={index}>{formatCompactMoney(tick)}</span>)}
              </div>
              <div className="relative grid flex-1 grid-cols-7 gap-1">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                  {yTicks.map((_, index) => <span className="border-t border-dashed border-line" key={index} />)}
                </div>
                {days.map((day) => {
                  const amount = Number(day.amount || 0);
                  const dateLabel = new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", timeZone: "UTC" });
                  const barHeight = amount ? Math.max(3, (amount / axisMaximum) * 100) : 1.5;
                  return (
                    <div className="z-10 flex min-w-0 items-end justify-center" key={day.date}>
                      <div
                        aria-label={`${dateLabel}: ${formatMoney(amount)} from ${day.count || 0} payments`}
                        className={`w-full max-w-10 rounded-t-lg shadow-sm transition-[height,filter] duration-300 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${amount ? "bg-gradient-to-t from-orange-600 to-orange-400" : "bg-slate-300"}`}
                        role="img"
                        style={{ height: `${barHeight}%` }}
                        tabIndex={0}
                        title={`${dateLabel}: ${formatMoney(amount)} · ${day.count || 0} payments`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 pl-[76px]">
              {days.map((day) => (
                <span className="truncate text-center text-[9px] text-muted sm:text-[11px]" key={day.date}>
                  {new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", timeZone: "UTC" })}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
        <span className="inline-flex items-center gap-2 text-xs text-muted"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />Daily paid revenue</span>
        <Link className="inline-flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline" href="/billing">Billing report <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
    </Card>
  );
}

function ReservationStatusChart({ stats, loading }) {
  const total = stats.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const circumference = 2 * Math.PI * 64;
  const segments = stats.map((item, index) => {
    const length = total ? (Number(item.value || 0) / total) * circumference : 0;
    const offset = stats.slice(0, index).reduce((sum, previous) => {
      return sum + (total ? (Number(previous.value || 0) / total) * circumference : 0);
    }, 0);
    return { ...item, length, offset };
  });
  const leadingStatus = [...stats].sort((a, b) => Number(b.value || 0) - Number(a.value || 0))[0];
  const leadingPercent = total && leadingStatus ? Math.round((Number(leadingStatus.value || 0) / total) * 100) : 0;

  return (
    <Card className="flex h-full min-h-[440px] flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-page text-primary-dark"><CalendarCheck aria-hidden="true" className="h-4 w-4" /></span>
          <div>
            <h2 className="font-semibold">Reservation status</h2>
            <p className="text-xs text-muted">All reservations by status</p>
          </div>
        </div>
        <span className="rounded-full border border-line bg-page px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Status mix</span>
      </div>
      {loading ? (
        <div aria-label="Loading reservation status chart" className="mt-5 flex flex-1 flex-col items-center justify-center gap-6" role="status">
          <div className="h-48 w-48 animate-pulse rounded-full bg-page" />
          <div className="grid w-full grid-cols-2 gap-3">{reservationStatusTiles.map((item) => <div className="h-20 animate-pulse rounded-xl bg-page" key={item.key} />)}</div>
        </div>
      ) : total ? (
        <div className="mt-3 flex w-full flex-1 flex-col items-center rounded-xl bg-page p-3 sm:p-4">
          <div className="relative flex flex-1 items-center justify-center">
            <svg aria-label={`${total} reservations distributed by status`} className="h-52 w-52 overflow-visible sm:h-56 sm:w-56" role="img" viewBox="0 0 180 180">
              <circle cx="90" cy="90" fill="none" r="64" stroke="#f1f5f9" strokeWidth="17" />
              {segments.map((segment) => (
                <circle
                  className="transition-all duration-700"
                  cx="90"
                  cy="90"
                  fill="none"
                  key={segment.key}
                  r="64"
                  stroke={segment.color}
                  strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                  strokeDashoffset={-segment.offset}
                  strokeLinecap="round"
                  strokeWidth="17"
                  transform="rotate(-90 90 90)"
                >
                  <title>{`${segment.label}: ${segment.value} reservations, ${Math.round((Number(segment.value || 0) / total) * 100)}%`}</title>
                </circle>
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-semibold leading-none tracking-tight">{total}</span>
              <span className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-muted">Bookings</span>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            {stats.map((item) => (
              <div className="rounded-xl border border-line bg-white p-3 shadow-sm" key={item.key}>
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-page" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-xs font-medium text-muted">{item.label}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="text-xl font-semibold tabular-nums">{item.value}</span>
                  <span className="text-xs font-medium text-muted">{Math.round((Number(item.value || 0) / total) * 100)}%</span>
                </div>
                <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-page">
                  <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${(Number(item.value || 0) / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto flex w-full items-center justify-between gap-3 border-t border-line pt-3">
            <p className="min-w-0 truncate text-xs text-muted">Top status: <span className="font-medium text-ink">{leadingStatus?.label}</span> <span>({leadingPercent}%)</span></p>
            <Link className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary-dark hover:underline" href="/reservations">View all <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-xl bg-page px-4 text-center">
          <CalendarCheck aria-hidden="true" className="h-9 w-9 text-muted/60" />
          <p className="mt-3 font-medium">No reservations to chart yet</p>
          <p className="mt-1 text-sm text-muted">Reservation status totals will appear here as bookings are added.</p>
        </div>
      )}
    </Card>
  );
}

function OperationsWorkloadChart({ items, loading }) {
  const maximum = Math.max(1, ...items.map((item) => Number(item.value || 0)));
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-dark"><BarChart3 aria-hidden="true" className="h-4 w-4" /></span>
        <div>
          <h2 className="font-semibold">Operations workload</h2>
          <p className="text-xs text-muted">Open tasks compared on one scale</p>
        </div>
      </div>
      {loading ? (
        <div aria-label="Loading operations chart" className="mt-5 flex flex-1 flex-col justify-evenly space-y-5" role="status">
          {items.map((item) => <div key={item.label}><div className="mb-2 h-3 w-36 animate-pulse rounded bg-page" /><div className="h-2.5 animate-pulse rounded-full bg-page" /></div>)}
        </div>
      ) : total === 0 ? (
        <div className="mt-5 flex flex-1 items-center justify-center rounded-xl bg-page px-4 text-center text-sm text-muted">All operational queues are clear.</div>
      ) : (
        <div className="mt-5 flex flex-1 flex-col justify-evenly">
          {items.map((item) => {
            const value = Number(item.value || 0);
            return (
              <Link className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary" href={item.href} key={item.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-muted">{item.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{value}</span>
                </div>
                <div aria-label={`${item.label}: ${value}`} className="h-2.5 overflow-hidden rounded-full bg-page" role="img">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ backgroundColor: item.color, width: `${value ? Math.max(4, (value / maximum) * 100) : 0}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
        <span>Tasks requiring attention</span>
        <span className="font-semibold tabular-nums text-ink">{loading ? "..." : total}</span>
      </div>
    </Card>
  );
}

function FinancialOverviewChart({ revenue, outstanding, unpaidCount, loading }) {
  const rows = [
    { label: "Paid revenue", value: Number(revenue || 0), color: "#10b981" },
    { label: "Outstanding balance", value: Number(outstanding || 0), color: "#f97316" },
  ];
  const maximum = Math.max(1, ...rows.map((row) => row.value));

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-dark"><CreditCard aria-hidden="true" className="h-4 w-4" /></span>
          <div>
            <h2 className="font-semibold">Financial overview</h2>
            <p className="text-xs text-muted">Paid revenue vs unpaid balance</p>
          </div>
        </div>
        <div className="rounded-lg bg-page px-3 py-2 text-right">
          <p className="text-[10px] text-muted">Unpaid invoices</p>
          <p className="text-sm font-semibold tabular-nums">{loading ? "..." : unpaidCount}</p>
        </div>
      </div>
      {loading ? (
        <div aria-label="Loading financial chart" className="mt-8 flex flex-1 flex-col justify-evenly space-y-7" role="status">
          {rows.map((row) => <div key={row.label}><div className="mb-2 h-3 w-32 animate-pulse rounded bg-page" /><div className="h-3 animate-pulse rounded-full bg-page" /></div>)}
        </div>
      ) : (
        <div className="mt-7 flex flex-1 flex-col justify-evenly">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-sm text-muted">{row.label}</span>
                <span className="text-sm font-semibold tabular-nums">{formatMoney(row.value)}</span>
              </div>
              <div aria-label={`${row.label}: ${formatMoney(row.value)}`} className="h-3 overflow-hidden rounded-full bg-page" role="img">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ backgroundColor: row.color, width: `${row.value ? Math.max(2, (row.value / maximum) * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 border-t border-line pt-3 text-xs text-muted">Paid total and current unpaid balance, on the same scale.</div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isManager = ["admin", "manager"].includes(user?.role);
  const isStaff = ["admin", "manager", "receptionist"].includes(user?.role);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(isManager);
  const [error, setError] = useState("");
  const [reservationStats, setReservationStats] = useState([]);
  const [reservationStatsLoading, setReservationStatsLoading] = useState(true);
  const [recentReservations, setRecentReservations] = useState([]);
  const [guestUpcoming, setGuestUpcoming] = useState(null);
  const [guestCurrent, setGuestCurrent] = useState(null);
  const [invoiceStats, setInvoiceStats] = useState({ revenue: 0, outstanding: 0, unpaidCount: 0 });
  const [revenueDaily, setRevenueDaily] = useState([]);
  const [operations, setOperations] = useState({ pendingCleaning: 0, activeCleaning: 0, openMaintenance: 0, activeMaintenance: 0, pendingServices: 0, myActiveTasks: 0, availableTasks: 0, myOpenIssues: 0, myServiceRequests: 0 });
  const [operationsLoading, setOperationsLoading] = useState(true);
  const [operationsRefreshing, setOperationsRefreshing] = useState(false);
  const [operationsRefreshKey, setOperationsRefreshKey] = useState(0);
  const [operationsError, setOperationsError] = useState("");
  const [operationsUpdatedAt, setOperationsUpdatedAt] = useState(null);
  const [invoiceStatsLoading, setInvoiceStatsLoading] = useState(() => ["admin", "manager", "receptionist", "guest"].includes(user?.role));

  useEffect(() => {
    if (!isManager) return undefined;
    let active = true;
    api.get("/users")
      .then((result) => { if (active) setUsers(result || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isManager]);

  useEffect(() => {
    if (!isStaff) return undefined;
    let active = true;

    const loadStats = async () => {
      setReservationStatsLoading(true);
      try {
        const responses = await Promise.all(
          reservationStatusTiles.map(async (entry) => {
            const payload = await api.get(`/reservations?status=${entry.key}&limit=1`);
            return { ...entry, value: payload.total || 0 };
          })
        );
        const recent = await api.get("/reservations?limit=5");
        if (active) {
          setReservationStats(responses);
          setRecentReservations(recent.reservations || []);
        }
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load reservation stats.");
      } finally {
        if (active) setReservationStatsLoading(false);
      }
    };

    loadStats();
    return () => { active = false; };
  }, [isStaff]);

  useEffect(() => {
    const role = user?.role;
    if (!["admin", "manager", "receptionist", "guest"].includes(role)) {
      return undefined;
    }

    let active = true;
    const loadInvoiceStats = async () => {
      try {
        if (["admin", "manager"].includes(role)) {
          const report = await api.get("/invoices/report");
          if (active) {
            setInvoiceStats({
              revenue: Number(report.revenue || 0),
              outstanding: Number(report.summary?.unpaid?.amount || 0),
              unpaidCount: Number(report.summary?.unpaid?.count || 0),
            });
            setRevenueDaily(report.daily || []);
          }
        } else if (role === "receptionist") {
          const payload = await api.get("/invoices?status=unpaid&limit=1");
          if (active) setInvoiceStats((stats) => ({ ...stats, unpaidCount: Number(payload.total || 0) }));
        } else {
          const invoices = await api.get("/invoices/my");
          if (active) setInvoiceStats((stats) => ({ ...stats, unpaidCount: (invoices || []).filter((item) => item.status === "unpaid").length }));
        }
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load invoice summary.");
      } finally {
        if (active) setInvoiceStatsLoading(false);
      }
    };

    loadInvoiceStats();
    return () => { active = false; };
  }, [user?.role]);

  useEffect(() => {
    const role = user?.role;
    if (!["admin", "manager", "receptionist", "housekeeping", "guest"].includes(role)) return undefined;
    let active = true;
    const loadOperations = async () => {
      try {
        if (["admin", "manager", "receptionist"].includes(role)) {
          const requests = [
            { key: "pendingCleaning", label: "Pending cleaning", path: "/housekeeping?status=pending&limit=1" },
            { key: "activeCleaning", label: "In-progress cleaning", path: "/housekeeping?status=in-progress&limit=1" },
            { key: "openMaintenance", label: "Open maintenance", path: "/maintenance?status=open&limit=1" },
            { key: "activeMaintenance", label: "In-progress maintenance", path: "/maintenance?status=in-progress&limit=1" },
            { key: "pendingServices", label: "Pending service requests", path: "/services?status=pending&limit=1" },
          ];
          const results = await Promise.allSettled(requests.map((request) => api.get(request.path)));
          const nextOperations = {};
          const failedLabels = [];
          results.forEach((result, index) => {
            if (result.status === "fulfilled") {
              nextOperations[requests[index].key] = Number(result.value.total || 0);
            } else {
              failedLabels.push(requests[index].label);
            }
          });
          if (active) {
            if (Object.keys(nextOperations).length) {
              setOperations((current) => ({ ...current, ...nextOperations }));
              setOperationsUpdatedAt(new Date());
            }
            setOperationsError(failedLabels.length ? `Some counts could not refresh: ${failedLabels.join(", ")}.` : "");
          }
        } else if (role === "housekeeping") {
          const [mine, available] = await Promise.all([api.get("/housekeeping/my"), api.get("/housekeeping/open")]);
          if (active) setOperations((current) => ({
            ...current,
            myActiveTasks: (mine || []).filter((task) => ["pending", "in-progress"].includes(task.status)).length,
            availableTasks: (available || []).length,
          }));
        } else {
          const [issues, serviceRequests] = await Promise.all([api.get("/maintenance/my"), api.get("/services/my")]);
          if (active) setOperations((current) => ({
            ...current,
            myOpenIssues: (issues || []).filter((issue) => ["open", "in-progress"].includes(issue.status)).length,
            myServiceRequests: (serviceRequests || []).filter((request) => ["pending", "in-progress"].includes(request.status)).length,
          }));
        }
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load operations summary.");
      } finally {
        if (active) {
          setOperationsLoading(false);
          setOperationsRefreshing(false);
        }
      }
    };
    loadOperations();
    return () => { active = false; };
  }, [operationsRefreshKey, user?.role]);

  useEffect(() => {
    if (!isStaff) return undefined;
    let lastRefreshAt = Date.now();
    const refreshIfVisible = () => {
      const now = Date.now();
      if (document.visibilityState !== "visible" || now - lastRefreshAt < 5000) return;
      lastRefreshAt = now;
      setOperationsRefreshing(true);
      setOperationsRefreshKey((key) => key + 1);
    };
    const intervalId = window.setInterval(refreshIfVisible, 60000);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [isStaff]);

  useEffect(() => {
    if (user?.role !== "guest") return undefined;
    let active = true;
    api.get("/reservations/my")
      .then((items) => {
        const sorted = [...(items || [])].sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
        if (active) {
          setGuestUpcoming(sorted.find((item) => item.status === "confirmed") || null);
          setGuestCurrent(sorted.find((item) => item.status === "checked-in") || null);
        }
      })
      .catch(() => {
        if (active) setGuestUpcoming(null);
      });
    return () => { active = false; };
  }, [user?.role]);

  const stats = [
    { label: "Total users", value: users.length, Icon: Users },
    { label: "Active", value: users.filter((item) => item.isActive).length, Icon: UserRound },
    { label: "Deactivated", value: users.filter((item) => !item.isActive).length, Icon: ShieldCheck },
    { label: "Staff", value: users.filter((item) => item.role !== "guest").length, Icon: Wrench },
    { label: "Guests", value: users.filter((item) => item.role === "guest").length, Icon: Users },
  ];

  const guestCards = [
    { title: "Upcoming booking", booking: guestUpcoming },
    { title: "Current stay", booking: guestCurrent },
  ];

  const invoiceCards = isManager
    ? [
      { label: "Revenue", value: invoiceStatsLoading ? "..." : formatMoney(invoiceStats.revenue), Icon: CreditCard, href: "/billing" },
      { label: "Outstanding", value: invoiceStatsLoading ? "..." : formatMoney(invoiceStats.outstanding), Icon: CreditCard, href: "/billing" },
      { label: "Unpaid invoices", value: invoiceStatsLoading ? "..." : invoiceStats.unpaidCount, Icon: ReceiptText, href: "/invoices" },
    ]
    : [{ label: "Unpaid invoices", value: invoiceStatsLoading ? "..." : invoiceStats.unpaidCount, Icon: ReceiptText, href: user?.role === "guest" ? "/my-invoices" : "/invoices" }];
  const chartDays = getRecentRevenueDays(revenueDaily);
  const operationsChartItems = [
    { label: "Pending cleaning", value: operations.pendingCleaning, color: "#f59e0b", href: "/housekeeping?status=pending" },
    { label: "In-progress cleaning", value: operations.activeCleaning, color: "#0ea5e9", href: "/housekeeping?status=in-progress" },
    { label: "Open maintenance", value: operations.openMaintenance, color: "#ef4444", href: "/maintenance?status=open" },
    { label: "In-progress maintenance", value: operations.activeMaintenance, color: "#8b5cf6", href: "/maintenance?status=in-progress" },
    { label: "Pending service requests", value: operations.pendingServices, color: "#10b981", href: "/services?status=pending" },
  ];

  return (
    <div className="space-y-6">
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0"><h1 className="text-xl font-semibold sm:text-2xl">Welcome back, <span className="break-words">{user?.name}</span></h1><p className="mt-1 text-sm text-muted">Here’s your LuxuryStay overview.</p></div>
      <div className="flex flex-wrap items-center gap-2"><Badge tone="primary">{user?.role}</Badge><span className="text-xs text-muted sm:text-sm">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span></div>
      </div>

      {user?.role === "guest" ? (
        <div className="space-y-6">
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link className="block h-full" href="/my-issues"><Card className="flex h-full min-h-24 items-center gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><AlertTriangle aria-hidden="true" className="h-5 w-5" /></div><div><p className="text-2xl font-semibold">{operationsLoading ? "..." : operations.myOpenIssues}</p><p className="text-sm text-muted">My open issues</p></div></Card></Link>
            <Link className="block h-full" href="/my-services"><Card className="flex h-full min-h-24 items-center gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><ConciergeBell aria-hidden="true" className="h-5 w-5" /></div><div><p className="text-2xl font-semibold">{operationsLoading ? "..." : operations.myServiceRequests}</p><p className="text-sm text-muted">Active service requests</p></div></Card></Link>
            <Link className="block h-full" href="/my-bookings"><Card className="flex h-full min-h-24 items-center gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><CalendarCheck aria-hidden="true" className="h-5 w-5" /></div><div><p className="text-sm font-medium">My bookings</p><p className="text-sm text-muted">View your upcoming and past stays</p></div></Card></Link>
          </div>
          <div className={`grid items-stretch gap-4 ${invoiceCards.length > 1 ? "md:grid-cols-3" : "md:grid-cols-1"}`}>
            {invoiceCards.map(({ label, value, Icon, href }) => (
              <Link className="block h-full" href={href} key={label}>
                <Card className="flex h-full min-h-24 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Icon className="h-5 w-5" /></div>
                  <div><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted">{label}</p></div>
                </Card>
              </Link>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
          {guestCards.map(({ title, booking }) => (
            <Card key={title}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{title}</h2>
                {booking ? <Badge tone={booking.status === "checked-in" ? "success" : "primary"}>{booking.status}</Badge> : null}
              </div>
              {booking ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted">Booking code</p>
                      <p className="font-medium">{booking.bookingCode}</p>
                    </div>
                    <p className="text-lg font-semibold">{formatPrice(booking.totalAmount || 0)}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-page p-3 text-sm text-muted">
                    <p><span className="font-medium text-ink">Room:</span> Room {booking.room?.roomNumber}</p>
                    <p><span className="font-medium text-ink">Dates:</span> {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</p>
                    <p><span className="font-medium text-ink">Stay:</span> {nightsLabel(booking.nights || 0)}</p>
                  </div>
                  <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-page" href="/my-bookings">View bookings</Link>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-muted">No upcoming or current reservation found.</p>
                  <Link className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark" href="/reservations/new">Book a room</Link>
                </div>
              )}
            </Card>
          ))}
          </div>
        </div>
      ) : user?.role === "housekeeping" ? (
        <div className="space-y-6">
          {error && <Alert>{error}</Alert>}
          <div className="grid items-stretch gap-4 sm:grid-cols-2">
            {[{ label: "My active tasks", value: operations.myActiveTasks, Icon: ClipboardList, href: "/housekeeping" }, { label: "Available tasks", value: operations.availableTasks, Icon: SprayCan, href: "/housekeeping?status=available" }].map(({ label, value, Icon, href }) => (
              <Link className="block h-full" href={href} key={label}><Card className="flex h-full min-h-24 items-center gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Icon aria-hidden="true" className="h-5 w-5" /></div><div><p className="text-2xl font-semibold">{operationsLoading ? "..." : value}</p><p className="text-sm text-muted">{label}</p></div></Card></Link>
            ))}
          </div>
          <Card><h2 className="font-semibold">Ready to get started?</h2><p className="mt-1 text-sm text-muted">Open My Tasks to start assigned work or claim a waiting task.</p><Link className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark" href="/housekeeping">Open My Tasks</Link></Card>
        </div>
      ) : isStaff ? (
        <div className="space-y-6">
          {error && <Alert>{error}</Alert>}
          {operationsError && <Alert>{operationsError}</Alert>}
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Operations</h2>
                <p className="mt-1 text-sm text-muted">Cleaning, maintenance, and guest-service queues</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  {operationsUpdatedAt
                    ? `Updated ${operationsUpdatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                    : operationsLoading ? "Loading live totals" : "Waiting for update"}
                </span>
                <button
                  aria-label="Refresh operations counts"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={operationsLoading || operationsRefreshing}
                  onClick={() => {
                    setOperationsRefreshing(true);
                    setOperationsRefreshKey((key) => key + 1);
                  }}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" className={`h-4 w-4 ${operationsRefreshing ? "animate-spin" : ""}`} />
                  <span>{operationsRefreshing ? "Refreshing" : "Refresh"}</span>
                </button>
              </div>
            </div>
            <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {[
              { label: "Pending cleaning tasks", value: operations.pendingCleaning, Icon: SprayCan, href: "/housekeeping?status=pending" },
              { label: "In-progress cleaning", value: operations.activeCleaning, Icon: ClipboardList, href: "/housekeeping?status=in-progress" },
              { label: "Open maintenance", value: operations.openMaintenance, Icon: AlertTriangle, href: "/maintenance?status=open" },
              { label: "In-progress maintenance", value: operations.activeMaintenance, Icon: Wrench, href: "/maintenance?status=in-progress" },
              { label: "Pending service requests", value: operations.pendingServices, Icon: ConciergeBell, href: "/services?status=pending" },
            ].map(({ label, value, Icon, href }) => <Link className="block h-full" href={href} key={label}><Card className="flex h-full min-h-[112px] items-center gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Icon aria-hidden="true" className="h-5 w-5" /></div><div className="min-w-0"><p className="text-2xl font-semibold">{operationsLoading ? "..." : value}</p><p className="text-sm text-muted">{label}</p></div></Card></Link>)}
            </div>
          </section>
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Financial overview</h2>
              <p className="mt-1 text-sm text-muted">{isManager ? "Revenue, outstanding balance, and unpaid invoices" : "Track invoices that still need payment"}</p>
            </div>
            <div className={`grid items-stretch gap-4 ${invoiceCards.length > 1 ? "md:grid-cols-3" : "md:grid-cols-1"}`}>
              {invoiceCards.map(({ label, value, Icon, href }) => (
                <Link className="block h-full" href={href} key={label}>
                  <Card className="flex h-full min-h-24 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Icon aria-hidden="true" className="h-5 w-5" /></div>
                    <div className="min-w-0"><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted">{label}</p></div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
          <div className="grid items-stretch gap-4 xl:grid-cols-2">
            {isManager && <RevenueTrendChart days={chartDays} loading={invoiceStatsLoading} />}
            <ReservationStatusChart loading={reservationStatsLoading} stats={reservationStats} />
            <OperationsWorkloadChart items={operationsChartItems} loading={operationsLoading} />
            {isManager && <FinancialOverviewChart loading={invoiceStatsLoading} outstanding={invoiceStats.outstanding} revenue={invoiceStats.revenue} unpaidCount={invoiceStats.unpaidCount} />}
          </div>

          <Card className="p-0">
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <h2 className="font-semibold">Recent reservations</h2>
                <p className="mt-1 text-sm text-muted">Latest booking activity</p>
              </div>
              <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-page" href="/reservations">View all</Link>
            </div>
            {recentReservations.length ? (
              <div className="divide-y divide-line">
                {recentReservations.map((reservation) => (
                  <div className="flex min-w-0 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5" key={reservation._id}>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{reservation.bookingCode}</p>
                      <p className="truncate text-xs text-muted">{reservation.guest?.name || "Guest"} · Room {reservation.room?.roomNumber}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className="text-xs text-muted">{formatDate(reservation.checkIn)} → {formatDate(reservation.checkOut)}</span>
                      <Badge tone={reservation.status === "confirmed" ? "warning" : reservation.status === "checked-in" ? "success" : reservation.status === "cancelled" ? "error" : "neutral"}>{reservation.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 pb-5 text-sm text-muted">No reservations yet.</p>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {error && <Alert>{error}</Alert>}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 5 }, (_, index) => <Card className="space-y-3" key={index}><div className="h-10 w-10 rounded-lg bg-page" /><div className="h-7 w-16 rounded-lg bg-page" /><div className="h-4 w-24 rounded-lg bg-page" /></Card>)}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(({ label, value, Icon }) => <Card className="flex items-center gap-4" key={label}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Icon className="h-5 w-5" /></div><div className="min-w-0"><p className="text-2xl font-semibold">{value}</p><p className="truncate text-sm text-muted">{label}</p></div></Card>)}
            </div>
          )}
          <Card className="p-0">
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5"><div><h2 className="font-semibold">Recent users</h2><p className="mt-1 text-sm text-muted">Latest accounts in your system</p></div><Link className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-page" href="/users">View all</Link></div>
            {loading ? <Loader label="Loading recent users" /> : users.length ? <div className="divide-y divide-line">{users.slice(0, 5).map((entry) => <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-5" key={entry._id}><div className="min-w-0"><p className="truncate text-sm font-medium">{entry.name}</p><p className="truncate text-xs text-muted">{entry.email}</p></div><div className="flex shrink-0 items-center gap-2"><Badge>{entry.role}</Badge><Badge tone={entry.isActive ? "success" : "error"}>{entry.isActive ? "Active" : "Deactivated"}</Badge></div></div>)}</div> : <p className="px-5 pb-5 text-sm text-muted">No users found.</p>}
          </Card>
        </div>
      )}

    </div>
  );
}
