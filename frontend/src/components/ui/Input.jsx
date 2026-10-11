import { forwardRef, useId, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

const fieldStyles =
  'block min-h-[var(--control-height-medium)] w-full rounded-control border bg-white px-3 py-3 text-[15px] leading-[1.5] text-stone-900 placeholder:text-stone-400 ' +
  'transition-colors focus:border-stone-200 disabled:cursor-not-allowed disabled:bg-stone-50 ' +
  'dark:bg-surface-dark-subtle dark:text-brand-200 dark:placeholder:text-brand-200 dark:disabled:bg-surface-dark';

/** Border for a field with an error: red, so the field itself shows the problem, not only the message below it. */
const errorBorder = 'border-red-500 focus:border-red-500 dark:border-red-400';
const normalBorder = 'border-stone-200 dark:border-stone-200';

/** Text input with label, hint, prefix/suffix and error slot. Forwards refs for RHF.
 * A `type="password"` field always gets a show/hide toggle — permanent, not opt-in. */
const Input = forwardRef(function Input(
  { label, hint, error, prefix, suffix, type, className, containerClassName, id, required, maxLength, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const isPassword = type === 'password';
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-stone-700 dark:text-brand-200">
          {label}
          {required && <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-stone-500 dark:text-brand-200">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={isPassword ? (visible ? 'text' : 'password') : type}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            fieldStyles,
            prefix && 'pl-14',
            suffix && 'pr-12',
            isPassword && 'pr-11',
            error ? errorBorder : normalBorder,
            className,
          )}
          maxLength={maxLength ?? (isPassword ? 128 : type === 'email' ? 254 : type === 'tel' || type === 'number' ? 20 : 255)}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-stone-500 dark:text-brand-200">
            {suffix}
          </span>
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 transition-colors hover:text-stone-600 dark:text-brand-200 dark:hover:text-white"
          >
            {visible ? <FaEyeSlash aria-hidden="true" className="h-4 w-4" /> : <FaEye aria-hidden="true" className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-stone-500 dark:text-brand-200">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

/** Multi-line sibling of Input, sharing its label/error chrome. */
export const Textarea = forwardRef(function Textarea(
  { label, hint, error, className, containerClassName, id, required, rows = 4, maxLength = 5000, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-stone-700 dark:text-brand-200">
          {label}
          {required && <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          fieldStyles,
          'resize-y',
          error ? errorBorder : normalBorder,
          className,
        )}
        maxLength={maxLength}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-stone-500 dark:text-brand-200">{hint}</p>
      ) : null}
    </div>
  );
});

/** Native select styled to match Input. */
export const Select = forwardRef(function Select(
  { label, hint, error, children, className, containerClassName, id, required, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-stone-700 dark:text-brand-200">
          {label}
          {required && <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          fieldStyles,
          error ? errorBorder : normalBorder,
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-stone-500 dark:text-brand-200">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
