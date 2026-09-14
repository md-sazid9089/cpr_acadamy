import { cn } from '@/lib/utils';

const TONES = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 ',
  neutral: 'bg-stone-100 text-stone-700 dark:bg-surface-dark dark:text-brand-200',
  success: 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 ',
  warning: 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200 ',
  danger: 'bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 ',
  info: 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 ',
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
        'ui-badge inline-flex items-center rounded-full font-medium border border-stone-200',
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
