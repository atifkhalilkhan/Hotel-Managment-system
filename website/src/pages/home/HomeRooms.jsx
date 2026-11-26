import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Container from "../../components/ui/Container";
import { API_BASE } from "../../lib/api";
import RoomCard from "../../components/rooms/RoomCard";

const CARD_WIDTH = "w-[82vw] shrink-0 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]";
const railButton =
  "grid size-11 place-items-center rounded-md border border-ink/15 bg-white text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-40";

export default function HomeRooms() {
  const railRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/rooms/public?page=1&limit=6`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Rooms unavailable"))))
      .then((data) => setRooms(data.rooms || []))
      .catch((error) => {
        if (error.name !== "AbortError") setRooms([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Arrow buttons ko pata ho ke rail shuru ya aakhir par hai
  const updateEdges = () => {
    const rail = railRef.current;
    if (!rail) return;
    setEdges({
      start: rail.scrollLeft <= 4,
      end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4,
    });
  };

  useEffect(updateEdges, [rooms]);

  const scroll = (direction) => {
    const rail = railRef.current;
    const card = rail?.querySelector("[data-room-card]");
    if (!rail || !card) return;
    const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: "smooth" });
  };

  return (
    <section className="bg-soft py-16 sm:py-20" aria-labelledby="home-rooms-title">
      <Container>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="type-eyebrow text-accent">Rooms and suites</p>
            <h2 id="home-rooms-title" className="type-h2 mt-3">Rooms made for real rest.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Four room styles, each with the comfort and small details that make coming back feel good.
            </p>
          </div>
          {rooms.length > 1 && (
            <div className="flex items-center gap-2 self-end">
              <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label="Previous rooms" className={railButton}>
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label="Next rooms" className={railButton}>
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div
          ref={railRef}
          onScroll={updateEdges}
          className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
          role="region"
          aria-label="Room types"
          aria-busy={loading}
        >
          {loading &&
            Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={`${CARD_WIDTH} h-[470px] animate-pulse rounded-md border border-line bg-white`} />
            ))}
          {!loading &&
            rooms.map((room, index) => (
              <RoomCard key={room._id} room={room} index={index} className={`${CARD_WIDTH} snap-start`} />
            ))}
          {!loading && !rooms.length && (
            <div className="flex w-full flex-col items-start justify-between gap-4 rounded-md border border-line bg-white p-5 sm:flex-row sm:items-center">
              <p className="text-sm text-muted">Room details are being updated. Call reception or see all room types.</p>
              <Link to="/rooms" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold hover:text-accent">
                View rooms <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {rooms.length > 0 && (
          <Link
            to="/rooms"
            className="mt-8 inline-flex min-h-10 items-center gap-2 border-b border-ink pb-1 text-sm font-semibold transition-colors hover:border-primary hover:text-accent"
          >
            Compare all rooms and rates <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </Container>
    </section>
  );
}
