import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(null);

  useEffect(() => {
    const from = previousPath.current;
    previousPath.current = pathname;
    if (!hash && from?.startsWith("/rooms") && pathname.startsWith("/rooms")) return;
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}
