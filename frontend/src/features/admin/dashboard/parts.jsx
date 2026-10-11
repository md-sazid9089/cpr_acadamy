import { useEffect, useRef, useState } from 'react';
import { FaInfo } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

const TIME = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** "Today, 2:10 pm", "Yesterday, 9:05 pm", otherwise "8 Oct 2026". */
export function dayAndTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return `Today, ${TIME.format(date)}`;
  if (days === 1) return `Yesterday, ${TIME.format(date)}`;
  return DATE.format(date);
}

/** "just now", "12 min ago", "3 hr ago", "2 days ago", then the date. */
export function timeAgo(iso) {
  if (!iso) return '';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days} day${days === 1 ? '' : 's'} ago` : DATE.format(new Date(iso));
}

/** Two letters for an avatar circle. */
export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((word) => [...word][0] ?? '').join('').toUpperCase() || '?';
}

/** "5 waiting" pill beside a card title. */
export function WaitingPill({ count }) {
  if (!count) return null;
  return (
    <span className="whitespace-nowrap rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-accent-700 dark:bg-accent-950 dark:text-accent-300">
      {count} waiting
    </span>
  );
}

/** A small "i" button that shows a short explanation under the card header. */
export function InfoToggle({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:text-brand-600 dark:border-stone-200 dark:text-brand-200"
      >
        <FaInfo aria-hidden="true" className="h-3 w-3" />
      </button>
      {open && (
        <div role="note" className="absolute right-0 top-10 z-20 w-72 rounded-xl border border-stone-200 bg-white p-3 text-sm leading-relaxed text-stone-600 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200">
          {children}
        </div>
      )}
    </div>
  );
}

/** Card header in the dashboard style: title, waiting pill, one-line description and an info button. */
export function DashboardCardHeader({ title, count, description, info, infoLabel }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 py-4 sm:px-6 dark:border-stone-200">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">{title}</h2>
          <WaitingPill count={count} />
        </div>
        <p className="mt-0.5 text-sm text-stone-500 dark:text-brand-200">{description}</p>
      </div>
      {info && <InfoToggle label={infoLabel}>{info}</InfoToggle>}
    </div>
  );
}

export function Avatar({ name, className }) {
  return (
    <span aria-hidden="true" className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-200', className)}>
      {initials(name)}
    </span>
  );
}
