/* Debounced searchable room selector for housekeeping and maintenance forms. */
import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import api from "../api/axios.js";
import { Alert } from "./UI.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function RoomPicker({ value, onChange, label = "Room", disabled = false, roomOptions }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(roomOptions || []);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || roomOptions) return undefined;

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (query.trim()) params.set("search", query.trim());
        const payload = await api.get(`/rooms?${params.toString()}`);
        if (active) setResults(payload.rooms || []);
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to search rooms.");
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query, roomOptions]);

  const selectedLabel = value ? `Room ${value.roomNumber}` : "";
  const items = roomOptions || results;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      {value && !open ? (
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line bg-white px-3">
          <span className="flex min-w-0 items-center gap-2 truncate text-sm">
            {selectedLabel} · {value.type || "Room"} · Floor {value.floor ?? "-"}
            {value.status && <StatusBadge status={value.status} />}
          </span>
          <button aria-label="Change selected room" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-page" disabled={disabled} onClick={() => { setOpen(true); setQuery(""); }} type="button"><ChevronsUpDown className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            aria-label={`Search ${label.toLowerCase()}`}
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-base sm:text-sm"
            disabled={disabled}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search by room number"
            value={query}
          />
          {open && (
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-white">
              {error ? <div className="p-3"><Alert>{error}</Alert></div>
                : loading ? <p className="p-3 text-sm text-muted">Searching rooms...</p>
                  : items.length ? items.map((room) => (
                    <button className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-page" key={room._id} onClick={() => { onChange(room); setOpen(false); setQuery(""); }} type="button">
                      <span className="min-w-0 truncate">Room {room.roomNumber} · {room.type} · Floor {room.floor ?? "-"}</span>
                      <span className="flex shrink-0 items-center gap-2">{room.status && <StatusBadge status={room.status} />}{value?._id === room._id && <Check className="h-4 w-4 text-primary" />}</span>
                    </button>
                  )) : <p className="p-3 text-sm text-muted">No rooms found.</p>}
              <button className="w-full border-t border-line px-3 py-2 text-left text-sm text-muted hover:bg-page" onClick={() => setOpen(false)} type="button">Close list</button>
            </div>
          )}
        </div>
      )}
      {value && <button className="text-xs font-medium text-primary-dark hover:underline" disabled={disabled} onClick={() => { onChange(null); setOpen(true); }} type="button">Clear selected room</button>}
    </div>
  );
}
