import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

/**
 * Type chip. Quiz carries the red accent — it is one of only two places on this
 * page where red is allowed; everything else stays navy.
 */
const TYPE_CHIP = {
  video: { label: 'Video', className: 'bg-brand-50 text-brand-700 ring-brand-200' },
  quiz: { label: 'Exam', className: 'bg-accent-50 text-accent-700 ring-accent-200' },
  pdf: { label: 'Lecture sheet', className: 'bg-brand-50 text-brand-700 ring-brand-200' },
  text: { label: 'Reading', className: 'bg-brand-50 text-brand-700 ring-brand-200' },
};

/**
 * Back arrow, lesson title, type chip. Nothing else lives here.
 *
 * @param {{ title?: string, type?: string, isLoading?: boolean }} props
 */
export default function PlayerHeader({ title, type, isLoading }) {
  const chip = TYPE_CHIP[type];

  return (
    <header className="flex items-start gap-3">
      <Link
        to="/dashboard/courses"
        aria-label="Back to my courses"
        className={cn(
          'mt-0.5 shrink-0 rounded-lg p-2 text-brand-700 transition-colors duration-150 hover:bg-brand-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'dark:text-brand-300 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-surface-dark',
        )}
      >
        <FaArrowLeft aria-hidden="true" className="h-4 w-4" />
      </Link>

      {isLoading ? (
        <div className="h-7 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      ) : (
        <h1 className="line-clamp-2 min-w-0 flex-1 text-lg font-semibold leading-snug text-brand-800 sm:text-xl dark:text-white">
          {title}
        </h1>
      )}

      {chip && !isLoading && (
        <span
          className={cn(
            'mt-0.5 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1',
            chip.className,
          )}
        >
          {chip.label}
        </span>
      )}
    </header>
  );
}
