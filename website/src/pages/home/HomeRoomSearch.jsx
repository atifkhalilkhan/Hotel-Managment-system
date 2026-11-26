import { useEffect, useRef, useState } from "react";
import Container from "../../components/ui/Container";
import RoomSearchForm from "../../components/rooms/RoomSearchForm";
import RoomResults from "../../components/rooms/RoomResults";
import useRoomSearch from "../../hooks/useRoomSearch";
import { EMPTY_FILTERS } from "../../lib/booking";
import { hotelInfo } from "../../lib/hotelInfo";

/**
 * Hero ke neeche ka booking bar. Search karne par khali rooms yahin, isi page par
 * neeche aa jate hain (koi naya page nahi). "Clear filters" results band karke form saaf karta hai.
 */
export default function HomeRoomSearch() {
  const [filters, setFilters] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const search = useRoomSearch(filters ?? EMPTY_FILTERS, { enabled: Boolean(filters) });
  const resultsRef = useRef(null);

  // Naya search lage to results tak le chalo (sirf jab woh screen se neeche hon)
  useEffect(() => {
    const element = resultsRef.current;
    if (!filters || !element) return;
    const { top } = element.getBoundingClientRect();
    if (top > window.innerHeight * 0.6) element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [filters]);

  const clear = () => {
    setFilters(null);
    setFormVersion((value) => value + 1); // form ko default dates par wapas
  };

  return (
    <section aria-label="Check availability" className="relative z-10 -mt-16 sm:-mt-14">
      <Container>
        <RoomSearchForm
          key={formVersion}
          value={EMPTY_FILTERS}
          onSearch={setFilters}
          requireDates
          showType
          className="shadow-[0_10px_30px_rgba(17,17,17,0.08)]"
          footer={
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-muted">
              <span>Check-in from <strong className="font-semibold text-ink">{hotelInfo.checkInTime}</strong></span>
              <span>Check-out by <strong className="font-semibold text-ink">{hotelInfo.checkOutTime}</strong></span>
              <span>{hotelInfo.receptionHours}</span>
            </p>
          }
        />

        {filters && (
          <div ref={resultsRef} className="scroll-mt-24 pt-10 sm:pt-12">
            <RoomResults filters={filters} search={search} onClear={clear} headingId="home-search-title" />
          </div>
        )}
      </Container>
    </section>
  );
}
