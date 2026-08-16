/**
 * Four-icon value-prop strip shown just below the hero.
 *
 * Each item is an SVG icon on a soft grey tile with a Bengali caption beneath.
 * The row summarises the academy's core selling points at a glance — visitors
 * who don't scroll past the fold still absorb the positioning.
 *
 * Language is intentionally Bengali-only: the target audience is Bangladeshi
 * doctors and the captions are short enough that a translation toggle would add
 * clutter without adding clarity.
 */

const PROPS = [
  {
    label: 'ভর্তি পরীক্ষার পূর্ণ প্রস্তুতি',
    /** Crossed pencil + ruler — exam prep. */
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
           strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M21.17 2.83a2.83 2.83 0 0 0-4 0L3 17l-1 5 5-1L21.17 6.83a2.83 2.83 0 0 0 0-4Z" />
        <path d="m15 5 4 4" />
        <path d="M22.95 7.05 7.05 22.95" />
        <path d="M1.05 16.95 16.95 1.05" />
      </svg>
    ),
  },
  {
    label: 'বিষয়ভিত্তিক সহজবোধ্য ও কার্যকরী পাঠদান',
    /** Brain — subject-wise teaching. */
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
           strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z" />
        <path d="M9 21h6" />
        <path d="M12 2v6" />
        <path d="m8 8 4 4 4-4" />
      </svg>
    ),
  },
  {
    label: 'নিয়মিত মডেল টেস্ট এবং ফলাফল বিশ্লেষণ',
    /** Clipboard with checklist — model tests & result analysis. */
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
           strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M9 2v2h6V2" />
        <path d="M9 10h1" />
        <path d="M13 10h2" />
        <path d="M9 14h1" />
        <path d="M13 14h2" />
        <path d="M9 18h1" />
        <path d="M13 18h2" />
      </svg>
    ),
  },
  {
    label: 'পরামর্শ ও গাইডলাইন',
    /** Graduation cap on person — counselling & guidance. */
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
           strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M2 10l10-5 10 5-10 5Z" />
        <path d="M22 10v6" />
        <path d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5" />
      </svg>
    ),
  },
];

export default function ValueProps() {
  return (
    <section lang="bn" className="bg-white py-8 dark:bg-surface-dark">
      <div className="container-page">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-10">
          {PROPS.map(({ label, icon }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80 text-brand-700 dark:bg-slate-700/50 dark:text-brand-300">
                {icon}
              </span>
              <p className="mt-3 text-sm font-semibold leading-snug text-slate-700 dark:text-slate-300">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
