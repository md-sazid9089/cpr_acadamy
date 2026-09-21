import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { CATEGORY_SLUGS } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';
import ResponsiveImage, { localWebpSrcSet } from '@/components/ui/ResponsiveImage.jsx';

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
  MBBS: 'from-brand-600 via-brand-700 to-brand-800',
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
    <div className="group relative">
      {/* ── Gradient / poster thumbnail wrapper ── */}
      <div
        className={`relative overflow-hidden rounded-image bg-gradient-to-br border border-stone-200 transition-transform duration-300 group-hover:scale-[1.02] ${
          CATEGORY_GRADIENTS[course.category] ?? CATEGORY_GRADIENTS.FCPS
        }`}
      >
        {/* Poster image with spacious square aspect ratio */}
        <div className="aspect-square w-full overflow-hidden bg-stone-800">
          <ResponsiveImage
            src={posterSrc}
            webpSrcSet={localWebpSrcSet(posterSrc)}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            alt={course.title}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Badge overlays — top of the image area so bottom poster content is unblocked */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <Badge tone="brand" className="bg-white/95 text-brand-800 border border-stone-200 backdrop-blur-sm">
            {course.category}
          </Badge>
          {hasDiscount && (
            <Badge tone="warning" className="bg-brand-100 font-bold text-brand-800">
              Offer running
            </Badge>
          )}
        </div>
      </div>

      {/* ── Compact floating info badge — overlaps minimally at the very bottom ── */}
      <div className="relative mx-2.5 -mt-4 rounded-card border border-stone-200 bg-white/95 p-2.5 backdrop-blur-sm sm:mx-3 sm:p-3.5 dark:border-stone-200 dark:bg-surface-dark/95">
        <h3 className="line-clamp-1 text-xs font-bold leading-tight text-stone-900 sm:text-sm dark:text-white">
          {course.title}
        </h3>

        {course.subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-500 dark:text-brand-200">
            {course.subtitle}
          </p>
        )}

        {/* Price + start date */}
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-extrabold text-brand-700 sm:text-base dark:text-brand-400">
            {formatBDT(hasDiscount ? course.discountPrice : course.price)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-stone-400 line-through sm:text-xs dark:text-brand-200">
              {formatBDT(course.price)}
            </span>
          )}
          {course.startsOn && (
            <span className="ml-auto text-[10px] text-stone-400 sm:text-[11px] dark:text-brand-200">
              Starts {formatDate(course.startsOn)}
            </span>
          )}
        </div>

        {/* Compact action buttons */}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
          <Button to={detailPath} variant="outline" size="sm" className="order-2 sm:order-1" fullWidth>
            Details
          </Button>
          <Button size="sm" className="order-1 sm:order-2" fullWidth onClick={() => onEnroll?.(course)}>
            Enrol Now
          </Button>
        </div>
      </div>
    </div>
  );
}
