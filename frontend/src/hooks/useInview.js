import { useEffect, useRef, useState } from "react";

/**
 * useInView — returns a [ref, hasEntered] tuple.
 * hasEntered flips true once the element scrolls into view (fires once).
 *
 * Usage:
 *   const [ref, visible] = useInView()
 *   <div ref={ref} className={visible ? 'opacity-100' : 'opacity-0'} />
 *
 * @param {number} threshold  — 0–1, how much of the element must be visible (default 0.15)
 * @param {string} rootMargin — IntersectionObserver rootMargin (default '0px')
 */
export function useInView(threshold = 0.15, rootMargin = "0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // fire once only
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, visible];
}
