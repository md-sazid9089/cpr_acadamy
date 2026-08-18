import { useEffect, useState } from 'react';

/**
 * True once the page has scrolled past `threshold` pixels.
 *
 * Used by the navbar to swap between a transparent bar at the top of the page
 * and a solid one further down. The listener is passive so it never blocks
 * scrolling, and state only changes when the boolean flips — not on every
 * scroll event — so this doesn't re-render the header continuously.
 *
 * @param {number} [threshold=8]
 */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > threshold,
  );

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > threshold;
      setScrolled((current) => (current === next ? current : next));
    };

    onScroll(); // Catch a restored scroll position on mount.
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
