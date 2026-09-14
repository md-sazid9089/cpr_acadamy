import { Link } from 'react-router-dom';

/**
 * Promotional track cards — 2-in-a-row on mobile and 2-column on desktop.
 */

const TRACK_CARDS = [
  {
    id: 'fcps',
    badge: 'FCPS',
    badgeColor: 'bg-brand-600 text-white',
    headline: 'FCPS Part-1 ও Residency-র প্রস্তুতি নিতে চান?',
    subtitle: 'Phase A & B, Combined Batch — Online & Offline',
    cta: 'See Batches',
    ctaTo: '/batches?group=fcps-p1-medicine',
  },
  {
    id: 'bcs',
    badge: 'BCS Health',
    badgeColor: 'bg-brand-500 text-white',
    headline: 'আপনি কি বিসিএস নিয়ে ভাবছেন?',
    subtitle: 'BCS (Health) written & viva preparation',
    cta: 'See Batches',
    ctaTo: '/batches',
  },
  {
    id: 'mbbs',
    badge: 'MBBS',
    badgeColor: 'bg-brand-100 text-brand-700',
    headline: 'MBBS Professional পরীক্ষার প্রস্তুতি নিন',
    subtitle: '1st–4th professional exam coaching',
    cta: 'See Batches',
    ctaTo: '/batches?group=bmdc-licensing',
  },
  {
    id: 'guidance',
    badge: 'Career',
    badgeColor: 'bg-brand-800 text-white',
    headline: 'ক্যারিয়ার গাইডলাইন নিয়ে চিন্তিত?',
    subtitle: 'Free consultation with our expert mentors',
    cta: 'পরামর্শ নিন',
    ctaTo: '/contact',
  },
];

export default function TrackPromos() {
  return (
    <section className="relative isolate overflow-hidden bg-surface-subtle py-10 sm:py-14 dark:bg-surface-dark">
      <img
        src="/assets/bg/1103999_7626-1920.webp"
        srcSet="/assets/bg/1103999_7626-768.webp 768w, /assets/bg/1103999_7626-1920.webp 1920w"
        sizes="100vw"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-40 dark:opacity-20"
      />
      <div className="container-page">
        {/* 2 in a row on all viewports (grid-cols-2) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {TRACK_CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.ctaTo}
              className="group relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-card bg-white p-4 border border-stone-200 transition-colors duration-300 sm:min-h-[260px] sm:p-8 lg:p-10 dark:bg-surface-dark"
            >
              {/* Text content */}
              <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:px-3.5 sm:py-1 sm:text-xs ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                  <img
                    src="/assets/bg/Medicine-amico.svg"
                    alt=""
                    aria-hidden="true"
                    width={500}
                    height={500}
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none h-16 w-16 shrink-0 object-contain sm:h-24 sm:w-24"
                  />
                </div>

                <h3
                  className="mt-2.5 text-xs font-extrabold leading-tight tracking-tight text-stone-800 sm:mt-4 sm:text-xl lg:text-2xl dark:text-white"
                  lang="bn"
                >
                  {card.headline}
                </h3>

                {card.subtitle && (
                  <p className="mt-1 hidden text-[11px] font-medium tracking-wide text-stone-500 sm:mt-2 sm:block sm:text-sm lg:text-base dark:text-brand-200">
                    {card.subtitle}
                  </p>
                )}
              </div>

              {/* CTA button */}
              <div className="relative z-10 mt-3 sm:mt-6">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-control bg-brand-700 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors group-hover:bg-brand-800 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm">
                  <span>{card.cta}</span>
                  <svg
                    className="h-3 w-3 sm:h-4 sm:w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </div>

            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
