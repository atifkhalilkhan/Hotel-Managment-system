/* Guest reservation list showing upcoming, current, and past stays. */
import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Eye, XCircle } from "lucide-react";
import api from "../api/axios.js";
import Link from "../components/Link.jsx";
import ReservationDetailsModal from "../components/ReservationDetailsModal.jsx";
import { Alert, Button, Card, ConfirmDialog, EmptyState, IconButton, PageHeader } from "../components/UI.jsx";
import { formatDate, formatPrice, nightsLabel } from "../lib/reservationUtils.js";

const tabs = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "current", label: "Current" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceError, setInvoiceError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [tab, setTab] = useState("all");
  const [payingInvoiceId, setPayingInvoiceId] = useState("");

  useEffect(() => {
    let mounted = true;

    Promise.all([
      api.get("/reservations/my"),
      api.get("/invoices/my").catch((requestError) => {
        if (mounted) setInvoiceError(requestError.message || "Unable to load invoices for your bookings.");
        return [];
      }),
    ])
      .then(([list, invoiceList]) => {
        if (!mounted) return;
        setBookings(list || []);
        setInvoices(invoiceList || []);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message || "Unable to load your bookings.");
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => {
      mounted = false;
    };
  }, []);

  const invoiceForBooking = (bookingId) => invoices.find((invoice) => {
    const reservationId = invoice.reservation?._id || invoice.reservation;
    return String(reservationId) === String(bookingId);
  });

  const handlePayInvoice = async (invoice) => {
    setPayingInvoiceId(invoice._id);
    setInvoiceError("");
    try {
      const payload = await api.post("/payments/create-checkout-session", { invoiceId: invoice._id });
      if (!payload?.url) throw new Error("Checkout session did not return a payment URL.");
      window.location.assign(payload.url);
    } catch (requestError) {
      setInvoiceError(requestError.message || "Unable to start card payment.");
      setPayingInvoiceId("");
    }
  };

  const filtered = useMemo(() => bookings.filter((booking) => {
    if (tab === "all") return true;
    if (tab === "upcoming") return booking.status === "confirmed";
    if (tab === "current") return booking.status === "checked-in";
    if (tab === "past") return booking.status === "checked-out";
    if (tab === "cancelled") return booking.status === "cancelled";
    return true;
  }), [bookings, tab]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      const payload = await api.patch(`/reservations/${cancelTarget._id}/cancel`);
      setError("");
      setSelected(null);
      setCancelTarget(null);
      setBookings((items) => items.map((item) => item._id === cancelTarget._id ? { ...item, status: payload.status || "cancelled" } : item));
    } catch (requestError) {
      setError(requestError.message || "Unable to cancel the booking.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description="Track upcoming stays and recent bookings"
        title="My Bookings"
        action={
          <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark" href="/reservations/new">
            <CalendarPlus className="h-4 w-4" />
            Book a room
          </Link>
        }
      />

      {error && <Alert className="mb-4" onClose={() => setError("")}>{error}</Alert>}
      {invoiceError && <Alert className="mb-4" onClose={() => setInvoiceError("")}>{invoiceError}</Alert>}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button className={`inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium ${tab === item.value ? "bg-primary text-white" : "border border-line bg-white text-ink hover:bg-page"}`} key={item.value} onClick={() => setTab(item.value)} type="button">
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-52 animate-pulse rounded-lg border border-line bg-page" key={index} />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((booking) => (
            <Card key={booking._id} className="overflow-hidden p-0">
              {booking.room?.images?.[0]?.url ? <img alt={booking.room.roomNumber} className="h-40 w-full object-cover" src={booking.room.images[0].url} /> : <div className="flex h-40 items-center justify-center bg-page text-sm text-muted">No image</div>}
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Room {booking.room?.roomNumber}</p>
                    <p className="text-sm text-muted">{booking.room?.type}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${booking.status === "confirmed" ? "bg-orange-100 text-primary-dark" : booking.status === "checked-in" ? "bg-green-100 text-green-700" : booking.status === "checked-out" ? "bg-page text-ink" : "bg-red-100 text-red-600"}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="text-sm text-muted">
                  <p>{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</p>
                  <p>{nightsLabel(booking.nights || 0)} · {booking.guestsCount} guests</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted">Code: {booking.bookingCode}</p>
                  <p className="font-semibold">{formatPrice(booking.totalAmount || 0)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <IconButton ariaLabel={`View booking ${booking.bookingCode}`} onClick={() => setSelected(booking)} title="View booking">
                    <Eye className="h-4 w-4" />
                  </IconButton>
                  {invoiceForBooking(booking._id) && (
                    <>
                      <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-page" href={`/invoices/${invoiceForBooking(booking._id)._id}`}>View invoice</Link>
                      {invoiceForBooking(booking._id).status === "unpaid" && (
                        <Button className="h-11 min-h-11 px-3" loading={payingInvoiceId === invoiceForBooking(booking._id)._id} onClick={() => handlePayInvoice(invoiceForBooking(booking._id))} type="button">Pay now</Button>
                      )}
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <IconButton ariaLabel={`Cancel booking ${booking.bookingCode}`} className="text-red-600 hover:border-red-300 hover:bg-red-50" onClick={() => setCancelTarget(booking)} title="Cancel booking">
                      <XCircle className="h-4 w-4" />
                    </IconButton>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState description="Pick your dates and reserve a room to get started." title="No bookings found" />
          <div className="mt-4 flex justify-center">
            <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark" href="/reservations/new">
              <CalendarPlus className="h-4 w-4" />
              Book a room
            </Link>
          </div>
        </Card>
      )}

      <ConfirmDialog
        loading={false}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        open={Boolean(cancelTarget)}
        title="Cancel booking"
      >
        Are you sure you want to cancel {cancelTarget?.bookingCode}?
      </ConfirmDialog>

      <ReservationDetailsModal
        onCancel={() => {
          if (selected?.status === "confirmed") setCancelTarget(selected);
          setSelected(null);
        }}
        onClose={() => setSelected(null)}
        open={Boolean(selected)}
        reservation={selected}
        userRole="guest"
        invoice={selected ? invoiceForBooking(selected._id) : null}
        invoiceError={invoiceError}
        invoiceLoading={false}
      />
    </div>
  );
}
