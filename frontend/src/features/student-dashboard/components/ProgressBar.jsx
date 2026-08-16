import { cn } from '@/lib/utils';

/** Horizontal completion bar used across the dashboard. */
export default function ProgressBar({ value = 0, label, showValue = true, className }) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && <span className="font-medium text-slate-600 dark:text-slate-400">{label}</span>}
          {showValue && (
            <span className="font-semibold text-brand-700 dark:text-brand-400">{clamped}%</span>
          )}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-500 dark:bg-brand-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
