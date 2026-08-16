import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

/**
 * Reusable image carousel built on embla-carousel-react.
 *
 * Autoplay is a plain interval driving `scrollNext` rather than the separate
 * autoplay plugin — one less dependency for behaviour this simple. It pauses on
 * hover, on keyboard focus, and whenever the visitor prefers reduced motion.
 *
 * @param {Object} props
 * @param {{ id?: string, src: string, alt: string, label?: string }[]} props.slides
 * @param {boolean} [props.autoPlay=true]
 * @param {number} [props.interval=5000]  Autoplay delay in ms.
 * @param {boolean} [props.loop=true]
 * @param {boolean} [props.showArrows=true]
 * @param {boolean} [props.showDots=true]
 * @param {string} [props.aspectClassName]  Aspect ratio of the slide area.
 * @param {'cover' | 'contain'} [props.fit='cover']  Use 'contain' for artwork of
 *   mixed or unknown aspect ratios — nothing is cropped, and the letterboxing is
 *   filled with a blurred copy of the same image.
 * @param {string} [props.className]
 * @param {string} [props.label]  Accessible name for the carousel region.
 */
export default function Carousel({
  slides = [],
  autoPlay = true,
  interval = 5000,
  loop = true,
  showArrows = true,
  showDots = true,
  aspectClassName = 'aspect-[16/10]',
  fit = 'cover',
  className,
  label = 'Promotional highlights',
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop, align: 'start', skipSnaps: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const scrollTo = useCallback((index) => emblaApi?.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Keep the dot indicators in step with the carousel.
  useEffect(() => {
    if (!emblaApi) return undefined;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length);
    onSelect();

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || !autoPlay || isPaused || prefersReducedMotion) return undefined;
    if (slides.length < 2) return undefined;

    const id = setInterval(() => {
      // Without loop, stop once the last slide is reached.
      if (!loop && !emblaApi.canScrollNext()) return;
      emblaApi.scrollNext();
    }, interval);

    return () => clearInterval(id);
  }, [emblaApi, autoPlay, isPaused, prefersReducedMotion, interval, loop, slides.length]);

  if (!slides.length) return null;

  return (
    <div
      className={cn('relative', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {/* Card chrome matches the Card primitive used by the rest of the site. */}
      <div
        className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800"
        ref={emblaRef}
      >
        <div className="flex">
          {slides.map((slide, index) => (
            <div
              key={slide.id ?? slide.src}
              className="min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
            >
              <CarouselSlide slide={slide} aspectClassName={aspectClassName} fit={fit} />
            </div>
          ))}
        </div>
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <CarouselArrow direction="prev" onClick={scrollPrev} />
          <CarouselArrow direction="next" onClick={scrollNext} />
        </>
      )}

      {showDots && snapCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: snapCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selectedIndex}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === selectedIndex
                  ? 'w-6 bg-brand-600 dark:bg-brand-400'
                  : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One slide. Falls back to a branded panel when the image is missing, so the
 * hero still looks intentional before the real posters are dropped in.
 */
function CarouselSlide({ slide, aspectClassName, fit }) {
  const [failed, setFailed] = useState(false);

  if (failed || !slide.src) {
    return (
      <div
        className={cn(
          'flex w-full items-center justify-center bg-gradient-to-br from-brand-600 to-emerald-900 px-6 text-center',
          aspectClassName,
        )}
      >
        <div>
          <p className="text-sm font-semibold text-white">{slide.label ?? slide.alt}</p>
          <p className="mt-1 text-xs text-brand-200">Poster image not added yet</p>
        </div>
      </div>
    );
  }

  if (fit === 'contain') {
    return (
      <div
        className={cn(
          'relative w-full overflow-hidden bg-slate-100 dark:bg-slate-900',
          aspectClassName,
        )}
      >
        {/* Blurred copy of the poster fills the letterbox so mixed aspect
            ratios still read as a deliberate frame rather than empty bars. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-xl"
          style={{ backgroundImage: `url("${slide.src}")` }}
        />
        <img
          src={slide.src}
          alt={slide.alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="relative h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <img
      src={slide.src}
      alt={slide.alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('w-full object-cover', aspectClassName)}
    />
  );
}

function CarouselArrow({ direction, onClick }) {
  const isPrev = direction === 'prev';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? 'Previous slide' : 'Next slide'}
      className={cn(
        'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full',
        // Solid pill so the control stays legible over any poster artwork.
        'bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur transition-colors',
        'hover:bg-white dark:bg-slate-900/80 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-900',
        isPrev ? 'left-3' : 'right-3',
      )}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={isPrev ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        />
      </svg>
    </button>
  );
}
