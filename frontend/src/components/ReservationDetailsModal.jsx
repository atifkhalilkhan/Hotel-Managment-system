/* Details modal for reservation records and actions. */
import { CalendarCheck, CalendarDays, LogIn, LogOut, UserRound, XCircle } from "lucide-react";
import { Button, Modal, Badge } from "./UI.jsx";
import { formatDate, formatPrice, nightsLabel, reservationStatusLabel } from "../lib/reservationUtils.js";

const statusMeta = {
  confirmed: { tone: "warning", label: "Confirmed" },
  "checked-in": { tone: "success", label: "Checked in" },
  "checked-out": { tone: "neutral", label: "Checked out" },
  cancelled: { tone: "error", label: "Cancelled" },
};

export default function ReservationDetailsModal({ open, onClose, reservation, userRole, onCheckIn, onCheckOut, onCancel, onPrint }) {
  if (!open || !reservation) return null;

  const room = reservation.room || {};
  const guest = reservation.guest || {};
  const status = statusMeta[reservation.status] || { tone: "neutral", label: reservationStatusLabel(reservation.status) };
  const canCheckIn = ["admin", "manager", "receptionist"].includes(userRole) && reservation.status === "confirmed";
  const canCheckOut = ["admin", "manager", "receptionist"].includes(userRole) && reservation.status === "checked-in";
  const canCancel = reservation.status === "confirmed" && (["admin", "manager", "receptionist"].includes(userRole) || userRole === "guest");

  const timeline = [
    { label: "Booked", time: reservation.createdAt, icon: CalendarCheck },
    { label: "Checked in", time: reservation.checkedInAt, icon: LogIn },
    { label: "Checked out", time: reservation.checkedOutAt || reservation.cancelledAt, icon: reservation.status === "cancelled" ? XCircle : LogOut },
  ].filter((entry) => entry.time);

  return (
    <Modal open={open} onClose={onClose} title={`Reservation ${reservation.bookingCode}`}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted">Booking reference</p>
            <h3 className="mt-1 text-xl font-semibold">{reservation.bookingCode}</h3>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-page">
          {room.images?.[0]?.url ? (
            <img alt={`${room.roomNumber || "Room"} view`} className="h-48 w-full object-cover" src={room.images[0].url} />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted">No image available</div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-line p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Guest</p>
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted" />
              <span className="font-medium">{guest.name || "Guest"}</span>
            </div>
            <p className="text-sm text-muted">{guest.email || "No email"}</p>
            <p className="text-sm text-muted">{guest.phone || "No phone"}</p>
          </div>
          <div className="space-y-2 rounded-lg border border-line p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Room</p>
            <p className="font-medium">Room {room.roomNumber || "-"}</p>
            <p className="text-sm text-muted">{room.type || "-"} · Floor {room.floor || "-"}</p>
            <p className="text-sm text-muted">{formatPrice(room.pricePerNight)} / night</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Check-in</p>
            <p className="mt-2 font-medium">{formatDate(reservation.checkIn)}</p>
          </div>
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Check-out</p>
            <p className="mt-2 font-medium">{formatDate(reservation.checkOut)}</p>
          </div>
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Guests</p>
            <p className="mt-2 font-medium">{reservation.guestsCount || 1}</p>
          </div>
        </div>

        <div className="rounded-lg border border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-muted">Stay summary</p>
            <span className="font-medium">{formatPrice(reservation.totalAmount || 0)}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <CalendarDays className="h-4 w-4" />
            <span>{nightsLabel(reservation.nights || 0)} · {formatPrice(reservation.pricePerNight || 0)} per night</span>
          </div>
        </div>

        {reservation.specialRequests && (
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Special requests</p>
            <p className="mt-2 text-sm">{reservation.specialRequests}</p>
          </div>
        )}

        <div className="rounded-lg border border-line p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Status timeline</p>
          <div className="mt-3 space-y-3">
            {timeline.map((entry) => (
              <div className="flex items-start gap-3" key={entry.label}>
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                  <entry.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{entry.label}</p>
                  <p className="text-sm text-muted">{formatDate(entry.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onPrint && <Button onClick={onPrint} type="button" variant="outline">Print</Button>}
          {canCheckIn && <Button onClick={onCheckIn} type="button">Check-in</Button>}
          {canCheckOut && <Button onClick={onCheckOut} type="button">Check-out</Button>}
          {canCancel && <Button onClick={onCancel} type="button" variant="danger">Cancel</Button>}
        </div>
      </div>
    </Modal>
  );
}
