// Room search ki choti cheezen: Home ka search, Rooms page ke filters aur results sab yahi use karte hain

export const ROOM_TYPES = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
];
export const MAX_GUESTS = 10;
export const GUEST_OPTIONS = Array.from({ length: MAX_GUESTS }, (_, index) => index + 1);
const TYPE_VALUES = ROOM_TYPES.map((option) => option.value);
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Local "YYYY-MM-DD" (toISOString UTC deta hai, jo raat ko ek din peeche ho jata hai)
export const toDateValue = (date) => date.toLocaleDateString("en-CA");
export const todayValue = () => toDateValue(new Date());
export const addDays = (value, days) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateValue(date);
};
export const nightsBetween = (checkIn, checkOut) =>
  Math.round((new Date(`${checkOut}T00:00:00Z`) - new Date(`${checkIn}T00:00:00Z`)) / 86400000);

/**
 * Filters: { checkIn, checkOut, guests, type }
 *  - dates: dono hon to "khali rooms" search, warna dono "" (saare rooms)
 *  - guests: 0 matlab "koi bhi"
 *  - type: "" matlab saare types
 */
export const EMPTY_FILTERS = { checkIn: "", checkOut: "", guests: 0, type: "" };

export const hasDates = (filters) => Boolean(filters.checkIn && filters.checkOut);
export const hasAnyFilter = (filters) => hasDates(filters) || filters.guests > 0 || Boolean(filters.type);

// URL (ya kisi bhi URLSearchParams) se filters; ghalat ya guzri values chhor di jati hain
export function readFilters(params) {
  const today = todayValue();
  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const datesOk = DATE_ONLY.test(checkIn) && DATE_ONLY.test(checkOut) && checkIn >= today && checkOut > checkIn;
  const guests = Number.parseInt(params.get("guests"), 10);
  const type = params.get("type") || "";
  return {
    checkIn: datesOk ? checkIn : "",
    checkOut: datesOk ? checkOut : "",
    guests: Number.isInteger(guests) && guests >= 1 && guests <= MAX_GUESTS ? guests : 0,
    type: TYPE_VALUES.includes(type) ? type : "",
  };
}

// Filters -> query string (sirf jo lage hue hain)
export function filtersQuery(filters) {
  const query = new URLSearchParams();
  if (hasDates(filters)) {
    query.set("checkIn", filters.checkIn);
    query.set("checkOut", filters.checkOut);
  }
  if (filters.guests > 0) query.set("guests", String(filters.guests));
  if (filters.type) query.set("type", filters.type);
  return query.toString();
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const formatDate = (value) => dateFormat.format(new Date(`${value}T00:00:00`));
export const formatPrice = (value) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value);
export const typeLabel = (type) => ROOM_TYPES.find((option) => option.value === type)?.label ?? "All rooms";
