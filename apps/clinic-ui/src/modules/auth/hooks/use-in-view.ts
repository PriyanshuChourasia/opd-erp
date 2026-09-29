import { useEffect, useRef, useState } from "react";

/**
 * Observe an element and report when it enters the viewport.
 *
 * Returns a ref to attach and a boolean that flips to true once the element
 * is ≥15% visible (with an extra 10% shaved off the bottom of the viewport so
 * reveals trigger just before the element is fully on screen). Observation
 * stops after the first hit — reveals run once, they don't reverse on scroll
 * back up.
 */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Reduced motion / no IO support: show everything immediately.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}
