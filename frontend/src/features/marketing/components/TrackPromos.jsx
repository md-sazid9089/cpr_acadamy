import { Link } from 'react-router-dom';

/**
 * Promotional track cards — 2×2 grid of soft-gradient banners, each
 * nudging the visitor toward a specific examination track or service.
 *
 * Layout: badge (top-left), Bangla headline, optional English subtitle,
 * CTA button — all left-aligned. A decorative emoji/icon sits on the right.
 */

const TRACK_CARDS = [
  {
    id: 'fcps',
    badge: 'FCPS',
    badgeColor: 'bg-brand-600 text-white',
    headline: 'FCPS Part-1 ও Residency-র প্রস্তুতি নিতে চান?',
    subtitle: 'Phase A & B, Combined Batch — Online & Offline',
    cta: 'See Batches',
    ctaTo: '/courses/fcps',
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
    ctaTo: '/courses/bcs',
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
    ctaTo: '/courses/mbbs',
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
    <section className="bg-slate-50 py-14 dark:bg-surface-dark/50">
      <div className="container-page">
        <div className="grid gap-5 sm:grid-cols-2">
          {TRACK_CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.ctaTo}
              className={`group relative flex min-h-[240px] overflow-hidden rounded-2xl bg-gradient-to-br p-8 transition-shadow duration-300 hover:shadow-xl sm:min-h-[260px] sm:p-10 ${card.gradient} ${card.darkGradient}`}
            >
              {/* Text content — left side */}
              <div className="relative z-10 flex flex-1 flex-col">
                <span
                  className={`w-fit rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${card.badgeColor}`}
                >
                  {card.badge}
                </span>

                <h3
                  className="mt-4 text-xl font-extrabold leading-tight tracking-tight text-slate-800 sm:text-2xl lg:text-[1.65rem] dark:text-white"
                  lang="bn"
                >
                  {card.headline}
                </h3>

                {card.subtitle && (
                  <p className="mt-2 text-sm font-medium tracking-wide text-slate-500 sm:text-base dark:text-slate-400">
                    {card.subtitle}
                  </p>
                )}

                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold tracking-wide text-white transition-colors group-hover:bg-brand-600 dark:bg-white dark:text-slate-900 dark:group-hover:bg-brand-400">
                  {card.cta}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </div>

              {/* Decorative icon — right side */}
              <div className="pointer-events-none absolute -bottom-3 -right-3 select-none text-8xl opacity-25 transition-transform duration-300 group-hover:scale-110 sm:text-9xl">
                {card.icon}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
