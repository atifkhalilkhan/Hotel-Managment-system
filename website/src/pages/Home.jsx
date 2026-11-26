import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, BedDouble, CalendarDays, CarFront, ChevronLeft, ChevronRight, Clock3, ConciergeBell, HeartHandshake, MapPin, ReceiptText, SprayCan, Star, UserRound } from "lucide-react";
import Container from "../components/ui/Container";
import ButtonLink from "../components/ui/ButtonLink";
import GuestAppShowcase from "../components/GuestAppShowcase";
import { hotelInfo } from "../lib/hotelInfo";
import { guestRegisterUrl } from "../lib/portal";
import { RoomCard } from "./Rooms";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:2008/api").replace(/\/+$/, "");

const amenityHighlights = [
  { title: "Make time for movement", number: "01", image: "/gallery-optimized/aminites-1.jpg" },
  { title: "A little play time", number: "02", image: "/gallery-optimized/aminites-2.jpg" },
  { title: "A refreshing dip", number: "03", image: "/gallery-optimized/aminites-3.jpg" },
  { title: "Poolside pause", number: "04", image: "/gallery-optimized/aminites-4.jpg" },
  { title: "Room for adventures", number: "05", image: "/gallery-optimized/aminites-5.jpg" },
  { title: "A little friendly fun", number: "06", image: "/gallery-optimized/aminites-6.jpg" },
];
const amenityRailItems = [
  ...amenityHighlights.slice(-3).map((amenity, index) => ({ amenity, clone: true, railPosition: index })),
  ...amenityHighlights.map((amenity, index) => ({ amenity, clone: false, railPosition: index + 3 })),
  ...amenityHighlights.slice(0, 3).map((amenity, index) => ({ amenity, clone: true, railPosition: index + 9 })),
];
const serviceHighlights = [
  { title: "Room service", detail: "Good things, brought to your room.", Icon: ConciergeBell },
  { title: "Housekeeping", detail: "A fresh space, whenever you need it.", Icon: SprayCan },
  { title: "Wake-up calls", detail: "Start the day right on time.", Icon: Clock3 },
  { title: "Transportation", detail: "Let reception help with the journey.", Icon: CarFront },
];
const heroSlides = [
  { image: "/gallery-optimized/bedrooms-1.jpg", alt: "A bright and welcoming hotel room" },
  { image: "/gallery-optimized/suite-5.jpg", alt: "A spacious hotel suite" },
  { image: "/gallery-optimized/family-2.jpg", alt: "A comfortable room for a family stay" },
  { image: "/gallery-optimized/aminites-4.jpg", alt: "The hotel pool and outdoor lounge" },
];

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (!("IntersectionObserver" in window)) {
      element.classList.add("is-visible");
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add("is-visible");
        observer.unobserve(element);
      }
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`home-reveal ${className}`} style={{ "--home-delay": `${delay}ms` }}>{children}</div>;
}

function GuestNotes() {
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/feedback/public?page=1&limit=3`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Reviews unavailable")))
      .then((data) => { if (active) setReviews(data.feedback || []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  if (!reviews.length) return null;
  return <section className="bg-ink pt-8 pb-14 text-white sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20"><Container><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="type-eyebrow text-accent">A few words from guests</p><h2 className="type-h2 mt-3 text-white">The stay, in their words.</h2></div><Link to="/reviews" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-primary">Read all reviews <ArrowRight className="size-4" /></Link></div><div className="mt-8 grid gap-4 md:grid-cols-3">{reviews.map((review, index) => <Reveal key={review._id} delay={index * 100}><article className="h-full rounded-md border border-white/10 bg-white p-5 text-ink sm:p-6"><div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < review.rating ? "fill-primary text-primary" : "text-line"}`} />)}</div><p className="mt-4 line-clamp-4 text-sm leading-6 text-ink">“{review.message}”</p><p className="mt-5 border-t border-line pt-4 text-sm font-semibold">{review.displayName}<span className="mt-1 block text-xs font-normal text-muted">{review.verifiedStay ? "Verified guest" : "Guest review"}</span></p></article></Reveal>)}</div></Container></section>;
}

export default function Home() {
  const telHref = `tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`;
  const [activeSlide, setActiveSlide] = useState(0);
  const [sliderPaused, setSliderPaused] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const activeAmenity = 2;
  const amenityRailRef = useRef(null);
  const roomRailRef = useRef(null);
  const amenityDragRef = useRef(null);
  const amenityWasDraggedRef = useRef(false);
  useEffect(() => {
    const rail = amenityRailRef.current;
    const card = rail?.querySelector(`[data-rail-position="${activeAmenity + 3}"]`);
    if (!rail || !card) return undefined;
    const left = card.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    rail.scrollLeft = left + card.offsetWidth / 2 - rail.clientWidth / 2;
    return undefined;
  }, []);
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/rooms/public?page=1&limit=6`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Rooms could not be loaded.");
        return data;
      })
      .then((data) => { if (active) setRooms(data.rooms || []); })
      .catch(() => { if (active) setRooms([]); })
      .finally(() => { if (active) setRoomsLoading(false); });
    return () => { active = false; };
  }, []);
  const onAmenityMouseDown = (event) => {
    if (event.button !== 0) return;
    amenityDragRef.current = { x: event.pageX, scrollLeft: event.currentTarget.scrollLeft };
    amenityWasDraggedRef.current = false;
  };
  const onAmenityMouseMove = (event) => {
    if (!amenityDragRef.current) return;
    const delta = event.pageX - amenityDragRef.current.x;
    if (Math.abs(delta) > 4) amenityWasDraggedRef.current = true;
    if (amenityWasDraggedRef.current) event.currentTarget.scrollLeft = amenityDragRef.current.scrollLeft - delta;
  };
  const stopAmenityDrag = () => { amenityDragRef.current = null; };
  const scrollRoomRail = (direction) => {
    const rail = roomRailRef.current;
    const firstCard = rail?.querySelector("[data-room-card]");
    if (!rail || !firstCard) return;
    const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior: "smooth" });
  };
  useEffect(() => {
    if (sliderPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setActiveSlide((slide) => (slide + 1) % heroSlides.length), 6000);
    return () => window.clearInterval(timer);
  }, [sliderPaused]);
  return (
    <>
      <section className="home-hero relative isolate overflow-hidden bg-[#29231f] text-white" onMouseEnter={() => setSliderPaused(true)} onMouseLeave={() => setSliderPaused(false)} onFocusCapture={() => setSliderPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSliderPaused(false); }}>
        <div className="home-hero-slides absolute inset-0 -z-10" aria-hidden="true">
          {heroSlides.map((slide, index) => <img key={slide.image} src={slide.image} alt="" fetchPriority={index === 0 ? "high" : undefined} loading={index < 2 ? "eager" : "lazy"} decoding="async" className={`home-hero-slide${activeSlide === index ? " is-active" : ""}`} style={{ objectPosition: index === 0 ? "center 58%" : "center" }} />)}
        </div>
        <div className="absolute inset-0 -z-10 bg-black/55" aria-hidden="true" />
        <Container className="grid min-h-[470px] items-center gap-8 py-12 sm:min-h-[510px] sm:py-14 lg:min-h-[550px] lg:grid-cols-[1fr_0.55fr] lg:gap-16">
          <div className="home-hero-copy max-w-3xl">
            <p className="type-eyebrow inline-flex items-center gap-3 text-white/85"><span className="h-px w-8 bg-primary" /> Welcome to {hotelInfo.name}</p>
            <h1 className="type-display mt-5 max-w-3xl text-white">A stay that feels<br />easy from the <span className="text-primary">start.</span></h1>
            <p className="type-body mt-5 max-w-xl text-white/90">Comfortable rooms, thoughtful service and a helpful team—so you can settle in and make the most of your time away.</p>
            <div className="mt-7 flex flex-wrap gap-3"><ButtonLink to={guestRegisterUrl()} size="lg" className="inline-flex items-center gap-3">Find your room <ArrowRight className="size-4" /></ButtonLink><ButtonLink to="/rooms" variant="outline" size="lg" className="border-white/60 bg-white/10 text-white hover:bg-white/20">Explore rooms</ButtonLink></div>
            <a href="#amenities" className="mt-9 inline-flex items-center gap-2 text-xs font-medium text-white/75 transition-colors hover:text-white"><ArrowDown className="size-4" /> Take a look around</a>
          </div>
          <div className="home-hero-note border-l-2 border-primary bg-black/35 p-5 backdrop-blur-[2px] sm:p-6 lg:justify-self-end">
            <span className="grid size-11 place-items-center border border-white/25 text-primary"><HeartHandshake className="size-5" /></span>
            <p className="mt-5 font-serif text-2xl leading-snug">Here for the details that make a stay feel like yours.</p>
            <div className="mt-5 space-y-3 border-t border-white/25 pt-4 text-sm text-white/85"><p className="flex items-center gap-3"><Clock3 className="size-4 text-primary" />{hotelInfo.receptionHours}</p><p className="flex items-center gap-3"><MapPin className="size-4 text-primary" />{hotelInfo.shortAddress}</p></div>
          </div>
        </Container>
        <div className="home-hero-bottom"><span className="hidden sm:inline">REST WELL</span><span className="hidden sm:inline">FEEL WELCOME</span><span className="hidden sm:inline">STAY A LITTLE LONGER</span><div className="home-hero-pagination" role="group" aria-label="Choose hero image">{heroSlides.map((slide, index) => <button key={slide.image} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show image ${index + 1}: ${slide.alt}`} aria-pressed={activeSlide === index} className={activeSlide === index ? "is-active" : ""} />)}</div></div>
      </section>

      <section className="bg-white py-12 sm:py-14 lg:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-stretch lg:gap-14">
            <Reveal><div className="flex h-full max-w-lg flex-col justify-center"><p className="type-eyebrow text-accent">A warm welcome, every time</p><h2 className="type-h2 mt-3">Feel looked after,<br className="hidden sm:block" /> from the moment you arrive.</h2><p className="mt-4 max-w-md text-sm leading-6 text-muted">A helpful team, room options for different kinds of trips, and everyday services arranged around your stay.</p><Link to="/services" className="mt-5 inline-flex min-h-10 items-center gap-2 border-b border-line pb-2 text-sm font-semibold transition-colors hover:border-primary hover:text-accent">See how we can help <ArrowRight className="size-4" /></Link></div></Reveal>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-3">
              <Reveal delay={70} className="h-full"><article className="flex h-full min-h-[260px] flex-col border border-ink bg-ink p-5 text-white sm:min-h-[280px] sm:p-6"><span className="flex min-h-10 items-start justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65"><span>Here whenever you need us</span><Clock3 className="size-4 shrink-0 text-primary" /></span><div className="mt-6 flex flex-1 flex-col"><p className="flex h-12 items-end font-serif text-5xl leading-none">24<span className="ml-1 text-xl">hrs</span></p><h3 className="mt-5 min-h-[3.5rem] text-lg font-semibold leading-snug">Reception, around the clock.</h3><p className="mt-2 min-h-20 text-sm leading-6 text-white/75">Questions, requests or a helping hand—our front desk is open throughout your stay.</p></div></article></Reveal>
              <Reveal delay={140} className="h-full"><article className="flex h-full min-h-[260px] flex-col border border-primary-dark bg-primary p-5 text-ink sm:min-h-[280px] sm:p-6"><span className="flex min-h-10 items-start justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/65"><span>Find your fit</span><BedDouble className="size-4 shrink-0" /></span><div className="mt-6 flex flex-1 flex-col"><p className="flex h-12 items-end font-serif text-5xl leading-none">04</p><h3 className="mt-5 min-h-[3.5rem] text-lg font-semibold leading-snug">A room for your kind of trip.</h3><p className="mt-2 min-h-20 text-sm leading-6 text-ink/75">Choose from single, double, deluxe and suite rooms, with space to suit the way you travel.</p></div></article></Reveal>
              <Reveal delay={210} className="h-full"><article className="flex h-full min-h-[260px] flex-col border border-line bg-[#f7f6f3] p-5 text-ink sm:min-h-[280px] sm:p-6"><span className="flex min-h-10 items-start justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"><span>Everyday help, on request</span><HeartHandshake className="size-4 shrink-0 text-accent" /></span><div className="mt-6 flex flex-1 flex-col"><p className="flex h-12 items-end font-serif text-5xl leading-none">04</p><h3 className="mt-5 min-h-[3.5rem] text-lg font-semibold leading-snug">The little details, handled.</h3><p className="mt-2 min-h-20 text-sm leading-6 text-muted">From room service to a wake-up call, ask our team to arrange what makes your stay easier.</p></div></article></Reveal>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 border-y border-line py-4 text-xs text-muted sm:grid-cols-4 sm:py-5">
            {["Room service", "Housekeeping", "Wake-up calls", "Transportation"].map((service, index) => <div key={service} className={`flex items-center gap-2 px-2 py-2 sm:px-4 ${index % 2 === 1 ? "border-l border-line" : ""} ${index >= 2 ? "border-t border-line sm:border-t-0" : ""} ${index > 0 ? "sm:border-l sm:border-line" : ""}`}><span className="grid size-7 shrink-0 place-items-center border border-line bg-white text-accent"><ArrowRight className="size-3" /></span><span className="font-medium text-ink">{service}</span></div>)}
          </div>
        </Container>
      </section>



      <section id="amenities" className="overflow-hidden bg-[#f3f1ec] pt-8 pb-6 sm:pt-10 sm:pb-7 lg:pt-12 lg:pb-8">
        <Container>
          <Reveal><div className="mx-auto max-w-3xl text-center"><p className="type-eyebrow text-accent">A little more to enjoy</p><h2 className="type-h2 mt-2 md:whitespace-nowrap">Make time for the <span className="text-accent">good stuff.</span></h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">From a refreshing swim to a little friendly fun, find more ways to enjoy your time at LuxuryStay.</p><Link to="/gallery" className="mt-3 inline-flex min-h-10 items-center justify-center border border-ink bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:border-accent">Explore all amenities</Link></div></Reveal>
          <div ref={amenityRailRef} className="amenity-arc-viewport no-scrollbar mt-5 sm:mt-6" role="region" aria-label="Hotel amenities; drag to explore" onMouseDown={onAmenityMouseDown} onMouseMove={onAmenityMouseMove} onMouseUp={stopAmenityDrag} onMouseLeave={stopAmenityDrag} onDragStart={(event) => event.preventDefault()} onClickCapture={(event) => { if (amenityWasDraggedRef.current) { event.preventDefault(); event.stopPropagation(); amenityWasDraggedRef.current = false; } }}>
            <div className="amenity-arc-track">
              {amenityRailItems.map(({ amenity, clone, railPosition }, position) => {
                const offset = Math.max(-3, Math.min(3, position - (activeAmenity + 3)));
                const cardStyle = { "--arc-turn": `${-offset * 8}deg` };
                return <div key={`${railPosition}-${amenity.number}`} data-rail-position={railPosition} className="amenity-arc-slot" style={cardStyle} aria-hidden={clone} inert={clone ? true : undefined}><Link to="/gallery" tabIndex={clone ? -1 : undefined} aria-label={clone ? undefined : `View ${amenity.title} in the gallery`} className="amenity-arc-card"><img src={amenity.image} alt={clone ? "" : amenity.title} loading={position < 6 ? "eager" : "lazy"} decoding="async" /></Link></div>;
              })}
            </div>
          </div>
          <div className="amenity-arc-notes mt-1 sm:mt-2">
            {[{ title: "Move at your pace", text: "Make time for a workout or a refreshing swim." }, { title: "Make room for play", text: "Enjoy a little friendly competition and family fun." }, { title: "Take a moment", text: "Find a calm corner and let the day slow down." }].map((note, index) => <Reveal key={note.title} delay={index * 90}><article className="px-4 py-3 text-center sm:px-6"><span className="text-[10px] font-semibold tracking-[0.16em] text-accent">0{index + 1}</span><h3 className="mt-2 text-sm font-semibold sm:text-base">{note.title}</h3><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-muted">{note.text}</p></article></Reveal>)}
          </div>
        </Container>
      </section>
      <section className="bg-white py-12 sm:py-16 lg:py-18">
        <Container>
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <Reveal><div className="max-w-xl"><p className="type-eyebrow text-accent">The LuxuryStay experience</p><h2 className="type-h2 mt-3 max-w-lg">A stay that feels easy from the start.</h2><p className="type-body mt-4 max-w-lg text-muted">Comfortable spaces, a welcoming team and the everyday details taken care of—so you can focus on the moments that brought you here.</p><div className="mt-6 flex flex-wrap items-center gap-4"><Link to="/rooms" className="inline-flex min-h-11 items-center gap-3 bg-primary px-5 text-sm font-semibold text-ink transition-colors hover:bg-primary-dark">Explore rooms <ArrowRight className="size-4" /></Link><Link to="/services" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-accent">Our services <ArrowRight className="size-4 text-accent" /></Link></div></div></Reveal>
            <Reveal delay={120}><div className="relative mx-auto h-[300px] w-full max-w-[620px] sm:h-[360px] lg:h-[390px]">
              <div className="absolute right-[5%] top-[3%] h-[78%] w-[78%] overflow-hidden rounded-md bg-soft shadow-[0_8px_20px_rgba(17,17,17,0.10)]"><img src="/gallery-optimized/suite-5.jpg" alt="A spacious and welcoming hotel suite" loading="lazy" decoding="async" className="size-full object-cover" /></div>
              <div className="absolute bottom-[1%] left-[2%] h-[46%] w-[39%] overflow-hidden rounded-md border-[5px] border-white bg-soft shadow-[0_7px_18px_rgba(17,17,17,0.12)]"><img src="/gallery-optimized/dinning-3.jpg" alt="A warm hotel dining space" loading="lazy" decoding="async" className="size-full object-cover" /></div>
              <div className="absolute bottom-[9%] right-0 h-[30%] w-[31%] overflow-hidden rounded-md border-[5px] border-white bg-soft shadow-[0_7px_18px_rgba(17,17,17,0.12)]"><img src="/gallery-optimized/bedrooms-6.jpg" alt="A calm and comfortable guest room" loading="lazy" decoding="async" className="size-full object-cover" /></div>
              <div className="absolute left-0 top-[8%] border border-ink/10 bg-primary px-4 py-3 text-ink shadow-[0_5px_14px_rgba(17,17,17,0.08)] sm:px-5 sm:py-4"><p className="font-serif text-3xl leading-none sm:text-4xl">24<span className="ml-1 text-sm font-sans font-semibold">hrs</span></p><p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px]">Reception on hand</p></div>
            </div></Reveal>
          </div>
          <div className="mt-9 grid grid-cols-2 border-y border-line sm:grid-cols-4">
            {[{ value: "24 hrs", label: "Reception open, day and night" }, { value: "04", label: "Room styles, from single to suite" }, { value: "On request", label: "Everyday guest services" }, { value: "Together", label: "Space for family moments" }].map((stat, index) => <div key={stat.value} className={`px-4 py-4 sm:px-5 sm:py-5 ${index % 2 === 1 ? "border-l border-line" : ""} ${index > 1 ? "border-t border-line sm:border-t-0" : ""} ${index > 0 ? "sm:border-l sm:border-line" : ""}`}><p className="font-serif text-xl text-ink sm:text-2xl">{stat.value}</p><p className="mt-1.5 max-w-[15rem] text-xs leading-5 text-muted">{stat.label}</p></div>)}
          </div>
        </Container>
      </section>

      <section className="bg-soft pt-12 pb-6 sm:pt-14 sm:pb-7 lg:pt-16 lg:pb-8" aria-labelledby="home-rooms-title">
        <Container>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="type-eyebrow text-accent">Find your place to settle in</p><h2 id="home-rooms-title" className="type-h2 mt-2">Rooms made for real rest.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Choose from four room styles, each with the comfort and thoughtful details that make coming back feel good.</p></div><div className="flex items-center gap-2 self-end"><button type="button" onClick={() => scrollRoomRail(-1)} aria-label="Scroll rooms left" className="grid size-11 place-items-center border border-ink/20 bg-white text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"><ChevronLeft className="size-4" /></button><button type="button" onClick={() => scrollRoomRail(1)} aria-label="Scroll rooms right" className="grid size-11 place-items-center border border-ink/20 bg-white text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"><ChevronRight className="size-4" /></button></div></div>
          <div ref={roomRailRef} className="no-scrollbar mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2" role="region" aria-label="Room types">
            {roomsLoading ? Array.from({ length: 3 }, (_, index) => <div key={index} className="home-room-card h-[470px] w-[82vw] shrink-0 animate-pulse border border-line bg-white md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]" />) : rooms.length ? rooms.map((room, index) => <RoomCard key={room._id} room={room} index={index} className="home-room-card w-[82vw] shrink-0 snap-start md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]" />) : <div className="flex min-h-32 w-full items-center justify-between gap-5 border border-line bg-white p-5"><p className="text-sm text-muted">Our room collection is being prepared. Please check back soon.</p><Link to="/rooms" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold hover:text-accent">View rooms <ArrowRight className="size-4" /></Link></div>}
          </div>
        </Container>
      </section>

      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="type-eyebrow text-accent">The helpful little things</p><h2 className="type-h2 mt-3">Consider it taken care of.</h2></div><Link to="/services" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold transition-colors hover:text-accent">Discover our services <ArrowRight className="size-4" /></Link></div>
          <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">{serviceHighlights.map(({ title, detail, Icon }, index) => <Reveal key={title} delay={index * 75}><Link to="/services" className="group block h-full bg-white p-5 transition-colors hover:bg-soft sm:p-6"><span className="grid size-11 place-items-center bg-primary-soft text-primary-dark transition-colors group-hover:bg-primary group-hover:text-ink"><Icon className="size-5" /></span><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{detail}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accent">Learn more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span></Link></Reveal>)}</div>
        </Container>
      </section>

      <GuestNotes />

      <section className="bg-soft py-7 sm:py-9 lg:py-10" aria-labelledby="guest-app-title">
        <Container>
          <div className="relative grid isolate items-center gap-4 overflow-hidden rounded-[18px] bg-soft px-5 py-6 sm:px-8 sm:py-7 lg:min-h-[350px] lg:grid-cols-[0.82fr_1.18fr] lg:gap-8 lg:px-10 lg:py-6 [&_a.inline-flex]:bg-primary [&_a.inline-flex]:text-ink [&_a.inline-flex:hover]:bg-primary-dark">
            <Reveal><div className="max-w-xl"><p className="type-eyebrow text-accent">The LuxuryStay guest app</p><h2 id="guest-app-title" className="type-h2 mt-3 max-w-lg">Your stay, one tap away.</h2><p className="type-body mt-4 max-w-lg text-muted">Keep your bookings, guest services and stay details together in the LuxuryStay app. Open it on your phone, then add it to your home screen for quick access.</p><a href={guestRegisterUrl()} className="mt-6 inline-flex min-h-11 items-center gap-3 bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-accent">Open the guest app <ArrowRight className="size-4" /></a><p className="mt-3 text-xs text-muted">A progressive web app—no app store download needed.</p></div></Reveal>
            <Reveal delay={120}><GuestAppShowcase /></Reveal>
          </div>
        </Container>
      </section>

    </>
  );
}
