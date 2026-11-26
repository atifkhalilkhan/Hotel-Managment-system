import { useEffect } from "react";

export default function useEscapeKey(handler, active = true) {
  useEffect(() => {
    if (!active) return;
    const listener = (event) => {
      if (event.key === "Escape") handler(event);
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [handler, active]);
}