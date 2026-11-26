import { ArrowRight, CalendarDays, Phone, RotateCcw, Users, X } from "lucide-react";
import ButtonLink from "../ui/ButtonLink";
import RoomCard from "./RoomCard";
import { hotelInfo } from "../../lib/hotelInfo";
import { bookUrl } from "../../lib/portal";
import { ROOM_TYPES, formatDate, formatPrice, hasAnyFilter, typeLabel } from "../../lib/booking";

const GRID = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";
const telHref = `tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`;

function BookAction({ room, filters, nights }) {
  return (
    <div className="border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted">
          {nights} {nights === 1 ? "night" : "nights"} × {formatPrice(room.pricePerNight)}
        </span>
        <span className="text-lg font-semibold tabular-nums tracking-tight">{formatPrice(room.pricePerNight * nights)}</span>
      </div>
      <p className="mt-0.5 text-right text-[11px] text-muted">Total before tax</p>
      <ButtonLink
        to={bookUrl({
          checkIn: filters.checkIn,
          checkOut: filters.checkOut,
          guests: filters.guests || 1,
          type: room.type,
          room: room._id,
        })}
        className="mt-3 flex min-h-11 w-full"
      >
        Book this room <ArrowRight className="size-4" aria-hidden="true" />
      </ButtonLink>
    </div>
  );
}

function TypeChips({ value, onChange }) {
  const options = [{ value: "", label: "All rooms" }, ...ROOM_TYPES];
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="group" aria-label="Filter by room type">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value || "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`h-10 shrink-0 rounded-md border px-4 text-sm font-medium transition-colors ${
              active ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Room search ke results. Filters badalne par purane cards halke ho kar wahin rehte hain
 * (koi jump nahi); loading ke dabbe sirf pehli dafa.
 */
export default function RoomResults({ filters, search, onTypeChange, onClear, onChooseDates, headingId = "room-results-title" }) {
  const { status, rooms, error, retry, withDates, nights } = search;
  const refreshing = status === "refreshing";
  const filtered = hasAnyFilter(filters);

  let title;
  if (status === "loading") title = withDates ? "Checking availability…" : "Loading rooms…";
  else if (status === "error") title = "Rooms unavailable";
  else if (withDates) title = rooms.length ? `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"} available` : "No rooms available";
  else title = `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}`;

  const catalogAction = (room) =>
    onChooseDates ? (
      <button
        type="button"
        onClick={() => onChooseDates(room.type)}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-ink text-sm font-semibold transition-colors hover:bg-ink hover:text-white"
      >
        <CalendarDays className="size-4" aria-hidden="true" /> Choose dates
      </button>
    ) : undefined;

  return (
    <div aria-busy={status === "loading" || refreshing}>
      <div className="flex flex-col gap-4 border-b border-line pb-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 id={headingId} className="text-xl font-semibold tracking-tight sm:text-2xl" aria-live="polite">
              {title}
            </h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {withDates ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-accent" aria-hidden="true" />
                  {formatDate(filters.checkIn)} – {formatDate(filters.checkOut)}
                  <span className="text-ink">· {nights} {nights === 1 ? "night" : "nights"}</span>
                </span>
              ) : (
                <span>Prices per night. Add dates to see what is free.</span>
              )}
              {filters.guests > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 text-accent" aria-hidden="true" />
                  {filters.guests}+ {filters.guests === 1 ? "guest" : "guests"}
                </span>
              )}
              {!onTypeChange && filters.type && <span>{typeLabel(filters.type)}</span>}
            </p>
          </div>
          {filtered && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted transition-colors hover:bg-soft hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
        {onTypeChange && <TypeChips value={filters.type} onChange={onTypeChange} />}
      </div>

      {status === "loading" && (
        <div className={`${GRID} mt-6`}>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-[460px] animate-pulse rounded-md border border-line bg-soft" />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="mt-6 flex flex-col items-start gap-4 rounded-md border border-line bg-soft p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-ink px-4 text-sm font-semibold transition-colors hover:bg-ink hover:text-white"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Try again
          </button>
        </div>
      )}

      {(status === "ready" || refreshing) && rooms.length === 0 && (
        <div className="mt-6 rounded-md border border-line bg-soft p-6 sm:p-8">
          <p className="text-base font-semibold">
            {withDates ? "Nothing free for these dates." : "No rooms match these filters."}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {withDates
              ? "Try moving your dates by a day or two, or choose a different room type. Reception can also help."
              : "Try fewer guests or a different room type."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {filtered && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
              >
                Clear filters
              </button>
            )}
            <ButtonLink to={telHref} variant="outline">
              <Phone className="size-4" aria-hidden="true" /> Call reception
            </ButtonLink>
          </div>
        </div>
      )}

      {rooms.length > 0 && (
        <div className={`${GRID} mt-6 transition-opacity duration-200 ${refreshing ? "pointer-events-none opacity-50" : ""}`}>
          {rooms.map((room, index) => (
            <RoomCard
              key={room._id}
              room={room}
              index={index}
              action={withDates ? <BookAction room={room} filters={filters} nights={nights} /> : catalogAction(room)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
