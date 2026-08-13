import { COURSE_CATEGORIES } from '@/constants';
import { cn } from '@/lib/utils';

/**
 * Horizontal filter pills — 'ALL' plus the three fixed categories.
 *
 * @param {{ value: string, onChange: (next: string) => void, className?: string }} props
 */
export default function CategoryPills({ value = 'ALL', onChange, className, counts }) {
  const options = ['ALL', ...COURSE_CATEGORIES];

  return (
    <div
      role="tablist"
      aria-label="Course categories"
      className={cn('flex flex-wrap items-center justify-center gap-2', className)}
    >
      {options.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(option)}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-950 dark:hover:text-brand-300',
            )}
          >
            {option === 'ALL' ? 'All Courses' : option}
            {counts?.[option] != null && (
              <span className={cn('ml-2 text-xs', isActive ? 'text-brand-100' : 'text-slate-400')}>
                {counts[option]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
