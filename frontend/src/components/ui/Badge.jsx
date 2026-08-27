import { cn } from '@/lib/utils';

const TONES = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-400/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-400/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300 dark:ring-red-400/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-400/20',
};

/** Maps a domain status string onto a badge tone. */
export const STATUS_TONES = {
  active: 'success',
  paid: 'success',
  published: 'success',
  pending: 'warning',
  pending_payment: 'warning',
  awaiting_approval: 'warning',
  otp_pending: 'warning',
  upcoming: 'info',
  running: 'info',
  submitted: 'brand',
  failed: 'danger',
  missed: 'danger',
  rejected: 'danger',
  suspended: 'danger',
  expired: 'neutral',
  refunded: 'neutral',
};

export default function Badge({ tone = 'neutral', size = 'sm', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Badge that picks its own tone from a domain status value. */
export function StatusBadge({ status, label, ...props }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? 'neutral'} {...props}>
      {label ?? String(status ?? '').replace(/_/g, ' ')}
    </Badge>
  );
}
