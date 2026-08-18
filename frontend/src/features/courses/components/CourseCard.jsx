import Card from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import { CATEGORY_SLUGS } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';

/** Decorative banner used until real thumbnails are uploaded. */
const CATEGORY_GRADIENTS = {
  // Navy depths keep the three tracks distinguishable; MBBS carries the red
  // accent so the palette's action colour appears once, not on every card.
  FCPS: 'from-brand-600 to-brand-800',
  BCS: 'from-brand-500 to-brand-700',
  MBBS: 'from-accent-700 to-brand-800',
};

/**
 * Course card: banner, category badge, title, USP bullets, price, and the
 * Details / Enrol action pair.
 *
 * @param {{ course: import('@/types').Course, onEnroll?: (course: any) => void }} props
 */
export default function CourseCard({ course, onEnroll }) {
  const detailPath = `/courses/${CATEGORY_SLUGS[course.category]}/${course.slug}`;
  const hasDiscount = Boolean(course.discountPrice);

  return (
    <Card hoverable className="flex h-full flex-col overflow-hidden">
      <div
        className={`relative flex h-40 items-end bg-gradient-to-br p-4 ${
          CATEGORY_GRADIENTS[course.category] ?? CATEGORY_GRADIENTS.FCPS
        }`}
      >
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}

        <div className="relative flex w-full items-center justify-between">
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

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-white">
          {course.title}
        </h3>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{course.subtitle}</p>

        <ul className="mt-4 space-y-2">
          {course.highlights.slice(0, 5).map((highlight) => (
            <li key={highlight} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
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
              {highlight}
            </li>
          ))}
        </ul>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center dark:border-slate-800">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Duration</dt>
            <dd className="text-sm font-semibold text-slate-700 dark:text-slate-200">{course.duration}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Lessons</dt>
            <dd className="text-sm font-semibold text-slate-700 dark:text-slate-200">{course.lessonCount}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Enrolled</dt>
            <dd className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {course.enrolledCount.toLocaleString('en-BD')}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-brand-700 dark:text-brand-400">
            {formatBDT(hasDiscount ? course.discountPrice : course.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-500 line-through dark:text-slate-400">
              {formatBDT(course.price)}
            </span>
          )}
          {course.startsOn && (
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
              Starts {formatDate(course.startsOn)}
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button to={detailPath} variant="outline" fullWidth>
            Details
          </Button>
          <Button fullWidth onClick={() => onEnroll?.(course)}>
            Enrol Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
