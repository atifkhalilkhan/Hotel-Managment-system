/* Staff reservation management view with filters, actions and pagination. */
import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarPlus, CalendarRange, Eye, LogIn, LogOut, XCircle } from "lucide-react";
import api from "../api/axios.js";
import Link from "../components/Link.jsx";
import Pagination from "../components/Pagination.jsx";
import ReservationDetailsModal from "../components/ReservationDetailsModal.jsx";
import SearchInput from "../components/SearchInput.jsx";
import { Alert, Button, Card, ConfirmDialog, EmptyState, IconButton, Input, PageHeader, Select, Table } from "../components/UI.jsx";
import { formatDate, formatPrice, nightsLabel, reservationStatusOptions } from "../lib/reservationUtils.js";
import useAuth from "../context/useAuth.js";

const badgeTone = {
  confirmed: "warning",
  "checked-in": "success",
  "checked-out": "neutral",
  cancelled: "error",
};

export default function Reservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let active = true;
    const reservation = selectedReservation;
    const timer = window.setTimeout(() => {
      if (!reservation || !["checked-in", "checked-out"].includes(reservation.status)) {
        setSelectedInvoice(null);
        setInvoiceError("");
        setInvoiceLoading(false);
        return;
      }

      setSelectedInvoice(null);
      setInvoiceError("");
      setInvoiceLoading(true);
      api.get(`/invoices?reservation=${encodeURIComponent(reservation._id)}&limit=1`)
        .then((payload) => {
          if (active) setSelectedInvoice(payload.invoices?.[0] || null);
        })
        .catch((requestError) => {
          if (active) setInvoiceError(requestError.message || "Unable to check for an invoice.");
        })
        .finally(() => {
          if (active) setInvoiceLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedReservation]);

  const handleGenerateInvoice = async () => {
    if (!selectedReservation) return;
    setGeneratingInvoice(true);
    setInvoiceError("");
    try {
      const created = await api.post("/invoices", { reservation: selectedReservation._id });
      setSelectedInvoice(created);
      setSuccess(`Invoice ${created.invoiceNumber} generated.`);
    } catch (requestError) {
      setInvoiceError(requestError.message || "Unable to generate invoice.");
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const fetchReservations = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError("");
    setLoading(true);

    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    try {
      const payload = await api.get(`/reservations?${params.toString()}`);
      if (requestId !== requestIdRef.current) return;
      setReservations(payload.reservations || []);
      setTotalPages(payload.pages || 1);
      setTotal(payload.total || 0);
    } catch (requestError) {
      if (requestId === requestIdRef.current) setError(requestError.message || "Unable to load reservations.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [fromDate, page, pageSize, search, status, toDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchReservations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReservations]);

  const handleAction = async (type, reservation) => {
    const endpoint = type === "check-in" ? "/check-in" : type === "check-out" ? "/check-out" : "/cancel";
    setSubmitting(true);
    try {
      const payload = await api.patch(`/reservations/${reservation._id}${endpoint}`);
      setSuccess(payload.message || "Reservation updated successfully.");
      setSelectedReservation(null);
      setActionTarget(null);
      await fetchReservations();
    } catch (requestError) {
      setError(requestError.message || "The reservation could not be updated.");
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${total} reservations in the system`}
        title="Reservations"
        action={
          <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark" href="/reservations/new">
            <CalendarPlus className="h-4 w-4" />
            New Reservation
          </Link>
        }
      />

      {success && <Alert className="mb-4" onClose={() => setSuccess("")} type="success">{success}</Alert>}
      {error && <Alert className="mb-4" onClose={() => setError("")}>{error}</Alert>}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <SearchInput ariaLabel="Search reservations" onChange={(event) => { setSearch(event.target.value); setPage(1); }} onClear={() => { setSearch(""); setPage(1); }} placeholder="Search booking code, e.g. RES-0012" value={search} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Select className="min-w-[160px]" id="reservation-status" label="Status" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
                {reservationStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium" onClick={clearFilters} type="button">
                <CalendarRange className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input id="reservation-from" label="From" onChange={(event) => { setFromDate(event.target.value); setPage(1); }} type="date" value={fromDate} />
            <Input id="reservation-to" label="To" min={fromDate || undefined} onChange={(event) => { setToDate(event.target.value); setPage(1); }} type="date" value={toDate} />
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-0">
          <div className="divide-y divide-line">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="flex items-center gap-3 px-4 py-3" key={index}>
                <div className="h-9 w-28 animate-pulse rounded-lg bg-page" />
                <div className="h-9 flex-1 animate-pulse rounded-lg bg-page" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-page" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-page" />
              </div>
            ))}
          </div>
        </Card>
      ) : reservations.length ? (
        <Card className="p-0">
          <div className="overflow-hidden rounded-lg">
            <div className="hidden md:block">
              <Table headings={["Booking", "Guest", "Room", "Dates", "Total", "Status", "Actions"]}>
                {reservations.map((reservation) => {
                  const room = reservation.room || {};
                  const guest = reservation.guest || {};
                  return (
                    <tr key={reservation._id}>
                      <td className="px-4 py-3 align-middle">
                        <div className="font-medium text-ink">{reservation.bookingCode}</div>
                        <div className="text-xs text-muted">{formatDate(reservation.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="font-medium">{guest.name || "Guest"}</div>
                        <div className="text-xs text-muted">{guest.phone || "No phone"}</div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          {room.images?.[0]?.url ? <img alt={room.roomNumber || "Room"} className="h-9 w-12 rounded-md object-cover" src={room.images[0].url} /> : <div className="flex h-9 w-12 items-center justify-center rounded-md bg-page text-[10px] text-muted">Room</div>}
                          <div>
                            <div className="font-medium">Room {room.roomNumber || "-"}</div>
                            <div className="text-xs text-muted">{room.type || "-"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="font-medium">{formatDate(reservation.checkIn)} → {formatDate(reservation.checkOut)}</div>
                        <div className="text-xs text-muted">{nightsLabel(reservation.nights || 0)}</div>
                      </td>
                      <td className="px-4 py-3 align-middle font-medium">{formatPrice(reservation.totalAmount || 0)}</td>
                      <td className="px-4 py-3 align-middle"><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${badgeTone[reservation.status] === "warning" ? "bg-orange-100 text-primary-dark" : badgeTone[reservation.status] === "success" ? "bg-green-100 text-green-700" : badgeTone[reservation.status] === "error" ? "bg-red-100 text-red-600" : "bg-page text-ink"}`}>{reservation.status.replace("-", " ")}</span></td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <IconButton ariaLabel={`View reservation ${reservation.bookingCode}`} onClick={() => setSelectedReservation(reservation)} title="View booking">
                            <Eye className="h-4 w-4" />
                          </IconButton>
                          {reservation.status === "confirmed" && (
                            <IconButton ariaLabel={`Check in reservation ${reservation.bookingCode}`} onClick={() => handleAction("check-in", reservation)} title="Check in" >
                              <LogIn className="h-4 w-4" />
                            </IconButton>
                          )}
                          {reservation.status === "checked-in" && (
                            <IconButton ariaLabel={`Check out reservation ${reservation.bookingCode}`} onClick={() => handleAction("check-out", reservation)} title="Check out">
                              <LogOut className="h-4 w-4" />
                            </IconButton>
                          )}
                          {reservation.status === "confirmed" && (
                            <IconButton ariaLabel={`Cancel reservation ${reservation.bookingCode}`} className="text-red-600 hover:border-red-300 hover:bg-red-50" onClick={() => setActionTarget(reservation)} title="Cancel booking">
                              <XCircle className="h-4 w-4" />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Table>
            </div>
            <div className="space-y-3 md:hidden">
              {reservations.map((reservation) => {
                const room = reservation.room || {};
                const guest = reservation.guest || {};
                return (
                  <div className="border-b border-line p-4" key={reservation._id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{reservation.bookingCode}</p>
                        <p className="text-xs text-muted">{guest.name || "Guest"}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium capitalize ${badgeTone[reservation.status] === "warning" ? "bg-orange-100 text-primary-dark" : badgeTone[reservation.status] === "success" ? "bg-green-100 text-green-700" : badgeTone[reservation.status] === "error" ? "bg-red-100 text-red-600" : "bg-page text-ink"}`}>{reservation.status.replace("-", " ")}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      {room.images?.[0]?.url ? <img alt={room.roomNumber || "Room"} className="h-12 w-16 rounded-md object-cover" src={room.images[0].url} /> : <div className="flex h-12 w-16 items-center justify-center rounded-md bg-page text-[10px] text-muted">Room</div>}
                      <div className="min-w-0">
                        <p className="font-medium">Room {room.roomNumber || "-"}</p>
                        <p className="text-xs text-muted">{room.type || "-"}</p>
                        <p className="mt-1 text-xs text-muted">{formatDate(reservation.checkIn)} to {formatDate(reservation.checkOut)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span>{nightsLabel(reservation.nights || 0)}</span>
                      <span className="font-medium">{formatPrice(reservation.totalAmount || 0)}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <IconButton ariaLabel={`View reservation ${reservation.bookingCode}`} onClick={() => setSelectedReservation(reservation)} title="View booking"><Eye className="h-4 w-4" /></IconButton>
                      {reservation.status === "confirmed" && <IconButton ariaLabel={`Check in reservation ${reservation.bookingCode}`} onClick={() => handleAction("check-in", reservation)} title="Check in"><LogIn className="h-4 w-4" /></IconButton>}
                      {reservation.status === "checked-in" && <IconButton ariaLabel={`Check out reservation ${reservation.bookingCode}`} onClick={() => handleAction("check-out", reservation)} title="Check out"><LogOut className="h-4 w-4" /></IconButton>}
                      {reservation.status === "confirmed" && <IconButton ariaLabel={`Cancel reservation ${reservation.bookingCode}`} className="text-red-600 hover:border-red-300 hover:bg-red-50" onClick={() => setActionTarget(reservation)} title="Cancel booking"><XCircle className="h-4 w-4" /></IconButton>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="px-4">
            <Pagination
              className="mt-0"
              itemLabel="reservations"
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              page={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              totalItems={total}
              totalPages={totalPages}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState description="Try changing the filters or create a booking." title="No reservations found" />
          <div className="mt-4 flex justify-center">
            <Button onClick={() => window.location.href = "/reservations/new"} type="button" variant="outline">New Reservation</Button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        loading={submitting}
        onClose={() => setActionTarget(null)}
        onConfirm={() => handleAction("cancel", actionTarget)}
        open={Boolean(actionTarget)}
        title="Cancel reservation"
      >
        Are you sure you want to cancel {actionTarget?.bookingCode}? This action cannot be undone.
      </ConfirmDialog>

      <ReservationDetailsModal
        onCancel={() => {
          if (selectedReservation?.status === "confirmed") setActionTarget(selectedReservation);
          setSelectedReservation(null);
        }}
        onCheckIn={() => handleAction("check-in", selectedReservation)}
        onCheckOut={() => handleAction("check-out", selectedReservation)}
        onClose={() => setSelectedReservation(null)}
        onGenerateInvoice={handleGenerateInvoice}
        open={Boolean(selectedReservation)}
        invoice={selectedInvoice}
        invoiceError={invoiceError}
        invoiceLoading={invoiceLoading}
        generatingInvoice={generatingInvoice}
        reservation={selectedReservation}
        userRole={user?.role}
      />
    </div>
  );
}
