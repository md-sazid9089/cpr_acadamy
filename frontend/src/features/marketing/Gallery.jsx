import { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

/** Gallery photos shown in a featured slider, selectable from the thumbnail grid. */
const GALLERY_PHOTOS = [
  { id: 'gp-1', src: '/assets/carousel/postera.jpeg', alt: 'FCPS P-I brilliant success in FCPS & Residency' },
  { id: 'gp-2', src: '/assets/carousel/posterb.jpeg', alt: 'Crest awarding & mentor felicitation program' },
  { id: 'gp-3', src: '/assets/carousel/posterc.jpeg', alt: 'Warm felicitation for successful doctors' },
  { id: 'gp-4', src: '/assets/carousel/posterd.jpeg', alt: 'Brilliant success in July & January examination' },
  { id: 'gp-5', src: '/assets/carousel/postere.jpeg', alt: 'Celebration of success — mentors and candidates' },
  { id: 'gp-6', src: '/assets/carousel/posterf.jpeg', alt: 'BCS Health special session & keynote address' },
  { id: 'gp-7', src: '/assets/carousel/postera.jpeg', alt: 'Warm felicitation FCPS Part-1 doctors' },
  { id: 'gp-8', src: '/assets/carousel/posterb.jpeg', alt: 'Interactive seminar & orientation classroom hall' },
  { id: 'gp-9', src: '/assets/carousel/posterc.jpeg', alt: 'Surgery batch achievers group photo' },
  { id: 'gp-10', src: '/assets/carousel/posterd.jpeg', alt: 'Paediatrics achievers batch & faculty' },
  { id: 'gp-11', src: '/assets/carousel/postere.jpeg', alt: 'Obs & Gynae candidates felicitation' },
  { id: 'gp-12', src: '/assets/carousel/posterf.jpeg', alt: 'Celebration of success — special honors ceremony' },
];

const AUTOPLAY_MS = 5000;

export default function Gallery() {
  const [current, setCurrent] = useState(0);
  const total = GALLERY_PHOTOS.length;
  const active = GALLERY_PHOTOS[current];
  const thumbRefs = useRef([]);

  const go = (delta) => setCurrent((c) => (c + delta + total) % total);

  // Autoplay; the effect re-runs on every change so a manual click resets the timer.
  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % total), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [current, total]);

  // Keep the active thumbnail in view as the slider advances.
  useEffect(() => {
    thumbRefs.current[current]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current]);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-dark">
      {/* ── Title + featured slider on a soft lavender field ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-100 via-indigo-50 to-violet-100 py-12 sm:py-16 dark:from-slate-900 dark:via-surface-dark dark:to-slate-900">
        {/* Faint grid lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.1]"
          style={{
            backgroundImage:
              'linear-gradient(#4338ca 1px, transparent 1px), linear-gradient(90deg, #4338ca 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
          aria-hidden="true"
        />
        {/* Soft light blooms */}
        <div className="pointer-events-none absolute -left-16 top-1/3 h-64 w-64 rounded-full bg-white/50 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-10 bottom-8 h-72 w-72 rounded-full bg-white/50 blur-3xl" aria-hidden="true" />

        <div className="container-page relative z-10">
          <h1 className="text-center text-4xl font-extrabold tracking-tight text-indigo-900 sm:text-5xl lg:text-6xl dark:text-white">
            Photo Gallery
          </h1>

          {/* Featured slider: arrows sit in the side padding, beside the image. */}
          <div className="relative mx-auto mt-8 max-w-4xl px-10 sm:mt-10 sm:px-16">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous slide"
              className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-indigo-900/70 transition hover:bg-white/70 hover:text-indigo-900 sm:h-12 sm:w-12 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FaChevronLeft className="h-6 w-6" />
            </button>

            <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
              <img
                key={active.id}
                src={active.src}
                alt={active.alt}
                className="aspect-[16/10] w-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next slide"
              className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-indigo-900/70 transition hover:bg-white/70 hover:text-indigo-900 sm:h-12 sm:w-12 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FaChevronRight className="h-6 w-6" />
            </button>

            <p className="mt-4 text-center text-sm font-semibold text-indigo-900/70 dark:text-slate-300">
              Item {current + 1} of {total}
            </p>
          </div>
        </div>
      </section>

      {/* ── Thumbnail selector grid on a turquoise band ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cyan-400 via-cyan-500 to-teal-500 py-12 sm:py-16">
        <div className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

        <div className="container-page relative z-10">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {GALLERY_PHOTOS.map((photo, i) => (
              <button
                key={photo.id}
                ref={(el) => (thumbRefs.current[i] = el)}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={photo.alt}
                aria-current={i === current}
                className={cn(
                  'group relative overflow-hidden rounded-xl bg-white/10 shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:rounded-2xl',
                  i === current
                    ? 'ring-4 ring-white'
                    : 'ring-2 ring-white/40 hover:-translate-y-1 hover:ring-white',
                )}
              >
                <div className="aspect-[16/11] w-full overflow-hidden bg-slate-900/30">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                {/* Dim the non-active thumbnails so the current pick stands out. */}
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 transition-opacity',
                    i === current ? 'opacity-0' : 'bg-teal-900/20 group-hover:opacity-0',
                  )}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
