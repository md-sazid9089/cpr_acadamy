import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { CATEGORY_SLUGS } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';

/** Gradient backdrop for each track — matches the brand palette. */
const CATEGORY_GRADIENTS = {
  FCPS: 'from-brand-600 via-brand-700 to-brand-800',
  BCS: 'from-brand-500 via-brand-600 to-brand-700',
  MBBS: 'from-accent-700 via-brand-700 to-brand-800',
};

/**
 * Course card — overlapping profile-card style, matching the Mentor card.
 *
 * Structure:
 *   ┌──────────────────────────┐
 *   │  Gradient / thumbnail    │  ← rounded wrapper
 *   │                          │
 *   │   [Category]   [Offer]   │  ← badge overlays
 *   │                          │
 *   ├──────────────────────────┤
 *   │  ┌──────────────────┐    │  ← floating white badge (overlaps)
 *   │  │ Title            │    │
 *   │  │ Subtitle         │    │
 *   │  │ Price  ·  Starts │    │
 *   │  │ [Details] [Enrol]│    │
 *   │  └──────────────────┘    │
 *   └──────────────────────────┘
 *
 * @param {{ course: import('@/types').Course, onEnroll?: (course: any) => void }} props
 */
export default function CourseCard({ course, onEnroll }) {
  const detailPath = `/courses/${CATEGORY_SLUGS[course.category]}/${course.slug}`;
  const hasDiscount = Boolean(course.discountPrice);

  return (
    <div className="group relative pb-20">
      {/* ── Gradient / thumbnail wrapper ── */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-[1.02] ${
          CATEGORY_GRADIENTS[course.category] ?? CATEGORY_GRADIENTS.FCPS
        }`}
      >
        {/* Thumbnail image or branded fallback */}
        <div className="aspect-[4/3]">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-3xl font-extrabold tracking-tight text-white/90">
                {course.category}
              </span>
              <span className="text-sm font-medium text-white/60">
                {course.duration}
              </span>
            </div>
          )}
        </div>

        {/* Badge overlays — bottom of the gradient area */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <Badge tone="brand" className="bg-white/90 text-brand-800 ring-white/40">
            {course.category}
          </Badge>
          {hasDiscount && (
            <Badge tone="warning" className="bg-amber-400/95 text-amber-950 ring-amber-200/50">
              Offer running
            </Badge>
          )}
        </div>
      </div>

      {/* ── Floating info badge — overlaps the bottom of the gradient card ── */}
      <div className="absolute bottom-0 left-2 right-2 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-lg dark:border-slate-800 dark:bg-surface-dark dark:shadow-slate-950/50">
        <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {course.subtitle}
        </p>

        {/* Price + start date */}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-brand-700 dark:text-brand-400">
            {formatBDT(hasDiscount ? course.discountPrice : course.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through dark:text-slate-500">
              {formatBDT(course.price)}
            </span>
          )}
          {course.startsOn && (
            <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500">
              Starts {formatDate(course.startsOn)}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button to={detailPath} variant="outline" size="sm" fullWidth>
            Details
          </Button>
          <Button size="sm" fullWidth onClick={() => onEnroll?.(course)}>
            Enrol Now
          </Button>
        </div>
      </div>
    </div>
  );
}
