import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, BedDouble, Check, Users, Wifi, Wind, Tv, Coffee, Sparkles } from "lucide-react";
import Container from "../components/ui/Container";
import Section from "../components/ui/Section";
import ButtonLink from "../components/ui/ButtonLink";
import { hotelInfo } from "../lib/hotelInfo";
import { guestRegisterUrl } from "../lib/portal";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:2008/api").replace(/\/+$/, "");
const ROOM_TYPES = [
  { value: "all", label: "All rooms" },
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
];
const fallbackImages = {
  single: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80",
  double: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
  deluxe: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1000&q=80",
  suite: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80",
};
const amenityIcons = { wifi: Wifi, ac: Wind, tv: Tv, "mini bar": Coffee };
const formatPrice = (price) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(price);
const labelFor = (type) => type.charAt(0).toUpperCase() + type.slice(1);

export function RoomCard({ room, index = 0, className = "" }) {
  const amenities = [...new Set(room.amenities || [])].slice(0, 4);
  const cover = room.images?.[0]?.url || fallbackImages[room.type];
  return (
    <article data-room-card className={`reviews-slide-in group flex h-full flex-col overflow-hidden rounded-md border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(17,17,17,0.1)] ${className}`} style={{ animationDelay: `${Math.min(index, 5) * 90}ms` }}>
      <div className="relative h-56 overflow-hidden bg-soft sm:h-64">
        <img src={cover} alt={`${labelFor(room.type)} room at ${hotelInfo.name}`} loading={index < 2 ? "eager" : "lazy"} className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <span className="absolute left-4 top-4 bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em]">{labelFor(room.type)}</span>
        <span className="absolute bottom-4 right-4 bg-ink/80 px-3 py-2 text-sm font-semibold text-white">{formatPrice(room.pricePerNight)}<span className="ml-1 text-xs font-normal text-white/70">/ night</span></span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="type-eyebrow text-accent">A place to unwind</p><h3 className="type-h3 mt-2">{labelFor(room.type)} room</h3></div><span className="inline-flex items-center gap-1.5 pt-1 text-sm text-muted"><Users className="size-4 text-primary-dark" />{room.capacity} guests</span></div>
        <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-muted">{room.description || "\u00a0"}</p>
        <div className="mt-4 flex min-h-16 content-start flex-wrap gap-2">{amenities.length ? amenities.map((item) => { const Icon = amenityIcons[item.toLowerCase()] || Sparkles; return <span key={item} className="inline-flex h-8 items-center gap-1.5 border border-line bg-soft px-2.5 text-xs text-muted"><Icon className="size-3.5 text-primary-dark" />{item}</span>; }) : <span className="text-xs text-muted">Ask us about room amenities</span>}</div>
        <ButtonLink to={guestRegisterUrl()} className="mt-auto flex min-h-11 w-full items-center justify-center gap-2">Check availability <ArrowRight className="size-4" /></ButtonLink>
      </div>
    </article>
  );
}

export default function Rooms() {
  const { type: routeType } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const selectedType = ROOM_TYPES.some((item) => item.value === routeType) ? routeType : "all";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ page: String(page), limit: "6" });
    if (selectedType !== "all") query.set("type", selectedType);
    fetch(`${API_BASE}/rooms/public?${query}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Rooms could not be loaded.");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setRooms(data.rooms || []);
        setPages(Math.max(data.pages || 1, 1));
        setTotal(data.total || 0);
      })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load rooms right now."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, selectedType]);

  const setType = (type) => {
    setPage(1);
    navigate(type === "all" ? "/rooms" : `/rooms/${type}`);
  };
  const pageHeading = selectedType === "all" ? "Find your kind of stay." : `Discover our ${labelFor(selectedType).toLowerCase()} room.`;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-cover bg-center text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=2000&q=85')", backgroundPosition: "center 55%" }}>
        <div className="absolute inset-0 -z-10 bg-black/55" aria-hidden="true" />
        <Container className="grid min-h-[360px] items-center gap-8 py-14 sm:min-h-[410px] lg:min-h-[450px] lg:grid-cols-[1fr_auto] lg:gap-12">
          <div className="max-w-3xl"><p className="type-eyebrow inline-flex items-center gap-3 text-white/85"><span className="h-px w-8 bg-primary" /> Your room, your rhythm</p><h1 className="type-display mt-5 max-w-3xl text-white">{pageHeading.split(" ").slice(0, -1).join(" ")} <span className="text-primary">{pageHeading.split(" ").at(-1)}</span></h1><p className="type-body mt-5 max-w-xl text-white/90">From a restful overnight stop to room to truly settle in, find a space that feels right for your visit.</p></div>
          <a href="#room-collection" className="inline-flex min-h-12 items-center justify-center gap-3 border border-white/75 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-white/90 lg:justify-self-end">Explore the rooms <ArrowRight className="size-4" /></a>
        </Container>
      </section>

      <Section id="room-collection" spacing="py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><p className="type-eyebrow text-accent">Make yourself comfortable</p><h2 className="type-h2 mt-3">Rooms for every kind of trip.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Compare room styles, see what’s included and check dates that work for you.</p></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter rooms by type">{ROOM_TYPES.map((item) => <button key={item.value} type="button" aria-pressed={selectedType === item.value} onClick={() => setType(item.value)} className={`min-h-10 border px-4 text-sm font-medium transition-colors ${selectedType === item.value ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:border-ink hover:text-ink"}`}>{item.label}</button>)}</div>
        </div>
        {!loading && !error && total > 0 && <p className="mt-6 text-sm text-muted">Showing {Math.min((page - 1) * 6 + 1, total)}–{Math.min(page * 6, total)} of {total} rooms</p>}

        {loading ? <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[440px] animate-pulse border border-line bg-soft" />)}</div> : error ? (
          <div className="mt-8 border border-line bg-soft p-8 text-center"><p className="text-sm text-muted">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 inline-flex min-h-10 items-center gap-2 border border-line bg-white px-4 text-sm font-semibold hover:border-ink">Reload rooms <ArrowRight className="size-4" /></button></div>
        ) : rooms.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rooms.map((room, index) => <RoomCard key={room._id} room={room} index={index} />)}</div>
        ) : (
          <div className="mt-8 border border-line bg-soft px-6 py-12 text-center"><span className="mx-auto grid size-12 place-items-center bg-white text-primary-dark"><BedDouble className="size-5" /></span><h3 className="type-h3 mt-4">{selectedType === "all" ? "Rooms are being prepared." : `No ${labelFor(selectedType).toLowerCase()} rooms to show just yet.`}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">Please check back soon or contact reception and we’ll be happy to help you find a room.</p><a href={`tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`} className="mt-5 inline-flex min-h-11 items-center gap-2 border border-line bg-white px-4 text-sm font-semibold hover:border-ink">Call reception <ArrowRight className="size-4" /></a></div>
        )}
        {!loading && !error && pages > 1 && <nav aria-label="Room pages" className="mt-9 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-6">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))} className="inline-flex min-h-10 items-center gap-2 border border-line px-4 text-sm font-medium transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"><ArrowRight className="size-4 rotate-180" />Previous</button>
          {Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button key={number} type="button" aria-current={page === number ? "page" : undefined} onClick={() => setPage(number)} className={`grid size-10 place-items-center border text-sm font-semibold transition-colors ${page === number ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:border-ink hover:text-ink"}`}>{number}</button>)}
          <button type="button" disabled={page >= pages} onClick={() => setPage((current) => Math.min(current + 1, pages))} className="inline-flex min-h-10 items-center gap-2 border border-line px-4 text-sm font-medium transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40">Next<ArrowRight className="size-4" /></button>
        </nav>}
      </Section>

      <section className="bg-soft py-12 sm:py-14"><Container className="flex flex-col gap-5 border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center bg-primary-soft text-primary-dark"><Check className="size-5" /></span><div><p className="type-eyebrow text-accent">Found your fit?</p><h2 className="mt-2 font-serif text-2xl">Choose your dates and check availability.</h2><p className="mt-2 text-sm text-muted">Room rates are shown per night. Final availability is confirmed in the booking portal.</p></div></div><ButtonLink to={guestRegisterUrl()} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2">Start a booking <ArrowRight className="size-4" /></ButtonLink></Container></section>
    </>
  );
}
