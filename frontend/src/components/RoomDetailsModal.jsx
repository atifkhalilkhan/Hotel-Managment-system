/* Modal that shows a room’s photo gallery, details, and action buttons. */
import { CalendarDays, ChevronLeft, ChevronRight, Layers3, Users, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Modal } from "./UI.jsx";
import { formatPrice, getAmenityIcon, getRoomStatusMeta, getRoomTypeLabel } from "../lib/roomUtils.js";

export default function RoomDetailsModal({ room, open, onClose, role, onEdit, onStatusChange, onDelete }) {
  const [index, setIndex] = useState(0);
  const images = room?.images || [];
  const statusMeta = getRoomStatusMeta(room?.status);
  const StatusIcon = statusMeta.icon;
  const canEdit = ["admin", "manager"].includes(role);
  const canDelete = role === "admin";
  const canChange = ["admin", "manager", "receptionist", "housekeeping"].includes(role);

  const amenities = useMemo(() => room?.amenities || [], [room]);

  if (!room) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Room ${room.roomNumber}`}>
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-lg border border-line bg-page">
          {images[index] ? (
            <img alt={`Room ${room.roomNumber} photo ${index + 1}`} className="h-64 w-full object-cover sm:h-72" src={images[index].url} />
          ) : (
            <div className="flex h-64 items-center justify-center text-muted">No photo available</div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-ink"><StatusIcon className="h-3.5 w-3.5" />{statusMeta.label}</span>
            <Badge tone="neutral">{getRoomTypeLabel(room.type)}</Badge>
          </div>
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
              <button aria-label="Previous photo" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink" onClick={() => setIndex((current) => (current === 0 ? images.length - 1 : current - 1))} type="button"><ChevronLeft className="h-4 w-4" /></button>
              <button aria-label="Next photo" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink" onClick={() => setIndex((current) => (current + 1) % images.length)} type="button"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image, imageIndex) => (
              <button aria-label={`View room image ${imageIndex + 1}`} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${imageIndex === index ? "border-primary" : "border-line"}`} key={image.publicId || imageIndex} onClick={() => setIndex(imageIndex)} type="button"><img alt={`Room ${room.roomNumber} thumbnail ${imageIndex + 1}`} className="h-full w-full object-cover" src={image.url} /></button>
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line p-3"><div className="flex items-center gap-2 text-muted"><WalletCards className="h-4 w-4" />Price</div><p className="mt-2 text-xl font-semibold">{formatPrice(room.pricePerNight)}</p><p className="text-xs text-muted">per night</p></div>
          <div className="rounded-lg border border-line p-3"><div className="flex items-center gap-2 text-muted"><Layers3 className="h-4 w-4" />Floor</div><p className="mt-2 text-xl font-semibold">{room.floor}</p></div>
          <div className="rounded-lg border border-line p-3"><div className="flex items-center gap-2 text-muted"><Users className="h-4 w-4" />Capacity</div><p className="mt-2 text-xl font-semibold">{room.capacity}</p></div>
          <div className="rounded-lg border border-line p-3"><div className="flex items-center gap-2 text-muted"><CalendarDays className="h-4 w-4" />Created</div><p className="mt-2 text-sm font-medium">{new Date(room.createdAt).toLocaleDateString()}</p></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Description</h3>
          <p className="text-sm text-muted">{room.description || "No description provided."}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {amenities.length ? amenities.map((amenity) => { const Icon = getAmenityIcon(amenity); return <span className="inline-flex items-center gap-1 rounded-full border border-line bg-page px-2 py-1 text-xs font-medium" key={amenity}><Icon className="h-3.5 w-3.5" />{amenity}</span>; }) : <span className="text-sm text-muted">No amenities listed.</span>}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {canEdit && <Button onClick={onEdit} type="button" variant="outline">Edit</Button>}
          {canChange && <Button onClick={onStatusChange} type="button">Change status</Button>}
          {canDelete && <Button onClick={onDelete} type="button" variant="danger">Delete</Button>}
        </div>
      </div>
    </Modal>
  );
}
