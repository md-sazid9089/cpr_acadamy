import { Link } from 'react-router-dom';
import { FaGraduationCap, FaArrowRightLong } from 'react-icons/fa6';
import { BATCH_GROUPS } from '@/constants';
import { cn } from '@/lib/utils';

function groupHref(group) {
  return `/batches?group=${group.id}`;
}

/**
 * Batch-group chooser — 2-column responsive layout matching Genesis.
 *
 * @param {Object} props
 * @param {string} [props.category]
 * @param {Record<string, number>} [props.counts]
 * @param {string} [props.className]
 */
export default function BatchGroupGrid({ category, counts, className }) {
  const groups = category
    ? BATCH_GROUPS.filter((group) => group.category === category)
    : BATCH_GROUPS;

  if (!groups.length) return null;

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {groups.map((group, index) => {
        const isOddTotal = groups.length % 2 !== 0;
        const isLastOdd = isOddTotal && index === groups.length - 1;

        return (
          <Link
            key={group.id}
            to={groupHref(group)}
            className={cn(
              'group flex h-full min-h-[120px] flex-col items-center justify-between rounded-xl border border-brand-400 bg-white p-3.5 text-center shadow-sm transition-all duration-200 sm:min-h-[140px] sm:p-5',
              'hover:-translate-y-1 hover:border-brand-600 hover:shadow-md',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              'dark:border-slate-700 dark:bg-surface-dark-subtle dark:hover:border-brand-500 dark:hover:bg-slate-900',
              // On 2-col mobile view, center the last odd item (BMDC Licensing)
              isLastOdd &&
                'col-span-2 w-full max-w-[calc(50%-0.375rem)] mx-auto md:col-span-1 md:max-w-none',
            )}
          >
            <div className="flex w-full flex-col items-center">
              <FaGraduationCap
                aria-hidden="true"
                className="h-7 w-7 text-brand-600 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8 dark:text-brand-400"
              />

              <h3 className="mt-2 text-xs font-bold text-brand-900 sm:text-sm md:text-base dark:text-brand-200">
                {group.label}
              </h3>

              {group.note && (
                <p className="mt-1 text-[10px] leading-snug text-slate-500 sm:text-[11px] dark:text-slate-400">
                  {group.note}
                </p>
              )}

              {counts?.[group.id] != null && counts[group.id] > 0 && (
                <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                  {counts[group.id]} {counts[group.id] === 1 ? 'batch' : 'batches'}
                </p>
              )}
            </div>

            <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-700 group-hover:text-brand-900 sm:mt-3 sm:text-xs dark:text-brand-400 dark:group-hover:text-brand-300">
              ব্যাচগুলো দেখুন
              <FaArrowRightLong
                aria-hidden="true"
                className="h-2.5 w-2.5 transition-transform duration-200 group-hover:translate-x-1"
              />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
