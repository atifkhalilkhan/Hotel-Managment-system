import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Container from "../../components/ui/Container";
import Reveal from "../../components/ui/Reveal";
import { hotelInfo } from "../../lib/hotelInfo";

const AMENITIES = [
  { title: "Fitness room", image: "/gallery-optimized/aminites-1.jpg" },
  { title: "Gaming lounge", image: "/gallery-optimized/aminites-2.jpg" },
  { title: "Swimming pool", image: "/gallery-optimized/aminites-3.jpg" },
  { title: "Poolside lounge", image: "/gallery-optimized/aminites-4.jpg" },
  { title: "Kids' play area", image: "/gallery-optimized/aminites-5.jpg" },
  { title: "Go-karting", image: "/gallery-optimized/aminites-6.jpg" },
];
const NOTES = [
  { title: "Move at your pace", text: "Make time for a workout or a refreshing swim." },
  { title: "Make room for play", text: "Friendly games and space for the whole family." },
  { title: "Take a moment", text: "Find a calm corner and let the day slow down." },
];
const CLONES = 3;
const CENTER = 2;
// Dono taraf 3 copies, taake rail beech se shuru ho aur khaali na lage
const RAIL = [
  ...AMENITIES.slice(-CLONES).map((amenity) => ({ amenity, clone: true })),
  ...AMENITIES.map((amenity) => ({ amenity, clone: false })),
  ...AMENITIES.slice(0, CLONES).map((amenity) => ({ amenity, clone: true })),
];

export default function HomeAmenities() {
  const railRef = useRef(null);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);

  useEffect(() => {
    const rail = railRef.current;
    const card = rail?.children[0]?.children[CENTER + CLONES];
    if (!rail || !card) return;
    rail.scrollLeft = card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;
  }, []);

  const onMouseDown = (event) => {
    if (event.button !== 0) return;
    dragRef.current = { x: event.pageX, scrollLeft: event.currentTarget.scrollLeft };
    draggedRef.current = false;
  };
  const onMouseMove = (event) => {
    if (!dragRef.current) return;
    const delta = event.pageX - dragRef.current.x;
    if (Math.abs(delta) > 4) draggedRef.current = true;
    if (draggedRef.current) event.currentTarget.scrollLeft = dragRef.current.scrollLeft - delta;
  };
  const stopDrag = () => {
    dragRef.current = null;
  };
  // Drag ke baad click se gallery na khule
  const onClickCapture = (event) => {
    if (!draggedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    draggedRef.current = false;
  };

  return (
    <section id="amenities" className="overflow-hidden bg-sand py-16 sm:py-20" aria-labelledby="amenities-title">
      <Container>
        <Reveal className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="type-eyebrow text-accent">Amenities</p>
            <h2 id="amenities-title" className="type-h2 mt-3">Make time for the good stuff.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              From a morning swim to a little friendly competition, there is more to enjoy at {hotelInfo.name}.
            </p>
          </div>
          <Link
            to="/gallery"
            className="inline-flex min-h-10 items-center gap-2 border-b border-ink pb-1 text-sm font-semibold transition-colors hover:border-primary hover:text-accent"
          >
            See the gallery <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>

        <div
          ref={railRef}
          className="amenity-arc-viewport no-scrollbar mt-8"
          role="region"
          aria-label="Hotel amenities. Drag or scroll to explore."
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onDragStart={(event) => event.preventDefault()}
          onClickCapture={onClickCapture}
        >
          <div className="amenity-arc-track">
            {RAIL.map(({ amenity, clone }, position) => {
              const offset = Math.max(-3, Math.min(3, position - (CENTER + CLONES)));
              return (
                <div
                  key={`${position}-${amenity.title}`}
                  className="amenity-arc-slot"
                  style={{ "--arc-turn": `${-offset * 8}deg` }}
                  aria-hidden={clone || undefined}
                  inert={clone || undefined}
                >
                  <Link to="/gallery" tabIndex={clone ? -1 : undefined} className="amenity-arc-card group relative">
                    <img src={amenity.image} alt={clone ? "" : amenity.title} loading={position < 6 ? "eager" : "lazy"} decoding="async" />
                    <span className="absolute bottom-3 left-3 rounded-sm bg-white px-2.5 py-1 text-xs font-semibold text-ink">
                      {amenity.title}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className="amenity-arc-notes mt-4">
          {NOTES.map((note, index) => (
            <Reveal key={note.title} delay={index * 90} as="article" className="px-4 py-4 text-center sm:px-6">
              <span className="text-[11px] font-semibold tracking-[0.16em] text-accent">0{index + 1}</span>
              <h3 className="mt-2 text-sm font-semibold sm:text-base">{note.title}</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-muted">{note.text}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
