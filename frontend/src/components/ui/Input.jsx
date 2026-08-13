import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

const fieldStyles =
  'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'transition-colors focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 ' +
  'dark:bg-surface-dark-subtle dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900';

/** Text input with label, hint, prefix and error slot. Forwards refs for RHF. */
const Input = forwardRef(function Input(
  { label, hint, error, prefix, className, containerClassName, id, required, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 dark:text-slate-400">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            fieldStyles,
            prefix && 'pl-14',
            error
              ? 'border-red-400 focus:border-red-500 dark:border-red-500/70'
              : 'border-slate-300 dark:border-slate-700',
            className,
          )}
          {...props}
        />
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

/** Multi-line sibling of Input, sharing its label/error chrome. */
export const Textarea = forwardRef(function Textarea(
  { label, hint, error, className, containerClassName, id, required, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          fieldStyles,
          'resize-y',
          error ? 'border-red-400 dark:border-red-500/70' : 'border-slate-300 dark:border-slate-700',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
});

/** Native select styled to match Input. */
export const Select = forwardRef(function Select(
  { label, error, children, className, containerClassName, id, required, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          fieldStyles,
          error ? 'border-red-400 dark:border-red-500/70' : 'border-slate-300 dark:border-slate-700',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});

export default Input;
