import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { filtersQuery, hasDates, nightsBetween } from "../lib/booking";

// Public catalog ek dafa mein 50 tak rooms deta hai; is hotel ke liye kaafi (zyada hon to pagination chahiye)
const CATALOG_LIMIT = 50;

/**
 * Filters ke hisaab se rooms lata hai.
 *  - dates hon: /rooms/public/available (sirf khali rooms, booking wala hi overlap logic)
 *  - dates na hon: /rooms/public (saare rooms; guests ka filter yahin lagta hai)
 *
 * status: "idle" | "loading" (pehli dafa) | "refreshing" (purane cards dikhte rehte hain) | "ready" | "error"
 * Filter badalne par purane results tab tak rehte hain jab tak naye na aa jayen, taake page upar-neeche na ho.
 */
export default function useRoomSearch(filters, { enabled = true } = {}) {
  const withDates = hasDates(filters);
  const query = filtersQuery(filters);
  const [attempt, setAttempt] = useState(0);
  const key = `${query}#${attempt}`;
  const [result, setResult] = useState({ key: "", rooms: [], error: "" });

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    const url = withDates
      ? `${API_BASE}/rooms/public/available?${query}`
      : `${API_BASE}/rooms/public?${new URLSearchParams({ limit: String(CATALOG_LIMIT), ...(filters.type ? { type: filters.type } : {}) })}`;

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "We could not load rooms right now.");
        let rooms = data.rooms || [];
        if (!withDates && filters.guests > 0) rooms = rooms.filter((room) => room.capacity >= filters.guests);
        if (!withDates) rooms = [...rooms].sort((a, b) => a.pricePerNight - b.pricePerNight);
        setResult({ key, rooms, error: "" });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        const message = error instanceof TypeError ? "We could not reach the hotel system. Please try again." : error.message;
        setResult({ key, rooms: [], error: message });
      });
    return () => controller.abort();
  }, [enabled, key, query, withDates, filters.type, filters.guests]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  let status = "idle";
  if (enabled) {
    if (result.key === key) status = result.error ? "error" : "ready";
    else status = result.key && result.rooms.length ? "refreshing" : "loading";
  }

  return {
    status,
    rooms: status === "loading" || status === "error" ? [] : result.rooms,
    error: status === "error" ? result.error : "",
    retry,
    withDates,
    nights: withDates ? nightsBetween(filters.checkIn, filters.checkOut) : 0,
  };
}
