import Carousel from '@/components/ui/Carousel.jsx';
import HeroRibbonBackground from '@/components/hero/HeroRibbonBackground.jsx';

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

/** Sub-heading shown above the carousel. Overridable via the `welcomeText` prop. */
const WELCOME_TEXT = 'CPR Academy-তে আপনাকে স্বাগতম !';

/** The word within WELCOME_TEXT picked out in brand green. */
const WELCOME_HIGHLIGHT = 'স্বাগতম';

/**
 * Splits `text` around the first occurrence of `highlight` so that one word can
 * carry the brand colour, keeping the heading a single translatable string.
 */
function renderWelcome(text, highlight) {
  if (!highlight || !text.includes(highlight)) return text;

  const index = text.indexOf(highlight);
  return (
    <>
      {text.slice(0, index)}
      <span className="text-brand-600 dark:text-brand-400">{highlight}</span>
      {text.slice(index + highlight.length)}
    </>
  );
}

export default function Hero({
  welcomeText = WELCOME_TEXT,
  welcomeHighlight = WELCOME_HIGHLIGHT,
  welcomeLang = 'bn',
}) {
  // `isolate` makes this section a stacking context, so the -z-10 decorative
  // layers paint above its own background instead of disappearing behind it.
  // The min-height fills the viewport below the announcement strip (~2.5rem);
  // `svh` rather than `vh` so mobile browser chrome doesn't push the fold off.
  return (
    <section className="relative isolate min-h-[calc(88svh-2.5rem)] overflow-hidden bg-white dark:bg-surface-dark">
      {/* Solid green panel + silk-ribbon swirls — the new component handles
          its own mobile fallback (flat gradient) and dark-mode tuning. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <HeroRibbonBackground className="h-full w-full" />
      </div>

      {/* pt-16 clears the navbar, which overlays this section (see
          PublicLayout) so the ribbons run up behind the transparent bar. */}
      <div className="container-page pb-6 pt-20 lg:pb-10 lg:pt-24">
        {/* The visible hero is artwork, so the page's h1 is screen-reader only —
            without it the homepage would have no top-level heading at all. */}
        <h1 className="sr-only">
          CPR Medical Academy — FCPS, Residency, BCS and MBBS preparation in Chattogram
        </h1>

        {/* Centred in the band above the carousel: the bottom margin matches the
            section's top padding, so the line sits midway between the navbar and
            the hero row. */}
        {welcomeText && (
          <h2
            lang={welcomeLang}
            className="mb-4 text-center text-2xl font-bold text-slate-800 sm:text-3xl lg:mb-6 dark:text-slate-200"
          >
            {renderWelcome(welcomeText, welcomeHighlight)}
          </h2>
        )}

        {/* Primary row: mentor photo left, poster carousel right.
            Below lg the photo is dropped and the carousel takes the full width —
            stacking a tall portrait above the posters would push them off screen. */}
        <div className="grid items-end gap-8 lg:grid-cols-2">
          <div className="hidden lg:block">
            <img
              src="/assets/spotlight/profileb.png"
              alt=""
              aria-hidden="true"
              // Intrinsic size of the asset. Without it the row has no height
              // until the portrait decodes, so the grid resizes on load and
              // embla re-measures the carousel beside it — which cost about
              // 450ms of forced layout on first paint.
              width={1200}
              height={1575}
              // Negative bottom margin lets the portrait bleed into the
              // section's padding; overflow-hidden on the section clips it.
              // The photo is the tallest item in the row, so changing its
              // margin resizes the row and drags the carousel with it.
              // A transform lifts it on its own, leaving the layout alone.
              className="-ml-4 -mb-10 max-h-[36rem] w-full -translate-y-8 object-contain object-left-bottom"
            />
          </div>

          <div>
            <Carousel
              slides={CAROUSEL_SLIDES}
              interval={5000}
              fit="contain"
              // Arrows off — the dots below still give manual control, so the
              // posters aren't left autoplay-only.
              showArrows={false}
              // Portrait-ish on mobile where the column is full width, wider on
              // desktop so the landscape brochure spreads stay legible.
              aspectClassName="aspect-[3/4] sm:aspect-[4/3]"
              label="Course promotions"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
