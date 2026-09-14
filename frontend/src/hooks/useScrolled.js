import { useEffect, useState } from 'react';

/**
 * True once the page has scrolled past `threshold` pixels.
 *
 * Used by the navbar to swap between a transparent bar at the top of the page
 * and a solid one further down.
 *
 * This watches a hidden sentinel with an IntersectionObserver rather than
 * reading `window.scrollY` from a scroll handler. Reading the scroll position
 * forces a synchronous layout, and while the homepage is still loading — images
 * arriving, fonts swapping, the carousel sizing itself — the document is dirty
 * on nearly every one of those reads, so each one recalculates the whole page.
 * That alone accounted for about a second of blocked main thread on the
 * homepage. The observer reports the same crossing without ever asking the
 * browser to compute layout on demand.
 *
 * @param {number} [threshold=8]
 */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // A zero-width strip of exactly `threshold` pixels pinned to the top of the
    // document: while any of it is on screen the page is within the threshold,
    // and once it is fully scrolled past, it is not.
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    Object.assign(sentinel.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '1px',
      height: `${Math.max(1, threshold)}px`,
      pointerEvents: 'none',
      visibility: 'hidden',
    });
    document.body.appendChild(sentinel);

    // Fires once on observe, so the restored scroll position is picked up too.
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, [threshold]);

  return scrolled;
}
