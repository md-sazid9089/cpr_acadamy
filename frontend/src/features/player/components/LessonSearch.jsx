import { useId } from 'react';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

/**
 * Lesson filter. Controlled by the sidebar so the expansion override and the
 * query stay in step.
 *
 * @param {{ value: string, onChange: (next: string) => void, autoFocus?: boolean }} props
 */
export default function LessonSearch({ value, onChange, autoFocus = false }) {
  const inputId = useId();

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search lessons
      </label>

      <FaMagnifyingGlass
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
      />

      <input
        id={inputId}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search lessons…"
        className={cn(
          'block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900',
          'placeholder:text-slate-400 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-slate-100',
          'dark:focus-visible:ring-offset-surface-dark',
          // The native clear affordance would sit under our own button.
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400',
            'transition-colors duration-150 hover:text-slate-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            'dark:hover:text-slate-200',
          )}
        >
          <FaXmark aria-hidden="true" className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
