import { Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa6';
import { formatUnlockLong } from '../../utils/lessonState.js';
import { cn } from '@/lib/utils';

/**
 * Shown instead of any content pane when the lesson has not been released.
 * The unlock moment is stated plainly on the page — not behind a tooltip.
 *
 * @param {{ lesson: object, scheduleHref: string }} props
 */
export default function LockedPane({ lesson, scheduleHref }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-surface-subtle px-6 py-16 text-center dark:border-slate-800 dark:bg-surface-dark-subtle">
      <FaLock aria-hidden="true" className="h-10 w-10 text-slate-400" />

      <p className="mt-5 text-base font-semibold text-slate-700 sm:text-lg dark:text-slate-200">
        Unlocks {formatUnlockLong(lesson.releaseAt)}
      </p>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Lessons open on the batch schedule.
      </p>

      <Link
        to={scheduleHref}
        className={cn(
          'mt-6 inline-flex min-h-[44px] items-center rounded-lg border border-brand-600 px-5',
          'text-sm font-semibold text-brand-700 transition-colors duration-150 hover:bg-brand-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'dark:border-brand-500 dark:text-brand-300 dark:hover:bg-slate-800',
          'dark:focus-visible:ring-offset-surface-dark',
        )}
      >
        View full schedule
      </Link>
    </div>
  );
}
