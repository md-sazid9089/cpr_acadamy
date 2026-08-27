import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import { formatUnlockDayShort } from '../utils/lessonState.js';
import { cn } from '@/lib/utils';

const BASE =
  'inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed dark:focus-visible:ring-offset-surface-dark';

/**
 * Previous / Next. Next has already been resolved past locked lessons by
 * useLessonNavigation; when nothing ahead is open it reports the unlock day
 * rather than going dead.
 *
 * @param {Object} props
 * @param {object|null} props.previousLesson
 * @param {object|null} props.nextLesson
 * @param {string|null} props.nextLockedAt
 * @param {(lesson: object) => void} props.onNavigate
 * @param {string} [props.className]
 */
export default function LessonNav({
  previousLesson,
  nextLesson,
  nextLockedAt,
  onNavigate,
  className,
}) {
  const nextLabel = nextLesson
    ? 'Next'
    : nextLockedAt
      ? `Next unlocks ${formatUnlockDayShort(nextLockedAt)}`
      : 'Next';

  return (
    <nav aria-label="Lesson navigation" className={cn('flex justify-end gap-3', className)}>
      <button
        type="button"
        onClick={() => previousLesson && onNavigate(previousLesson)}
        disabled={!previousLesson}
        className={cn(
          BASE,
          'border border-brand-600 text-brand-700 hover:bg-brand-50',
          'disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent',
          'dark:border-brand-500 dark:text-brand-300 dark:hover:bg-slate-800',
          'dark:disabled:border-slate-800 dark:disabled:text-slate-600',
        )}
      >
        <FaArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Previous
      </button>

      <button
        type="button"
        onClick={() => nextLesson && onNavigate(nextLesson)}
        disabled={!nextLesson}
        className={cn(
          BASE,
          'bg-brand-600 text-white hover:bg-brand-700',
          'disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200',
          'dark:disabled:bg-slate-800 dark:disabled:text-slate-500',
        )}
      >
        {nextLabel}
        {nextLesson && <FaArrowRight aria-hidden="true" className="h-3.5 w-3.5" />}
      </button>
    </nav>
  );
}
