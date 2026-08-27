import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { CATEGORY_SLUGS } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';

/** Fallback poster collection */
const POSTERS = [
  '/assets/carousel/postera.jpeg',
  '/assets/carousel/posterb.jpeg',
  '/assets/carousel/posterc.jpeg',
  '/assets/carousel/posterd.jpeg',
  '/assets/carousel/postere.jpeg',
  '/assets/carousel/posterf.jpeg',
];

/** Gradient backdrop for each track — matches the brand palette. */
const CATEGORY_GRADIENTS = {
  FCPS: 'from-brand-600 via-brand-700 to-brand-800',
  BCS: 'from-brand-500 via-brand-600 to-brand-700',
  MBBS: 'from-accent-700 via-brand-700 to-brand-800',
};

/**
 * Course card — compact floating info badge to keep the poster artwork clearly visible.
 *
 * @param {{ course: import('@/types').Course, onEnroll?: (course: any) => void }} props
 */
export default function CourseCard({ course, onEnroll }) {
  const detailPath = `/courses/${CATEGORY_SLUGS[course.category] || 'fcps'}/${course.slug}`;
  const hasDiscount = Boolean(course.discountPrice);

  // Deterministic fallback poster based on course id
  const charCode = course.id ? course.id.charCodeAt(course.id.length - 1) : 0;
  const posterSrc = course.thumbnailUrl || POSTERS[charCode % POSTERS.length];

  return (
    <div className="group relative pb-14 sm:pb-16">
      {/* ── Gradient / poster thumbnail wrapper ── */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-[1.02] ${
          CATEGORY_GRADIENTS[course.category] ?? CATEGORY_GRADIENTS.FCPS
        }`}
      >
        {/* Poster image with spacious square aspect ratio */}
        <div className="aspect-square w-full overflow-hidden bg-slate-800">
          <img
            src={posterSrc}
            alt={course.title}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Badge overlays — top of the image area so bottom poster content is unblocked */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <Badge tone="brand" className="bg-white/95 text-brand-800 shadow-sm ring-1 ring-white/50 backdrop-blur-sm">
            {course.category}
          </Badge>
          {hasDiscount && (
            <Badge tone="warning" className="bg-amber-400/95 font-bold text-amber-950 shadow-sm ring-1 ring-amber-200/50 backdrop-blur-sm">
              Offer running
            </Badge>
          )}
        </div>
      </div>

      {/* ── Compact floating info badge — overlaps minimally at the very bottom ── */}
      <div className="absolute bottom-0 left-2.5 right-2.5 rounded-xl border border-slate-100 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:left-3 sm:right-3 sm:p-3.5 dark:border-slate-800 dark:bg-surface-dark/95 dark:shadow-slate-950/50">
        <h3 className="line-clamp-1 text-xs font-bold leading-tight text-slate-900 sm:text-sm dark:text-white">
          {course.title}
        </h3>
        
        {course.subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
            {course.subtitle}
          </p>
        )}

        {/* Price + start date */}
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-extrabold text-brand-700 sm:text-base dark:text-brand-400">
            {formatBDT(hasDiscount ? course.discountPrice : course.price)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-slate-400 line-through sm:text-xs dark:text-slate-500">
              {formatBDT(course.price)}
            </span>
          )}
          {course.startsOn && (
            <span className="ml-auto text-[10px] text-slate-400 sm:text-[11px] dark:text-slate-500">
              Starts {formatDate(course.startsOn)}
            </span>
          )}
        </div>

        {/* Compact action buttons */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Button to={detailPath} variant="outline" size="sm" className="py-1 text-xs" fullWidth>
            Details
          </Button>
          <Button size="sm" className="py-1 text-xs" fullWidth onClick={() => onEnroll?.(course)}>
            Enrol Now
          </Button>
        </div>
      </div>
    </div>
  );
}
