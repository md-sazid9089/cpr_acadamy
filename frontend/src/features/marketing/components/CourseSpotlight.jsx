import { useState } from 'react';
import Button from '@/components/ui/Button.jsx';
import { cn } from '@/lib/utils';

/**
 * Promotional spotlight band: two-part heading, sign-in/registration actions, a
 * two-column checklist, a price line and an enrol CTA, with a cutout portrait
 * bleeding off the right edge on desktop.
 *
 * Nothing here is course-specific — the caller supplies every string, so the
 * same section can front FCPS, BCS or MBBS.
 *
 * Colours stay entirely within the white/green theme: emphasis (second heading
 * line, price, offer note) uses `brand`, and the only non-brand element is the
 * neutral slate Sign In button, which gives the action pair some contrast
 * without introducing a third hue.
 *
 * @param {Object} props
 * @param {string} props.titleLine1   Bold primary heading line.
 * @param {string} props.titleLine2   Second line, rendered in the accent colour.
 * @param {string} [props.subtitle]
 * @param {string[]} [props.checklistItems]  Auto-split across two columns on desktop.
 * @param {string|number} [props.price]
 * @param {string} [props.currency]   Prefix for the price, e.g. '৳'.
 * @param {string} [props.offerNote]  Small urgency line under the price.
 * @param {string} [props.enrollHref] Router path for the Enroll CTA.
 * @param {string} [props.imageSrc]   Cutout portrait; falls back to a neutral panel.
 * @param {string} [props.imageAlt]
 * @param {string} [props.signInHref]
 * @param {string} [props.registerHref]
 */
export default function CourseSpotlight({
  titleLine1,
  titleLine2,
  subtitle,
  checklistItems = [],
  price,
  currency = '৳',
  offerNote,
  enrollHref = '/courses',
  imageSrc,
  imageAlt = '',
  signInHref = '/login',
  registerHref = '/register',
  className,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageSrc) && !imageFailed;

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-white dark:bg-surface-dark',
        className,
      )}
    >
      <div className="container-page">
        {/* Single column until there's an image to sit beside — otherwise a
            missing asset leaves half the band empty. */}
        <div className={cn('grid items-center gap-10', showImage && 'lg:grid-cols-2')}>
          {/*
            RESPONSIVE CHOICE: on mobile the portrait stacks ABOVE the copy
            rather than being hidden — it is the section's visual hook, and
            hiding it leaves a wall of text. Its height is capped so the
            Sign In / Registration buttons still land near the fold.
            Flip `order-first` to `hidden` here if you'd rather drop it on
            small screens.
          */}
          {showImage && (
            <div
              className={cn(
                'order-first flex justify-center lg:order-none',
                // Desktop: break out of the grid and bleed to the section edge.
                'lg:absolute lg:inset-y-0 lg:right-0 lg:w-[46%] lg:justify-end',
              )}
            >
              <img
                src={imageSrc}
                alt={imageAlt}
                loading="lazy"
                onError={() => setImageFailed(true)}
                className="h-52 w-auto object-contain object-bottom sm:h-64 lg:h-full lg:w-full lg:object-right-bottom"
              />
            </div>
          )}

          <div className="py-10 lg:py-14">
            <h2 className="text-2xl font-extrabold uppercase leading-tight tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {titleLine1}
              <span className="mt-1 block text-brand-600 dark:text-brand-400">{titleLine2}</span>
            </h2>

            {subtitle && (
              <p className="mt-3 text-base text-slate-600 dark:text-slate-400">{subtitle}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button to={signInHref} variant="contrast" size="lg">
                Sign In
              </Button>
              <Button to={registerHref} size="lg">
                Registration
              </Button>
            </div>

            {checklistItems.length > 0 && (
              <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {checklistItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300"
                  >
                    {/* Radio-style bullet rather than a checkmark. */}
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 dark:border-brand-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {price != null && (
              <div className="mt-8">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Available{' '}
                  <span className="text-brand-600 dark:text-brand-400">
                    {currency}
                    {typeof price === 'number' ? price.toLocaleString('en-BD') : price}
                  </span>
                </p>
                {offerNote && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                    {offerNote}
                  </p>
                )}
              </div>
            )}

            <Button to={enrollHref} size="lg" className="mt-6">
              Enroll Now
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5l10 7-10 7z" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
