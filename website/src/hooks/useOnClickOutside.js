import { useEffect } from "react";

export default function useOnClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return;
    const listener = (event) => {
      if (ref.current && !ref.current.contains(event.target)) handler(event);
    };
    document.addEventListener("pointerdown", listener);
    return () => document.removeEventListener("pointerdown", listener);
  }, [ref, handler, active]);
}