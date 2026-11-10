/* Role-specific overview with live user and reservation statistics. */
import { useEffect, useState } from "react";
import { BedDouble, CalendarCheck, CreditCard, ShieldCheck, UserRound, Users, Wrench } from "lucide-react";
import api from "../api/axios.js";
import useAuth from "../context/useAuth.js";
import Link from "../components/Link.jsx";
import { Alert, Badge, Card, Loader } from "../components/UI.jsx";
import { formatDate, formatPrice, nightsLabel } from "../lib/reservationUtils.js";

const upcoming = [
  { label: "Rooms", Icon: BedDouble },
  { label: "Billing", Icon: CreditCard },
  { label: "Housekeeping", Icon: Wrench },
  { label: "Reports", Icon: ShieldCheck },
];

const reservationStatusTiles = [
  { key: "confirmed", label: "Confirmed" },
  { key: "checked-in", label: "In-house" },
  { key: "checked-out", label: "Checked out" },
  { key: "cancelled", label: "Cancelled" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isManager = ["admin", "manager"].includes(user?.role);
  const isStaff = ["admin", "manager", "receptionist"].includes(user?.role);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(isManager);
  const [error, setError] = useState("");
  const [reservationStats, setReservationStats] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [guestUpcoming, setGuestUpcoming] = useState(null);
  const [guestCurrent, setGuestCurrent] = useState(null);

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
      }
    };

    loadStats();
    return () => { active = false; };
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

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0"><h1 className="text-xl font-semibold sm:text-2xl">Welcome back, <span className="break-words">{user?.name}</span></h1><p className="mt-1 text-sm text-muted">Here’s your LuxuryStay overview.</p></div>
        <div className="flex items-center gap-2"><Badge tone="primary">{user?.role}</Badge><span className="text-sm text-muted">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span></div>
      </div>

      {user?.role === "guest" ? (
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
      ) : isStaff ? (
        <div className="space-y-6">
          {error && <Alert>{error}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {reservationStats.map(({ key, label, value }) => (
              <Link className="block" href="/reservations" key={key}>
                <Card className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><CalendarCheck className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="truncate text-sm text-muted">{label}</p>
                  </div>
                </Card>
              </Link>
            ))}
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

      <Card><h2 className="font-semibold">Coming soon</h2><p className="mt-1 text-sm text-muted">More tools to support your stay and operations.</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{upcoming.map(({ label, Icon }) => <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line p-3" key={label}><Icon className="h-5 w-5 shrink-0 text-muted" /><span className="truncate text-sm">{label}</span></div>)}</div></Card>
    </div>
  );
}
