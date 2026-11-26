import { useMemo, useRef } from "react";
import { Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import Container from "../components/ui/Container";
import RoomSearchForm from "../components/rooms/RoomSearchForm";
import RoomResults from "../components/rooms/RoomResults";
import useRoomSearch from "../hooks/useRoomSearch";
import { EMPTY_FILTERS, filtersQuery, readFilters } from "../lib/booking";

// Purane links (/rooms/suite, header/footer) ab filter ki shakal mein: /rooms?type=suite
export function RoomsTypeRedirect() {
  const { type } = useParams();
  return <Navigate to={`/rooms?type=${encodeURIComponent(type || "")}`} replace />;
}

// Purana /availability?checkIn=... link: wahi search Rooms page par
export function AvailabilityRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/rooms${search}`} replace />;
}

/**
 * Rooms: saare rooms, aur dates daalo to sirf khali rooms. Saare filters URL mein rehte hain
 * (share/refresh par wahi results), magar URL `replace` se badalta hai: page jump ya naya
 * history entry nahi banta.
 */
export default function Rooms() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const search = useRoomSearch(filters);
  const formRef = useRef(null);
  const checkInRef = useRef(null);

  const apply = (next) => setParams(filtersQuery(next), { replace: true, preventScrollReset: true });
  const changeType = (type) => apply({ ...filters, type });
  const clear = () => apply(EMPTY_FILTERS);

  // Card par "Choose dates": us type ka filter lagao aur check-in par le chalo
  const chooseDates = (type) => {
    apply({ ...filters, type });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => checkInRef.current?.focus({ preventScroll: true }), 350);
  };

  // Form sirf tab dobara bhare jab dates/guests bahar se badlen (clear, purana link)
  const formKey = filtersQuery({ ...filters, type: "" });

  return (
    <>
      <section className="relative isolate overflow-hidden bg-night text-white">
        <img
          src="/hero/hero-2-1280.jpg"
          srcSet="/hero/hero-2-1280.jpg 1280w, /hero/hero-2-2400.jpg 2400w"
          sizes="100vw"
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover"
          style={{ objectPosition: "65% center" }}
        />
        <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
        <Container className="pt-14 pb-24 sm:pt-20 sm:pb-28">
          <p className="type-eyebrow flex items-center gap-3 text-white">
            <span className="h-px w-8 bg-primary" aria-hidden="true" /> Rooms and suites
          </p>
          <h1 className="type-display mt-5 max-w-3xl text-white">
            Find your kind of <span className="text-primary">stay.</span>
          </h1>
          <p className="type-body mt-4 max-w-xl text-white">
            Compare every room, or add your dates to see exactly what is free and what it costs.
          </p>
        </Container>
      </section>

      <section className="bg-white pb-16 sm:pb-20" aria-labelledby="rooms-results-title">
        <Container>
          <div ref={formRef} className="relative z-10 -mt-14 scroll-mt-28">
            <RoomSearchForm
              key={formKey}
              value={filters}
              onSearch={(next) => apply({ ...next, type: filters.type })}
              checkInRef={checkInRef}
              className="shadow-[0_10px_30px_rgba(17,17,17,0.08)]"
            />
          </div>
          <div className="mt-10">
            <RoomResults
              filters={filters}
              search={search}
              onTypeChange={changeType}
              onClear={clear}
              onChooseDates={chooseDates}
              headingId="rooms-results-title"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
