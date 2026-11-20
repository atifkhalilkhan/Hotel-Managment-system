/* Room listing card with gallery, status, metadata, and actions. */
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers3,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
  ImageIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { buildAmenitySummary, formatPrice, getAmenityIcon, getRoomMainImage, getRoomStatusMeta, getRoomTypeLabel } from "../lib/roomUtils.js";

function RoomActionButton({ label, title, onClick, icon: Icon, destructive = false }) {
  return (
    <button
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        destructive
          ? "border-red-100 text-red-600 hover:border-red-200 hover:bg-red-50"
          : "border-line text-muted hover:border-primary/30 hover:bg-primary-soft hover:text-primary-dark"
      }`}
      onClick={onClick}
      title={title}
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

export default function RoomCard({ room, role, onView, onStatusChange, onEdit, onDelete }) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const pointerStartX = useRef(null);
  const swipedAt = useRef(0);
  const images = room.images || [];
  const activeGalleryIndex = images.length ? galleryIndex % images.length : 0;
  const mainImage = images[activeGalleryIndex]?.url || getRoomMainImage(room);
  const allAmenities = room.amenities || [];
  const visibleAmenities = buildAmenitySummary(allAmenities).slice(0, 2);
  const amenityCount = new Set(allAmenities.map((item) => item.trim()).filter(Boolean)).size;
  const statusMeta = getRoomStatusMeta(room.status);
  const StatusIcon = statusMeta.icon;
  const statusIconColors = {
    available: "text-emerald-700",
    occupied: "text-rose-700",
    cleaning: "text-amber-700",
    maintenance: "text-slate-700",
  };
  const canChangeStatus = ["admin", "manager", "receptionist", "housekeeping"].includes(role);
  const canEdit = ["admin", "manager"].includes(role);
  const canDelete = role === "admin";

  const goToImage = (index) => setGalleryIndex((index + images.length) % images.length);
  const goPrev = () => goToImage(activeGalleryIndex - 1);
  const goNext = () => goToImage(activeGalleryIndex + 1);

  const startImageSwipe = (event) => {
    if (images.length < 2) return;
    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishImageSwipe = (event) => {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) < 40) return;
    swipedAt.current = Date.now();
    if (distance < 0) goNext();
    else goPrev();
  };

  const openDetailsUnlessSwiped = () => {
    if (Date.now() - swipedAt.current < 500) return;
    onView();
  };

  return (
    <section className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white p-0 shadow-[0_3px_14px_-8px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-0.5 hover:ring-primary/30 hover:shadow-[0_14px_30px_-18px_rgba(15,23,42,0.32)] motion-reduce:transform-none motion-reduce:transition-none">
      <div className="relative w-full overflow-hidden">
        <button
          aria-label={`View details for Room ${room.roomNumber}`}
          className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          onClick={openDetailsUnlessSwiped}
          onPointerCancel={() => { pointerStartX.current = null; }}
          onPointerDown={startImageSwipe}
          onPointerUp={finishImageSwipe}
          type="button"
        >
          <div className={`relative h-44 w-full overflow-hidden bg-slate-100 sm:h-48 ${images.length > 1 ? "touch-pan-y" : ""}`}>
            {mainImage ? (
              <img
                alt={`Room ${room.roomNumber} photo ${activeGalleryIndex + 1}`}
                className="absolute inset-0 block h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
                loading="lazy"
                src={mainImage}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-muted">
                <BedDouble aria-hidden="true" className="h-10 w-10 opacity-60" />
                <span className="text-xs font-medium">No room photo</span>
              </div>
            )}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
          </div>
        </button>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/60 bg-white/95 px-3 text-xs font-semibold text-ink shadow-sm backdrop-blur">
            <StatusIcon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${statusIconColors[room.status] || "text-muted"}`} />
            {statusMeta.label}
          </span>
          <span className="inline-flex h-8 items-center rounded-full border border-white/50 bg-black/35 px-3 text-xs font-medium text-white shadow-sm backdrop-blur">
            {getRoomTypeLabel(room.type)}
          </span>
        </div>

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 flex min-h-14 items-center justify-between gap-2 bg-gradient-to-t from-black/35 to-transparent px-3 pb-3 pt-5">
            <span aria-live="polite" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-black/65 px-2.5 text-xs font-medium text-white backdrop-blur">
              <ImageIcon aria-hidden="true" className="h-3.5 w-3.5" />
              {activeGalleryIndex + 1} / {images.length}
            </span>
            <div aria-label="Choose room photo" className="flex min-w-0 flex-1 items-center justify-center gap-1.5" role="group">
              {images.map((image, index) => (
                <button
                  aria-label={`Show photo ${index + 1} of ${images.length}`}
                  aria-pressed={activeGalleryIndex === index}
                  className={`h-2.5 shrink-0 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${activeGalleryIndex === index ? "w-5 bg-white" : "w-2.5 bg-white/65 hover:bg-white"}`}
                  key={image.publicId || image.url || index}
                  onClick={() => goToImage(index)}
                  type="button"
                />
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button aria-label={`Previous photo of Room ${room.roomNumber}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={goPrev} type="button"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
              <button aria-label={`Next photo of Room ${room.roomNumber}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={goNext} type="button"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3.5 p-4 sm:p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">Guest room</p>
            <h3 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-900">Room {room.roomNumber}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-600">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Layers3 aria-hidden="true" className="h-4 w-4" /></span>
                <span className="truncate">Floor {room.floor}</span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Users aria-hidden="true" className="h-4 w-4" /></span>
                <span className="truncate">{room.capacity} guest{Number(room.capacity) === 1 ? "" : "s"}</span>
              </span>
            </div>
          </div>
          <div className="shrink-0 rounded-xl border border-primary/10 bg-primary-soft/70 px-2.5 py-2 text-right">
            <p className="text-sm font-bold leading-tight text-primary-dark sm:text-base">{formatPrice(room.pricePerNight)}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-primary-dark/70">per night</p>
          </div>
        </div>

          <div className="flex min-h-8 flex-wrap content-start gap-2">
          {visibleAmenities.length ? visibleAmenities.map((amenity) => {
            const Icon = getAmenityIcon(amenity);
            return <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-line/70 bg-slate-50 px-2 text-[11px] font-medium text-slate-600" key={amenity}><Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary-dark" />{amenity}</span>;
          }) : <span className="text-xs text-muted">No amenities listed</span>}
          {amenityCount > visibleAmenities.length && (
            <span className="inline-flex h-8 items-center rounded-lg border border-line/70 bg-slate-50 px-2.5 text-xs font-semibold text-muted">
              +{amenityCount - visibleAmenities.length}
            </span>
          )}
        </div>

        <div className="mt-auto space-y-2.5 border-t border-slate-100 pt-3">
          {(canChangeStatus || canEdit || canDelete) && (
            <div aria-label={`Room ${room.roomNumber} actions`} className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3" role="group">
              {canChangeStatus && <RoomActionButton icon={RefreshCw} label={`Change status for Room ${room.roomNumber}`} onClick={onStatusChange} title="Change status" />}
              {canEdit && <RoomActionButton icon={Pencil} label={`Edit Room ${room.roomNumber}`} onClick={onEdit} title="Edit room" />}
              {canDelete && <RoomActionButton destructive icon={Trash2} label={`Delete Room ${room.roomNumber}`} onClick={onDelete} title="Delete room" />}
            </div>
          )}
          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={onView} type="button">
            <Eye aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>View room details</span>
          </button>
        </div>
      </div>
    </section>
  );
}
