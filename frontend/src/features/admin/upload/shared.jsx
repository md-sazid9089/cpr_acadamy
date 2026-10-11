import { useEffect, useRef, useState } from 'react';
import { FaTrash } from 'react-icons/fa6';
import { uploadImage } from '../api/admin.api.js';
import { cn } from '@/lib/utils';

/** One block of the Upload page: title, description and size guidance on the left, an action on the right. */
export function Section({ title, description, specs = [], action, children }) {
  return (
    <section className="ui-card rounded-card border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 px-5 py-4 sm:px-6 dark:border-stone-200">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">{title}</h2>
          {description && <p className="mt-0.5 max-w-prose text-sm text-stone-500 dark:text-brand-200">{description}</p>}
          {specs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {specs.map((spec) => (
                <span key={spec} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-200">{spec}</span>
              ))}
            </div>
          )}
        </div>
        {action}
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

/** Shows how the site will look, on a tinted panel. */
export function Preview({ label, aside, children }) {
  return (
    <div className="rounded-card bg-stone-100 p-4 dark:bg-surface-dark">
      <div className="mb-3 flex justify-between gap-2 text-xs text-stone-500 dark:text-brand-200">
        <span>{label}</span>
        {aside && <span className="tabular-nums">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

export function Switch({ checked, onChange, disabled, label, children }) {
  return (
    <label className={cn('inline-flex select-none items-center gap-2 text-sm text-stone-700 dark:text-brand-200', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
      <input
        type="checkbox"
        role="switch"
        aria-label={children ? undefined : label}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-[22px] w-[38px] shrink-0 rounded-full bg-stone-200 transition-colors after:absolute after:left-[3px] after:top-[3px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-brand-500 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 dark:bg-brand-800 dark:peer-checked:bg-brand-500"
      />
      {children}
    </label>
  );
}

export function StatusPill({ on, onText = 'On site', offText = 'Hidden' }) {
  return (
    <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
      on ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'bg-stone-100 text-stone-500 dark:bg-surface-dark dark:text-brand-200')}>
      {on ? onText : offText}
    </span>
  );
}

/** A delete button that asks for a second click instead of a confirm box. */
export function DeleteButton({ onConfirm, label = 'Delete', text, className, disabled }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const click = () => {
    if (armed) { setArmed(false); onConfirm(); return; }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), 3000);
  };
  return (
    <button
      type="button"
      onClick={click}
      disabled={disabled}
      aria-label={armed ? 'Click again to delete' : label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-40',
        text ? 'min-h-[38px] px-3' : 'h-8 w-8',
        armed
          ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          : 'border-stone-200 bg-white text-stone-500 hover:border-red-500 hover:text-red-700 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200',
        className,
      )}
    >
      <FaTrash aria-hidden="true" className="h-3.5 w-3.5" />
      {text && (armed ? 'Click again to delete' : text)}
    </button>
  );
}

/** Drag-and-drop or click to choose images. Calls `onFiles` with the chosen File objects. */
export function DropZone({ onFiles, disabled, title = '+ Add images', hint = 'Drop images here or click to choose. You can add several at once.', className, multiple = true }) {
  const [over, setOver] = useState(false);
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-card border-2 border-dashed border-stone-200 px-4 py-5 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-stone-200 dark:hover:bg-brand-950/40',
        over && 'border-brand-500 bg-brand-50 dark:bg-brand-950/40',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onDragOver={(event) => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        setOver(false);
        if (!event.dataTransfer.files.length) return;
        event.preventDefault();
        onFiles([...event.dataTransfer.files]);
      }}
    >
      <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">{title}</span>
      {hint && <span className="text-xs text-stone-500 dark:text-brand-200">{hint}</span>}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => { onFiles([...event.target.files]); event.target.value = ''; }}
      />
    </label>
  );
}

/**
 * Uploads files one by one and hands each stored URL to `save`. Returns a list of
 * readable problems (one per file that failed), so one bad file never blocks the rest.
 */
export async function uploadEach(files, save, { limit = Infinity, limitMessage } = {}) {
  const problems = [];
  let added = 0;
  for (const file of files) {
    if (added >= limit) { problems.push(limitMessage); break; }
    try {
      const url = await uploadImage(file);
      await save(url, file);
      added += 1;
    } catch (error) {
      problems.push(`${file.name}: ${error?.message || 'could not be uploaded.'}`);
    }
  }
  return problems;
}

export function Problems({ items, onDismiss }) {
  if (!items?.length) return null;
  return (
    <div role="alert" className="space-y-2">
      {items.map((item, i) => (
        <p key={`${i}-${item}`} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{item}</p>
      ))}
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-xs font-semibold text-stone-500 underline underline-offset-4 dark:text-brand-200">Dismiss</button>
      )}
    </div>
  );
}

/** Text field that saves when the admin leaves it, not on every keystroke. */
export function SaveOnBlurInput({ id, label, value, onSave, placeholder, maxLength = 200 }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { setDraft(value ?? ''); }, [value]);
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-0.5 block text-xs font-medium text-stone-500 dark:text-brand-200">{label}</label>
      <input
        id={id}
        type="text"
        value={draft}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => { if (draft.trim() !== (value ?? '')) onSave(draft.trim()); }}
        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
        className="block min-h-[38px] w-full rounded-control border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200"
      />
    </div>
  );
}
