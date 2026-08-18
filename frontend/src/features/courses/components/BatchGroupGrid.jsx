import { Link } from 'react-router-dom';
import { FaGraduationCap, FaArrowRightLong } from 'react-icons/fa6';
import { BATCH_GROUPS, CATEGORY_SLUGS } from '@/constants';
import { cn } from '@/lib/utils';

/**
 * Build the link for one group card. The group lives as a query parameter so
 * the existing /courses/:category route keeps working and a filtered view stays
 * shareable.
 */
function groupHref(group) {
  return `/batches?group=${group.id}`;
}

/**
 * Batch-group chooser — category cards matching Genesis reference.
 *
 * @param {Object} props
 * @param {string} [props.category]  Restrict to one of COURSE_CATEGORIES.
 * @param {Record<string, number>} [props.counts]  group id → batch count.
 * @param {string} [props.className]
 */
export default function BatchGroupGrid({ category, counts, className }) {
  const groups = category
    ? BATCH_GROUPS.filter((group) => group.category === category)
    : BATCH_GROUPS;

  if (!groups.length) return null;

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {groups.map((group) => (
        <Link
          key={group.id}
          to={groupHref(group)}
          className={cn(
            'group flex min-h-[140px] flex-col items-center justify-between rounded-xl border border-brand-200 bg-white p-5 text-center shadow-sm transition-all duration-200',
            'hover:-translate-y-1 hover:border-brand-500 hover:shadow-md',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            'dark:border-slate-800 dark:bg-surface-dark-subtle dark:hover:border-brand-600 dark:hover:bg-slate-900',
          )}
        >
          <div className="flex flex-col items-center">
            <FaGraduationCap
              aria-hidden="true"
              className="h-8 w-8 text-brand-600 transition-transform duration-200 group-hover:scale-110 dark:text-brand-400"
            />

            <h3 className="mt-2.5 text-sm font-bold text-brand-900 sm:text-base dark:text-brand-200">
              {group.label}
            </h3>

            {group.note && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {group.note}
              </p>
            )}

            {counts?.[group.id] != null && counts[group.id] > 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {counts[group.id]} {counts[group.id] === 1 ? 'batch' : 'batches'}
              </p>
            )}
          </div>

          <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:text-brand-800 sm:text-sm dark:text-brand-400 dark:group-hover:text-brand-300">
            ব্যাচগুলো দেখুন
            <FaArrowRightLong
              aria-hidden="true"
              className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
