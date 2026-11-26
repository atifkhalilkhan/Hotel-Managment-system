import { useEffect, useState } from "react";

export default function useElementInView(id) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = document.getElementById(id);
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [id]);

  return inView;
}