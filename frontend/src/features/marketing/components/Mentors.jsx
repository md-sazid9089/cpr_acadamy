import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

/**
 * Placeholder mentor roster. Swap the `image` paths for real portraits once
 * the photos are dropped into `public/assets/mentors/`.
 *
 * TODO: source from GET /mentors once the backend exists.
 */
const MENTORS = [
  {
    id: 'm-1',
    name: 'Dr. Mohammad Rahman',
    credential: 'FCPS (Medicine)',
    image: '/assets/spotlight/profilea.png',
  },
  {
    id: 'm-2',
    name: 'Dr. Farhana Akter',
    credential: 'FCPS (Gynaecology)',
    image: '/assets/spotlight/profileb.png',
  },
  {
    id: 'm-3',
    name: 'Dr. Rakibul Islam',
    credential: 'MS (Surgery)',
    image: '/assets/spotlight/profilea.png',
  },
  {
    id: 'm-4',
    name: 'Dr. Nusrat Jahan',
    credential: 'FCPS (Paediatrics)',
    image: '/assets/spotlight/profilea.png',
  },
  {
    id: 'm-5',
    name: 'Dr. Aminul Haque',
    credential: 'MD (Radiology)',
    image: '/assets/spotlight/profilea.png',
  },
  {
    id: 'm-6',
    name: 'Dr. Sadia Afrin',
    credential: 'FCPS (Dermatology)',
    image: '/assets/spotlight/profilea.png',
  },
];

/**
 * Mentor card — portrait photo with name and credential overlaid at the bottom.
 * Falls back to a branded initial when the image hasn't been added yet.
 */
function MentorCard({ mentor }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = mentor.name
    .split(' ')
    .filter((w) => w[0] === w[0].toUpperCase())
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="group relative mx-auto w-full max-w-[240px] pb-10 sm:max-w-[260px]">
      {/* Gradient wrapper — the backdrop behind the cutout photo. Brand tokens
          rather than inline hex, so it tracks the palette like everything else. */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-800 to-accent-800 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
        {/* Photo — works best with a transparent-background cutout PNG */}
        <div className="aspect-[3/4]">
          {!imgFailed && mentor.image ? (
            <img
              src={mentor.image}
              alt={mentor.name}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl font-bold text-white/40">
                {initials}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Floating info badge — overlaps the bottom of the gradient card */}
      <div className="absolute bottom-0 left-2 right-2 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-lg dark:border-slate-800 dark:bg-surface-dark dark:shadow-slate-950/50">
        <h3 className="text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
          {mentor.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs dark:text-slate-400">
          {mentor.credential}
        </p>
        <p className="mt-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 sm:text-xs dark:text-brand-400">
            Mentor Profile
            <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * "Our Expert Mentors" — horizontally scrolling mentor cards powered by
 * embla-carousel. Shows 3 cards on desktop, auto-scrolls right-to-left
 * one card at a time with clear spacing between cards. Pauses on hover/focus.
 */
export default function Mentors() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
  });
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll right-to-left every 2.5 seconds.
  useEffect(() => {
    if (!emblaApi || isPaused) return undefined;

    const id = setInterval(() => {
      emblaApi.scrollNext();
    }, 2500);

    return () => clearInterval(id);
  }, [emblaApi, isPaused]);

  return (
    <section className="bg-white py-12 dark:bg-surface-dark">
      <div className="container-page">
        <div className="text-center">
          <span className="inline-block rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
            Mentors
          </span>
          <h2 className="mt-4 text-2xl font-normal tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Unlock Your Success With Our Expert Mentors!
          </h2>
        </div>

        {/* Carousel */}
        <div
          className="mt-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="-ml-8 flex sm:-ml-10 lg:-ml-12">
              {MENTORS.map((mentor) => (
                <div
                  key={mentor.id}
                  className="min-w-0 flex-[0_0_65%] pl-8 sm:flex-[0_0_42%] sm:pl-10 lg:flex-[0_0_33.333%] lg:pl-12"
                >
                  <MentorCard mentor={mentor} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
