// Portal (staff/guest app) ke links: ye doosri website hai, isliye poora URL
const BASE = (import.meta.env.VITE_APP_URL || "http://localhost:5173").replace(/\/+$/, "");

export const PORTAL_LOGIN = "/login";
export const PORTAL_REGISTER = "/register";
export const PORTAL_BOOK = "/reservations/new";

export const portalUrl = (path = "/") => `${BASE}/${String(path).replace(/^\/+/, "")}`;
export const guestLoginUrl = () => portalUrl(PORTAL_LOGIN);
export const guestRegisterUrl = () => portalUrl(PORTAL_REGISTER);

// bookUrl({ checkIn: "2026-12-01", checkOut: "2026-12-04", guests: 2 })
export const bookUrl = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return portalUrl(PORTAL_BOOK) + (query ? `?${query}` : "");
};
