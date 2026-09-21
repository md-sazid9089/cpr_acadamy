import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { fetchGallery } from './api/gallery.api.js';
import { cn } from '@/lib/utils';
import MolecularBackground from '@/components/ui/backgrounds/MolecularBackground.jsx';
import ResponsiveImage, { localWebpSrcSet } from '@/components/ui/ResponsiveImage.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';

const AUTOPLAY_MS = 5000;

/** Photo gallery, grouped into admin-managed sections; falls back gracefully before any are uploaded. */
export default function Gallery() {
  const { data: sections = [], isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['marketing', 'gallery'],
    queryFn: fetchGallery,
  });

  const [activeSection, setActiveSection] = useState(0);
  const [current, setCurrent] = useState(0);
  const thumbRefs = useRef([]);

  const photos = useMemo(() => (sections[activeSection]?.photos ?? []).map((photo) => (
    { id: photo.id, src: photo.imageUrl, alt: photo.caption || sections[activeSection]?.section || 'Gallery photo' }
  )), [sections, activeSection]);
  const total = photos.length;
  const active = photos[current];

  const go = (delta) => setCurrent((c) => (c + delta + total) % total);
  const selectSection = (index) => {
    setActiveSection(index);
    setCurrent(0);
  };

  // Autoplay; the effect re-runs on every change so a manual click resets the timer.
  useEffect(() => {
    if (total < 2) return undefined;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % total), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [current, total]);

  // Keep the active thumbnail in view as the slider advances.
  useEffect(() => {
    thumbRefs.current[current]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current]);

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <ContentSkeleton label="Loading gallery" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page py-16">
        <EmptyState
          variant="error"
          title="Couldn't load the gallery"
          description={error?.message || 'Something went wrong. Please try again.'}
          onRetry={refetch}
          isFetching={isFetching}
        />
      </div>
    );
  }

  if (!total) {
    return (
      <div className="container-page py-16">
        <EmptyState title="Photos coming soon" description="Check back soon to see photos from our classes and events." />
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-surface-light dark:bg-surface-dark">
      <MolecularBackground />
      <section className="relative py-12 sm:py-16">

        <div className="container-page relative z-10">
          <h1 className="text-center text-4xl font-extrabold tracking-normal text-brand-900 sm:text-5xl lg:text-6xl dark:text-white">
            Photo Gallery
          </h1>

          {sections.length > 1 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {sections.map((section, index) => (
                <button
                  key={section.section}
                  type="button"
                  onClick={() => selectSection(index)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    index === activeSection
                      ? 'bg-brand-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200',
                  )}
                >
                  {section.section}
                </button>
              ))}
            </div>
          )}

          {/* Featured slider: arrows sit in the side padding, beside the image. */}
          <div className="relative mx-auto mt-8 max-w-4xl px-10 sm:mt-10 sm:px-16">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous slide"
              className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-brand-900/70 transition hover:bg-white/70 hover:text-brand-900 sm:h-12 sm:w-12 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FaChevronLeft className="h-6 w-6" />
            </button>

            <div className="overflow-hidden rounded-3xl border border-stone-200 ">
              <ResponsiveImage
                key={active.id}
                src={active.src}
                webpSrcSet={localWebpSrcSet(active.src)}
                sizes="(min-width: 1024px) 896px, 90vw"
                alt={active.alt}
                className="aspect-[16/10] w-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next slide"
              className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-brand-900/70 transition hover:bg-white/70 hover:text-brand-900 sm:h-12 sm:w-12 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FaChevronRight className="h-6 w-6" />
            </button>

            <p className="mt-4 text-center text-sm font-semibold text-brand-900/70 dark:text-brand-200">
              Item {current + 1} of {total}
            </p>
          </div>
        </div>
      </section>

      <section className="relative py-12 sm:py-16">

        <div className="container-page relative z-10">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                ref={(el) => (thumbRefs.current[i] = el)}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={photo.alt}
                aria-current={i === current}
                className={cn(
                  'group relative overflow-hidden rounded-xl bg-white border border-stone-200 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:bg-surface-dark-subtle dark:focus-visible:ring-brand-300 sm:rounded-2xl',
                  i === current
                    ? 'outline outline-2 outline-brand-500 outline-offset-2'
                    : 'hover:-translate-y-1',
                )}
              >
                <div className="aspect-[16/11] w-full overflow-hidden bg-stone-900/30">
                  <ResponsiveImage
                    src={photo.src}
                    webpSrcSet={localWebpSrcSet(photo.src)}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    alt={photo.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                {/* Dim the non-active thumbnails so the current pick stands out. */}
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 transition-opacity',
                    i === current ? 'opacity-0' : 'bg-brand-900/20 group-hover:opacity-0',
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
