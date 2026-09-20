import Carousel from '@/components/ui/Carousel.jsx';
import Button from '@/components/ui/Button.jsx';
import ValueProps from './ValueProps.jsx';

/**
 * Promotional posters, served from `public/assets/carousel/`.
 *
 * The artwork is a mix of portrait, square and landscape, so the carousel runs
 * in `contain` mode — nothing is cropped, which matters because these posters
 * are text-heavy and a crop would cut batch dates and phone numbers.
 *
 * Ordered strongest-first: batch offers lead, brochure spreads trail.
 */
const CAROUSEL_SLIDES = [
  {
    id: 'fcps-residency-combined',
    src: '/assets/carousel/posterd.jpeg',
    alt: 'Offline combined batch — FCPS Part-1 June 2026 and Residency November 2026, starting 10 January 2026. Admission open.',
    label: 'FCPS Part-1 & Residency · combined batch',
  },
  {
    id: 'residency-march-2027',
    src: '/assets/carousel/posterc.jpeg',
    alt: 'Residency March 2027 offline long-batch, starting 28 March 2026. Enrol now.',
    label: 'Residency March 2027 · long batch',
  },
  {
    id: 'residency-faculties',
    src: '/assets/carousel/posterb.jpeg',
    alt: 'Residency March 2027 offline long-batch — regular and exam batches across Medicine, Surgery, Basic, Dentistry and Paediatric faculties.',
    label: 'Residency · regular & exam batches',
  },
  {
    id: 'orientation-centre',
    src: '/assets/carousel/postera.jpeg',
    alt: "CPR Medical Academy — Chattogram's only offline medical post-graduation orientation centre, Moti Tower, Chawkbazar.",
    label: 'CPR Medical Academy · Chattogram',
  },
  {
    id: 'why-cpr',
    src: '/assets/carousel/postere.jpeg',
    alt: 'Why CPR — courses, reading library and medical bookshop at the Chattogram centre.',
    label: 'Why CPR · academy, library & bookshop',
  },
  {
    id: 'success-stories',
    src: '/assets/carousel/posterf.jpeg',
    alt: 'Success stories — CPR students who passed FCPS Part-1, Residency March 2026 and the 48th BCS (Health).',
    label: 'Success stories',
  },
];

export default function Hero() {
  return (
    <section className="homepage-hero hero-surface relative isolate flex flex-col items-center justify-center gap-6 overflow-hidden lg:gap-12">
      <img
        src="/assets/bg/Kerfin7-NEA-2128-1920.webp"
        srcSet="/assets/bg/Kerfin7-NEA-2128-768.webp 768w, /assets/bg/Kerfin7-NEA-2128-1920.webp 1920w"
        sizes="100vw"
        fetchPriority="high"
        decoding="async"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-[70%_30%] opacity-20 dark:opacity-40"
      />
      <div className="container-page w-full pb-6 pt-20 lg:pb-10 lg:pt-24">
        {/* The visible hero is artwork, so the page's h1 is screen-reader only —
            without it the homepage would have no top-level heading at all. */}
        <h1 className="sr-only">
          CPR Medical Academy — FCPS, Residency, BCS and MBBS preparation in Chattogram
        </h1>

        {/* Two-column hero: marketing copy on the left, poster carousel card on
            the right. Below lg the copy stacks above the card. */}
        <div className="relative top-10 grid items-center gap-12 lg:top-16 lg:grid-cols-2 lg:gap-20">
          <div className="text-center lg:text-left" lang="bn">
            <h2 className="text-4xl font-extrabold leading-tight tracking-normal text-brand-900 sm:text-5xl lg:text-6xl dark:text-white">
              আপনার সফলতার প্রস্তুতি শুরু হোক{' '}
              <span className="text-brand-600 dark:text-brand-300">CPR</span>{' '}
              থেকে
            </h2>

            <p className="mx-auto mt-7 max-w-xl text-base font-medium text-stone-600 sm:text-lg lg:mx-0 dark:text-brand-200">
              সরকারি চাকরি ও অন্যান্য প্রতিযোগিতামূলক পরীক্ষার জন্য সাজানো কোর্স থেকে আপনার
              প্রয়োজন অনুযায়ী প্রস্তুতি শুরু করুন
            </p>

            <div className="button-group mt-10 items-stretch justify-center sm:items-center lg:justify-start">
              <Button
                to="/register"
                variant="accent"
                size="lg"
                shape="pill"
              >
                প্রস্তুতি শুরু করুন
              </Button>
              <Button
                to="/courses"
                variant="outline"
                size="lg"
              >
                কোর্সগুলো দেখুন
              </Button>
            </div>
          </div>

          {/* Poster carousel card. */}
          <div className="mx-auto w-full max-w-xl">
            <Carousel
              slides={CAROUSEL_SLIDES}
              interval={5000}
              fit="contain"
              // Landscape frame with side arrows, matching the reference card.
              showArrows
              frameClassName="rounded-2xl border border-stone-200 dark:border-stone-200"
              // Wide landscape card on every viewport.
              aspectClassName="aspect-[16/10]"
              label="Course promotions"
            />
          </div>
        </div>
      </div>
      <ValueProps />
    </section>
  );
}
