import Button from '@/components/ui/Button.jsx';
import Card from '@/components/ui/Card.jsx';
import { cn } from '@/lib/utils';

/**
 * Spotlight card beside the hero carousel: badge, title, a highlighted stat or
 * discount line, a short checklist, and one CTA.
 *
 * Every piece of content is a prop so a promo can be swapped — or driven per
 * slide — without touching this component. It builds on the shared Card
 * primitive, so its surface matches every other card on the site in both
 * themes.
 *
 * @param {Object} props
 * @param {string} props.badge      Small label above the title.
 * @param {string} props.title      Course or batch name.
 * @param {string} [props.highlight] Discount or key stat, rendered prominently.
 * @param {string[]} [props.bullets] 3–5 checklist items.
 * @param {string} [props.ctaLabel]
 * @param {string} [props.ctaTo]    Router path, e.g. '/courses' or '/courses/fcps'.
 * @param {string} [props.footnote] Small print under the CTA.
 */
export default function HeroOfferCard({
  badge = 'Featured Batch',
  title,
  highlight,
  bullets = [],
  ctaLabel = 'Enroll Now',
  ctaTo = '/courses',
  footnote,
  className,
}) {
  return (
    <Card className={cn('flex h-full w-full flex-col p-6', className)}>
      <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/20 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-400/20">
        {badge}
      </span>

      <p className="mt-4 text-xl font-bold leading-snug text-slate-900 dark:text-white">{title}</p>

      {highlight && (
        <p className="mt-2 text-base font-semibold text-brand-700 dark:text-brand-400">{highlight}</p>
      )}

      {bullets.length > 0 && (
        // flex-1 lets the CTA sit against the bottom edge on tall layouts.
        <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
          {bullets.map((item) => (
            <li key={item} className="flex items-start gap-2">
              {/* Same checkmark treatment as the hero trust row. */}
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      )}

      {/* Button renders a router <Link> when given `to` — the codebase's
          standard internal-navigation pattern. */}
      <Button to={ctaTo} size="lg" fullWidth className="mt-6">
        {ctaLabel}
      </Button>

      {footnote && (
        <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">{footnote}</p>
      )}
    </Card>
  );
}
