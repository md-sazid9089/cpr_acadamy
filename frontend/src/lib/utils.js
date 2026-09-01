import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, letting later Tailwind classes win. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// toLocaleString builds a fresh Intl formatter on every call, which is the
// expensive part. A card grid calls these hundreds of times per render, so the
// formatters are built once and reused.
const BDT_FORMAT = new Intl.NumberFormat('en-BD');

/** Format a number as Bangladeshi Taka, e.g. 4500 -> '৳4,500'. */
export function formatBDT(amount) {
  if (amount == null) return '—';
  return `৳${BDT_FORMAT.format(Number(amount))}`;
}

const DATE_OPTIONS = { day: '2-digit', month: 'short', year: 'numeric' };
const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', DATE_OPTIONS);

/** Format an ISO date as e.g. '12 Sep 2025'. */
export function formatDate(iso, options) {
  if (!iso) return '—';
  // Only the default shape is cached; a caller passing overrides still gets a
  // one-off formatter, which is rare enough not to matter.
  const format = options
    ? new Intl.DateTimeFormat('en-GB', { ...DATE_OPTIONS, ...options })
    : DATE_FORMAT;
  return format.format(new Date(iso));
}

const DATETIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/** Format an ISO date-time as e.g. '12 Sep 2025, 08:00 PM'. */
export function formatDateTime(iso) {
  if (!iso) return '—';
  return DATETIME_FORMAT.format(new Date(iso));
}

/** Seconds -> 'HH:MM:SS' (or 'MM:SS' under an hour), for exam timers. */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Mask a mobile number for display: '01712345678' -> '017****5678'. */
export function maskMobile(mobile = '') {
  if (mobile.length < 7) return mobile;
  return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`;
}

/** Resolve after `ms` — used by the mock API layer to fake latency. */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
