import { useId, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { buttonClasses } from "../ui/buttonStyles";
import { GUEST_OPTIONS, ROOM_TYPES, addDays, todayValue } from "../../lib/booking";

const fieldClass =
  "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink transition-colors hover:border-ink/40 focus:border-ink focus:outline-none";

function Field({ id, label, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Dates + guests (+ room type) ka form. Submit par `onSearch(filters)` chalta hai, page nahi badalta.
 *  - requireDates: Home par dates zaroori; Rooms page par khali chhor sakte hain (saare rooms)
 *  - showType: room type ka dropdown (Rooms page par type ke buttons results ke upar hain)
 * Parent `key` badal kar form ko naye lage hue filters se dobara bhar sakta hai.
 */
export default function RoomSearchForm({ value, onSearch, requireDates = false, showType = false, checkInRef, footer, className = "" }) {
  const id = useId();
  const today = todayValue();
  const [checkIn, setCheckIn] = useState(value.checkIn || (requireDates ? today : ""));
  const [checkOut, setCheckOut] = useState(value.checkOut || (requireDates ? addDays(today, 1) : ""));
  const [guests, setGuests] = useState(value.guests || (requireDates ? 2 : 0));
  const [type, setType] = useState(value.type || "");
  const [error, setError] = useState("");

  const changeCheckIn = (next) => {
    setCheckIn(next);
    setError("");
    // Check-out hamesha check-in ke baad rahe
    if (next && (!checkOut || checkOut <= next)) setCheckOut(addDays(next, 1));
  };

  const submit = (event) => {
    event.preventDefault();
    if (Boolean(checkIn) !== Boolean(checkOut)) {
      setError("Choose both dates, or leave both empty to see every room.");
      return;
    }
    onSearch({ checkIn, checkOut, guests, type: showType ? type : value.type });
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Search rooms"
      noValidate={!requireDates}
      className={`rounded-md border border-line bg-white p-4 sm:p-5 ${className}`}
    >
      <div
        className={`grid grid-cols-2 gap-3 lg:items-end lg:gap-4 ${
          showType ? "lg:grid-cols-[1fr_1fr_0.75fr_0.9fr_auto]" : "lg:grid-cols-[1fr_1fr_0.8fr_auto]"
        }`}
      >
        <Field id={`${id}-in`} label="Check-in">
          <input
            ref={checkInRef}
            id={`${id}-in`}
            type="date"
            required={requireDates}
            min={today}
            value={checkIn}
            onChange={(event) => changeCheckIn(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field id={`${id}-out`} label="Check-out">
          <input
            id={`${id}-out`}
            type="date"
            required={requireDates}
            min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)}
            value={checkOut}
            onChange={(event) => {
              setCheckOut(event.target.value);
              setError("");
            }}
            className={fieldClass}
          />
        </Field>
        <Field id={`${id}-guests`} label="Guests">
          <select id={`${id}-guests`} value={guests} onChange={(event) => setGuests(Number(event.target.value))} className={fieldClass}>
            {!requireDates && <option value={0}>Any</option>}
            {GUEST_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </Field>
        {showType && (
          <Field id={`${id}-type`} label="Room">
            <select id={`${id}-type`} value={type} onChange={(event) => setType(event.target.value)} className={fieldClass}>
              <option value="">Any room</option>
              {ROOM_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        <button
          type="submit"
          className={buttonClasses({ className: `w-full lg:w-auto ${showType ? "col-span-2 lg:col-span-1" : "col-span-1 self-end"}` })}
        >
          {requireDates ? (
            <>
              Check availability <ArrowRight className="size-4" aria-hidden="true" />
            </>
          ) : (
            <>
              <Search className="size-4" aria-hidden="true" /> Search
            </>
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-accent">
          {error}
        </p>
      )}
      {footer}
    </form>
  );
}
