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
import { useMemo, useState } from "react";
import { buildAmenitySummary, formatPrice, getAmenityIcon, getRoomMainImage, getRoomStatusMeta, getRoomTypeLabel } from "../lib/roomUtils.js";
import { Badge, Card, IconButton } from "./UI.jsx";

export default function RoomCard({ room, role, onView, onStatusChange, onEdit, onDelete }) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const images = room.images || [];
  const mainImage = images[galleryIndex]?.url || getRoomMainImage(room);
  const visibleAmenities = useMemo(() => buildAmenitySummary(room.amenities || []), [room.amenities]);
  const statusMeta = getRoomStatusMeta(room.status);
  const StatusIcon = statusMeta.icon;
  const canChangeStatus = ["admin", "manager", "receptionist", "housekeeping"].includes(role);
  const canEdit = ["admin", "manager"].includes(role);
  const canDelete = role === "admin";
  const hasImages = images.length > 0;

  const goPrev = () => setGalleryIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  const goNext = () => setGalleryIndex((current) => (current + 1) % images.length);

  return (
    <Card className="group overflow-hidden p-0 transition-colors hover:border-primary">
      <div className="relative" onClick={onView} role="button" tabIndex={0}>
        <div className="relative aspect-[4/3] overflow-hidden bg-page">
          {mainImage ? (
            <img alt={`Room ${room.roomNumber} photo ${galleryIndex + 1}`} className="h-full w-full object-cover" loading="lazy" src={mainImage} />
          ) : (
            <div className="flex h-full items-center justify-center bg-page text-muted"><BedDouble className="h-10 w-10" /></div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <div className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-ink">
              <StatusIcon className="h-3.5 w-3.5" />
              {statusMeta.label}
            </div>
            <Badge tone="neutral">{getRoomTypeLabel(room.type)}</Badge>
          </div>
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 pb-3">
              <div className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
                <ImageIcon className="h-3.5 w-3.5" /> {images.length}
              </div>
              <div className="flex items-center gap-1">
                <button aria-label="Previous room photo" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" onClick={(event) => { event.stopPropagation(); goPrev(); }} type="button"><ChevronLeft className="h-4 w-4" /></button>
                <button aria-label="Next room photo" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" onClick={(event) => { event.stopPropagation(); goNext(); }} type="button"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
          {!hasImages && <div className="absolute bottom-3 left-3 rounded-full bg-white px-2 py-1 text-[10px] text-muted">No photo</div>}
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">Room {room.roomNumber}</h3>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-1"><Layers3 className="h-4 w-4" />Floor {room.floor}</span>
              <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{room.capacity} guests</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-primary-dark">{formatPrice(room.pricePerNight)}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">/ night</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleAmenities.length ? visibleAmenities.map((amenity) => {
            const Icon = getAmenityIcon(amenity);
            return <span className="inline-flex items-center gap-1 rounded-full border border-line bg-page px-2 py-1 text-[10px] font-medium text-muted" key={amenity}><Icon className="h-3.5 w-3.5" />{amenity}</span>;
          }) : <span className="text-xs text-muted">No amenities listed</span>}
          {(room.amenities || []).length > visibleAmenities.length && <span className="rounded-full border border-line bg-page px-2 py-1 text-[10px] text-muted">+{(room.amenities || []).length - visibleAmenities.length} more</span>}
        </div>
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <IconButton ariaLabel={`View room ${room.roomNumber}`} onClick={onView} title="View details"><Eye className="h-4 w-4" /></IconButton>
          {canChangeStatus && <IconButton ariaLabel={`Change room ${room.roomNumber} status`} onClick={onStatusChange} title="Change status"><RefreshCw className="h-4 w-4" /></IconButton>}
          {canEdit && <IconButton ariaLabel={`Edit room ${room.roomNumber}`} onClick={onEdit} title="Edit room"><Pencil className="h-4 w-4" /></IconButton>}
          {canDelete && <IconButton ariaLabel={`Delete room ${room.roomNumber}`} className="text-red-600 hover:border-red-200 hover:bg-red-50" onClick={onDelete} title="Delete room"><Trash2 className="h-4 w-4" /></IconButton>}
        </div>
      </div>
    </Card>
  );
}
