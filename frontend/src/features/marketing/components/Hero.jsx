import Carousel from '@/components/ui/Carousel.jsx';
import HeroOfferCard from './HeroOfferCard.jsx';

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

/**
 * Featured promo shown beside the carousel.
 * TODO: source this from the announcements/offers endpoint so marketing can
 * change it without a deploy. `ctaTo` can point at a category (e.g.
 * '/courses/fcps') when the promo is track-specific.
 */
const FEATURED_OFFER = {
  badge: 'Admission open',
  title: 'FCPS Part-1 (June 2026) & Residency (November 2026)',
  highlight: 'Offline combined batch · starts 10 January 2026',
  bullets: [
    'FCPS Part-1: Medicine, Surgery, Paediatrics, Gynae & allied',
    'Residency: MS, Paediatrics, Medicine MD, Basic & Dentistry',
    'Radiology and Dermatology faculties included',
    'Chattogram campus — Moti Tower, Chawkbazar',
  ],
  ctaLabel: 'Enroll Now',
  ctaTo: '/courses/fcps',
  footnote: 'Limited seats · admission closes once the batch fills',
};

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
  return (
    <section className="relative isolate overflow-hidden bg-white dark:bg-surface-dark">



      <div className="container-page py-6 lg:py-10">
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
            className="mb-6 text-center text-2xl font-bold text-slate-800 sm:text-3xl lg:mb-8 dark:text-slate-200"
          >
            {renderWelcome(welcomeText, welcomeHighlight)}
          </h2>
        )}

        {/* Primary row: poster carousel + featured offer. Stacks on mobile. */}
        <div className="grid items-stretch gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Carousel
              slides={CAROUSEL_SLIDES}
              interval={5000}
              fit="contain"
              // Portrait-ish on mobile where the column is full width, wider on
              // desktop so the landscape brochure spreads stay legible.
              aspectClassName="aspect-[3/4] sm:aspect-[4/3]"
              label="Course promotions"
            />
          </div>

          <div className="lg:col-span-2">
            <HeroOfferCard {...FEATURED_OFFER} />
          </div>
        </div>

      </div>
    </section>
  );
}
