import { useId, useState } from 'react';
import { FaChevronUp, FaSliders, FaXmark } from 'react-icons/fa6';
import { BATCH_BRANCHES, BATCH_SESSIONS, BATCH_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

/**
 * The three facets rendered in the sidebar, in display order. Keeping this as
 * data means adding a facet is a constants change plus one line here.
 */
const FACETS = [
  { key: 'batchTypes', title: 'Batch Type', options: BATCH_TYPES },
  { key: 'sessions', title: 'Session', options: BATCH_SESSIONS },
  { key: 'branches', title: 'Branch', options: BATCH_BRANCHES },
];

/** Toggle one id in/out of a selection array without mutating it. */
function toggle(selected = [], id) {
  return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
}

/**
 * Faceted filter sidebar for the Batches page.
 *
 * @param {Object} props
 * @param {{ batchTypes?: string[], sessions?: string[], branches?: string[] }} props.value
 * @param {(next: object) => void} props.onChange  Receives the whole next value.
 * @param {() => void} [props.onClear]
 * @param {string} [props.className]
 */
export default function BatchFilters({ value = {}, onChange, onClear, className }) {
  // Collapsed by default on small screens, where the sidebar would otherwise
  // push the results a full screen down.
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = FACETS.reduce((total, facet) => total + (value[facet.key]?.length ?? 0), 0);

  const handleToggle = (facetKey, optionId) => {
    onChange?.({ ...value, [facetKey]: toggle(value[facetKey], optionId) });
  };

  return (
    <div className={className}>
      {/* Mobile trigger — the panel below is always rendered for desktop. */}
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        className="mb-4 flex w-full items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 lg:hidden dark:border-slate-800 dark:bg-surface-dark-subtle dark:text-brand-300"
      >
        <span className="flex items-center gap-2">
          <FaSliders aria-hidden="true" className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          )}
        </span>
        <FaChevronUp
          aria-hidden="true"
          className={cn('h-3.5 w-3.5 transition-transform', !mobileOpen && 'rotate-180')}
        />
      </button>

      <div className={cn('space-y-4', !mobileOpen && 'hidden lg:block')}>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-accent-300 hover:text-accent-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-accent-800 dark:hover:text-accent-400"
          >
            <FaXmark aria-hidden="true" className="h-3.5 w-3.5" />
            Clear {activeCount} {activeCount === 1 ? 'filter' : 'filters'}
          </button>
        )}

        {FACETS.map((facet) => (
          <FilterSection
            key={facet.key}
            title={facet.title}
            options={facet.options}
            selected={value[facet.key] ?? []}
            onToggle={(optionId) => handleToggle(facet.key, optionId)}
          />
        ))}
      </div>
    </div>
  );
}

/** One collapsible facet panel with its checkbox list. */
function FilterSection({ title, options, selected, onToggle }) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white dark:border-slate-800 dark:bg-surface-dark-subtle">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex w-full items-center justify-between gap-3 bg-brand-50 px-4 py-3 text-left text-sm font-bold text-brand-800 transition-colors hover:bg-brand-100 dark:bg-slate-900/60 dark:text-brand-300 dark:hover:bg-slate-900"
        >
          <span className="flex items-center gap-2">
            {title}
            {selected.length > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                {selected.length}
              </span>
            )}
          </span>
          <FaChevronUp
            aria-hidden="true"
            className={cn('h-3 w-3 shrink-0 transition-transform duration-200', !open && 'rotate-180')}
          />
        </button>
      </h3>

      {open && (
        <ul id={bodyId} className="space-y-1 p-3">
          {options.map((option) => {
            const isChecked = selected.includes(option.id);
            return (
              <li key={option.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors',
                    'hover:bg-brand-50 dark:hover:bg-slate-900',
                    isChecked
                      ? 'font-semibold text-brand-800 dark:text-brand-300'
                      : 'text-slate-700 dark:text-slate-300',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(option.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span className="leading-snug">{option.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
