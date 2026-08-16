import { useEffect, useMemo } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * Counts down to the server-issued `endsAt` and calls `onExpire` once, which
 * the runner uses to auto-submit. Seeding from the absolute deadline means a
 * refresh cannot buy extra time.
 */
export default function ExamTimer({ endsAt, durationMinutes = 60, onExpire, className }) {
  const initialSeconds = useMemo(() => {
    if (endsAt) return Math.max(0, Math.round((new Date(endsAt) - Date.now()) / 1000));
    return durationMinutes * 60;
  }, [endsAt, durationMinutes]);

  const { remaining, isExpired } = useCountdown(initialSeconds, { onExpire });

  // Warn in the last five minutes.
  const isUrgent = remaining <= 300 && !isExpired;

  useEffect(() => {
    if (!isUrgent) return undefined;
    document.title = `⏱ ${formatDuration(remaining)} — exam in progress`;
    return () => {
      document.title = 'CPR Medical Academy';
    };
  }, [isUrgent, remaining]);

  return (
    <div
      role="timer"
      aria-live={isUrgent ? 'polite' : 'off'}
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold tabular-nums',
        isUrgent
          ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
          : 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300',
        className,
      )}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="13" r="8" />
        <path strokeLinecap="round" d="M12 9v4l2.5 2.5M9 2h6" />
      </svg>
      {formatDuration(remaining)}
    </div>
  );
}
