import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronLeft, FaChevronRight, FaXmark } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

/**
 * Full-screen viewer for one event's photos: arrows, thumbnails, swipe on phones,
 * arrow keys and Escape. Focus moves into the viewer and back to the card on close.
 * A photo may carry a `caption`, shown under it.
 */
export default function PhotoLightbox({ photos, startIndex = 0, label, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const closeRef = useRef(null);
  const thumbRefs = useRef([]);
  const touchX = useRef(null);
  const total = photos.length;
  const go = (delta) => setIndex((i) => (i + delta + total) % total);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    thumbRefs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [index]);

  const photo = photos[index];
  const arrow = 'hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:flex';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[100] flex flex-col bg-brand-900/95 px-4 pb-4 pt-4 text-white"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm tabular-nums text-white/80">{index + 1} / {total}</span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/25">
          <FaXmark aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-3 py-3">
        {total > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={arrow}>
            <FaChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
        <div
          className="flex h-full min-w-0 flex-1 items-center justify-center"
          onTouchStart={(event) => { touchX.current = event.touches[0].clientX; }}
          onTouchEnd={(event) => {
            if (touchX.current === null) return;
            const dx = event.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          }}
        >
          <figure className="flex h-full max-w-full flex-col items-center justify-center gap-3">
            <img key={photo.id} src={photo.imageUrl} alt={photo.caption || `${label}, photo ${index + 1} of ${total}`} className="min-h-0 max-w-full flex-1 rounded-image object-contain" />
            {photo.caption && <figcaption className="text-center text-sm text-white/90">{photo.caption}</figcaption>}
          </figure>
        </div>
        {total > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Next photo" className={arrow}>
            <FaChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [justify-content:safe_center]">
          {photos.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => { thumbRefs.current[i] = el; }}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'aspect-[16/11] w-[72px] shrink-0 overflow-hidden rounded-lg border-2 transition-opacity',
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-55 hover:opacity-90',
              )}
            >
              <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
