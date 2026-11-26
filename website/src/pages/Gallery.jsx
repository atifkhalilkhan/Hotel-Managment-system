import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import Container from "../components/ui/Container";

const categories = ["All photos", "Bedrooms", "Suites", "Dining", "Amenities", "Family"];
const imageGroups = [
  { folder: "bedrooms", category: "Bedrooms", count: 7, titles: ["A room to unwind", "Soft light, quiet moments", "Rest, reset, repeat", "A brighter kind of morning", "A little retreat of your own", "Window-side calm", "Evenings made easy"] },
  { folder: "suite", category: "Suites", count: 6, titles: ["A suite welcome", "Room to settle in", "A quiet corner to pause", "Space to stretch out", "A little more room", "Comfort in every detail"] },
  { folder: "dinning", category: "Dining", count: 6, titles: ["Gather around the table", "Good food, good company", "Dinner in a warm setting", "An inviting place to dine", "A relaxed evening in", "A seat at the table"] },
  { folder: "aminites", category: "Amenities", count: 6, titles: ["Make time for movement", "A little play time", "A refreshing dip", "Poolside pause", "Room for little adventures", "A little friendly fun"] },
  { folder: "family", category: "Family", count: 6, titles: ["The journey starts together", "A family room to remember", "A little time together", "Dinner with everyone", "Make room for play", "All together, right here"] },
];
const photos = imageGroups.flatMap(({ folder, category, count, titles }) => Array.from({ length: count }, (_, index) => ({
  id: `${folder}-${index + 1}`,
  category,
  title: titles[index],
  alt: `${titles[index]} — ${category.toLowerCase()} at ${category === "Family" ? "the hotel" : "LuxuryStay"}`,
  src: `/gallery-optimized/${folder}-${index + 1}.jpg`,
})));

export default function Gallery() {
  const [category, setCategory] = useState("All photos");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loaded, setLoaded] = useState({});

  const visiblePhotos = category === "All photos" ? photos : photos.filter((photo) => photo.category === category);
  const activePhoto = visiblePhotos[activeIndex];

  useEffect(() => {
    if (activeIndex < 0) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveIndex(-1);
      if (event.key === "ArrowRight") setActiveIndex((current) => (current + 1) % visiblePhotos.length);
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current - 1 + visiblePhotos.length) % visiblePhotos.length);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, visiblePhotos.length]);

  const changeCategory = (next) => {
    setCategory(next);
    setActiveIndex(-1);
    setLoaded({});
  };
  const moveLightbox = (direction) => setActiveIndex((current) => (current + direction + visiblePhotos.length) % visiblePhotos.length);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-cover bg-center text-white" style={{ backgroundImage: "url('/gallery-optimized/bedrooms-1.jpg')", backgroundPosition: "center 56%" }}>
        <div className="absolute inset-0 -z-10 bg-black/55" aria-hidden="true" />
        <Container className="grid min-h-[340px] items-end gap-8 py-12 sm:min-h-[390px] sm:py-14 lg:min-h-[420px] lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl gallery-enter"><p className="type-eyebrow inline-flex items-center gap-3 text-white/85"><span className="h-px w-8 bg-primary" /> A closer look</p><h1 className="type-display mt-5 text-white">Little moments.<br /><span className="text-primary">Lovely stays.</span></h1><p className="type-body mt-5 max-w-xl text-white/90">Explore the rooms, spaces and shared moments that make a visit feel special.</p></div>
          <a href="#gallery-grid" className="inline-flex min-h-11 items-center gap-2 border border-white/70 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-white/90 lg:justify-self-end">Explore the gallery <ArrowRight className="size-4" /></a>
        </Container>
      </section>

      <section className="bg-white py-10 sm:py-12" id="gallery-grid">
        <Container>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="type-eyebrow text-accent">The LuxuryStay collection</p><h2 className="type-h2 mt-3">Spaces to look forward to.</h2></div><p className="max-w-md text-sm leading-6 text-muted">Take a look around, find a favorite, and picture yourself here.</p></div>
          <div className="no-scrollbar mt-7 flex gap-2 overflow-x-auto border-b border-line pb-3" role="tablist" aria-label="Filter gallery photos">
            {categories.map((item) => <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => changeCategory(item)} className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${category === item ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"}`}>{item}</button>)}
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-muted"><span>{visiblePhotos.length} photographs</span><span className="hidden sm:block">Select any image to view it larger</span></div>
          {visiblePhotos.length ? <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {visiblePhotos.map((photo, index) => <button key={photo.id} type="button" onClick={() => setActiveIndex(index)} className="gallery-tile group relative aspect-[4/3] overflow-hidden bg-soft text-left" style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }} aria-label={`Open photo: ${photo.title}`}>
              <img src={photo.src} alt={photo.alt} decoding="async" fetchPriority={index === 0 ? "high" : "auto"} loading={index < 3 ? "eager" : "lazy"} onLoad={() => setLoaded((current) => ({ ...current, [photo.id]: true }))} className={`size-full object-cover transition duration-700 group-hover:scale-[1.045] ${loaded[photo.id] ? "opacity-100" : "opacity-0"}`} />
              {!loaded[photo.id] && <span className="absolute inset-0 animate-pulse bg-soft" aria-hidden="true" />}
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-ink/75 p-3 text-white transition duration-300 sm:p-4 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"><span><span className="block text-[9px] font-semibold uppercase tracking-[0.15em] text-white/70">{photo.category}</span><span className="mt-1 block text-sm font-medium sm:text-base">{photo.title}</span></span><Expand className="mb-0.5 size-4 shrink-0" aria-hidden="true" /></span>
            </button>)}
          </div> : <div className="mt-6 border border-line bg-soft px-6 py-12 text-center text-sm text-muted">There are no photos in this collection yet.</div>}
        </Container>
      </section>

      <section className="bg-soft py-10 sm:py-12"><Container className="flex flex-col gap-5 border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><p className="type-eyebrow text-accent">Ready to picture your stay?</p><h2 className="mt-2 font-serif text-2xl">We’d love to welcome you.</h2></div><Link to="/rooms" className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-ink transition-colors hover:bg-primary-dark">Explore our rooms <ArrowRight className="size-4" /></Link></Container></section>

      {activePhoto && <div className="gallery-lightbox fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={activePhoto.title} onClick={() => setActiveIndex(-1)}>
        <button type="button" aria-label="Close image" onClick={() => setActiveIndex(-1)} className="absolute right-4 top-4 z-10 grid size-11 place-items-center border border-white/30 bg-black/30 text-white transition-colors hover:bg-white/15 sm:right-7 sm:top-7"><X className="size-5" /></button>
        {visiblePhotos.length > 1 && <button type="button" aria-label="Previous image" onClick={(event) => { event.stopPropagation(); moveLightbox(-1); }} className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center border border-white/30 bg-black/30 text-white transition-colors hover:bg-white/15 sm:left-7"><ArrowLeft className="size-5" /></button>}
        <figure className="gallery-lightbox-image relative flex max-h-full max-w-6xl flex-col items-center" onClick={(event) => event.stopPropagation()}><img src={activePhoto.src} alt={activePhoto.alt} className="max-h-[78vh] max-w-full object-contain" /><figcaption className="mt-4 text-center text-white"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">{activePhoto.category}</p><p className="mt-1 text-lg font-medium">{activePhoto.title}</p><p className="mt-1 text-xs text-white/55">{activeIndex + 1} / {visiblePhotos.length}</p></figcaption></figure>
        {visiblePhotos.length > 1 && <button type="button" aria-label="Next image" onClick={(event) => { event.stopPropagation(); moveLightbox(1); }} className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center border border-white/30 bg-black/30 text-white transition-colors hover:bg-white/15 sm:right-7"><ArrowRight className="size-5" /></button>}
      </div>}
    </>
  );
}
