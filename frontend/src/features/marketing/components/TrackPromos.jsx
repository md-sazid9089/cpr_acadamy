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
    gradient: 'from-brand-50 via-brand-100/60 to-emerald-50',
    darkGradient: 'dark:from-brand-950 dark:via-brand-900/40 dark:to-brand-950',
    icon: '📚',
  },
  {
    id: 'bcs',
    badge: 'BCS Health',
    badgeColor: 'bg-sky-500 text-white',
    headline: 'আপনি কি বিসিএস নিয়ে ভাবছেন?',
    subtitle: 'BCS (Health) written & viva preparation',
    cta: 'See Batches',
    ctaTo: '/batches',
    gradient: 'from-sky-50 via-blue-50/60 to-indigo-50',
    darkGradient: 'dark:from-sky-950 dark:via-blue-950/40 dark:to-indigo-950',
    icon: '🏥',
  },
  {
    id: 'mbbs',
    badge: 'MBBS',
    badgeColor: 'bg-amber-500 text-white',
    headline: 'MBBS Professional পরীক্ষার প্রস্তুতি নিন',
    subtitle: '1st–4th professional exam coaching',
    cta: 'See Batches',
    ctaTo: '/batches?group=bmdc-licensing',
    gradient: 'from-amber-50 via-yellow-50/60 to-orange-50',
    darkGradient: 'dark:from-amber-950 dark:via-yellow-950/40 dark:to-orange-950',
    icon: '🩺',
  },
  {
    id: 'guidance',
    badge: 'Career',
    badgeColor: 'bg-rose-500 text-white',
    headline: 'ক্যারিয়ার গাইডলাইন নিয়ে চিন্তিত?',
    subtitle: 'Free consultation with our expert mentors',
    cta: 'পরামর্শ নিন',
    ctaTo: '/contact',
    gradient: 'from-rose-50 via-pink-50/60 to-fuchsia-50',
    darkGradient: 'dark:from-rose-950 dark:via-pink-950/40 dark:to-fuchsia-950',
    icon: '💡',
  },
];

export default function TrackPromos() {
  return (
    <section className="bg-slate-50 py-10 sm:py-14 dark:bg-surface-dark/50">
      <div className="container-page">
        {/* 2 in a row on all viewports (grid-cols-2) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {TRACK_CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.ctaTo}
              className={`group relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br p-4 shadow-sm transition-all duration-300 hover:shadow-xl sm:min-h-[260px] sm:rounded-2xl sm:p-8 lg:p-10 ${card.gradient} ${card.darkGradient}`}
            >
              {/* Text content */}
              <div className="relative z-10 flex flex-1 flex-col">
                <span
                  className={`w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:px-3.5 sm:py-1 sm:text-xs ${card.badgeColor}`}
                >
                  {card.badge}
                </span>

                <h3
                  className="mt-2.5 text-xs font-extrabold leading-tight tracking-tight text-slate-800 sm:mt-4 sm:text-xl lg:text-2xl dark:text-white"
                  lang="bn"
                >
                  {card.headline}
                </h3>

                {card.subtitle && (
                  <p className="mt-1 hidden text-[11px] font-medium tracking-wide text-slate-500 sm:mt-2 sm:block sm:text-sm lg:text-base dark:text-slate-400">
                    {card.subtitle}
                  </p>
                )}
              </div>

              {/* CTA button */}
              <div className="relative z-10 mt-3 sm:mt-6">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors group-hover:bg-brand-600 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm dark:bg-white dark:text-slate-900 dark:group-hover:bg-brand-400">
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

              {/* Decorative icon */}
              <div className="pointer-events-none absolute -bottom-2 -right-2 select-none text-4xl opacity-20 transition-transform duration-300 group-hover:scale-110 sm:-bottom-3 sm:-right-3 sm:text-8xl lg:text-9xl">
                {card.icon}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
