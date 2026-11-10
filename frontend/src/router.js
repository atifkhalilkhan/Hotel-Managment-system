/* Small history router used in place of an unavailable routing dependency. */
export function navigate(path, replace = false) {
  window.history[replace ? "replaceState" : "pushState"]({}, "", path);
  window.dispatchEvent(new Event("luxurystay:navigate"));
}
