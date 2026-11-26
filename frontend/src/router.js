/* Small history router used in place of an unavailable routing dependency. */
export function navigate(path, replace = false) {
  window.history[replace ? "replaceState" : "pushState"]({}, "", path);
  window.dispatchEvent(new Event("luxurystay:navigate"));
}

// Login se pehle jis page par ja rahe the (misal: website se aaya booking link), use yaad rakho,
// taake login/register ke baad wahin wapas jayen. Sirf isi site ke andar ke path ("/..." , "//" nahi).
const RETURN_KEY = "luxurystay:returnTo";
// Sirf wahi pages jahan website se link aata hai (logout ke baad doosra user kisi aur ke page par na pahunche)
const RETURNABLE_PATHS = ["/reservations/new"];
const isSafePath = (value) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && RETURNABLE_PATHS.includes(value.split("?")[0]);

export function rememberReturnTo() {
  const target = window.location.pathname + window.location.search;
  try {
    if (isSafePath(target)) sessionStorage.setItem(RETURN_KEY, target);
  } catch {
    // Storage band ho to bas dashboard par chale jayenge
  }
}

export function takeReturnTo(fallback = "/dashboard") {
  try {
    const target = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return isSafePath(target) ? target : fallback;
  } catch {
    return fallback;
  }
}
