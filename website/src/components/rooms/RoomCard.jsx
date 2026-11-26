import { ArrowRight, Coffee, Sparkles, Tv, Users, Wifi, Wind } from "lucide-react";
import ButtonLink from "../ui/ButtonLink";
import { hotelInfo } from "../../lib/hotelInfo";
import { formatPrice, typeLabel } from "../../lib/booking";

// Room ki apni tasveer na ho to type ke hisaab se ek tasveer
const FALLBACK_IMAGES = {
  single: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80",
  double: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
  deluxe: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1000&q=80",
  suite: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80",
};
const AMENITY_ICONS = { wifi: Wifi, ac: Wind, tv: Tv, "mini bar": Coffee };

/**
 * Ek room ka card. `action` card ke neeche ka hissa badalta hai (misal: kul qeemat + Book);
 * na diya ho to "Check availability" Rooms page par us type ke filter ke saath le jata hai.
 */
export default function RoomCard({ room, index = 0, className = "", action }) {
  const amenities = [...new Set(room.amenities || [])].slice(0, 4);
  const cover = room.images?.[0]?.url || FALLBACK_IMAGES[room.type];
  const label = typeLabel(room.type);

  return (
    <article
      data-room-card
      className={`reviews-slide-in group flex h-full flex-col overflow-hidden rounded-md border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(17,17,17,0.1)] ${className}`}
      style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-soft">
        <img
          src={cover}
          alt={`${label} room at ${hotelInfo.name}`}
          loading={index < 3 ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 rounded-sm bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]">{label}</span>
        <span className="absolute bottom-3 right-3 rounded-sm bg-ink/85 px-2.5 py-1.5 text-sm font-semibold text-white">
          {formatPrice(room.pricePerNight)}
          <span className="ml-1 text-xs font-normal text-white/70">/ night</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-tight">{label} room</h3>
          <span className="inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-sm text-muted">
            <Users className="size-4 text-primary-dark" aria-hidden="true" />
            {room.capacity} {room.capacity === 1 ? "guest" : "guests"}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted">{room.description || " "}</p>
        <ul className="mt-4 flex min-h-8 flex-wrap content-start gap-1.5" aria-label="Amenities">
          {amenities.length ? (
            amenities.map((item) => {
              const Icon = AMENITY_ICONS[item.toLowerCase()] || Sparkles;
              return (
                <li key={item} className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-line bg-soft px-2 text-xs text-muted">
                  <Icon className="size-3.5 text-primary-dark" aria-hidden="true" />
                  {item}
                </li>
              );
            })
          ) : (
            <li className="text-xs text-muted">Ask us about room amenities</li>
          )}
        </ul>
        <div className="mt-auto pt-5">
          {action ?? (
            <ButtonLink to={`/rooms?type=${room.type}`} className="flex min-h-11 w-full">
              Check availability <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          )}
        </div>
      </div>
    </article>
  );
}
