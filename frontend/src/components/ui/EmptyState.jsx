import { cn } from '@/lib/utils';
import Button from './Button.jsx';

/**
 * Neutral placeholder for empty lists, tables and not-yet-built screens —
 * or, with `variant="error"`, a failed request. The error variant gets
 * `role="alert"` so assistive tech announces it as soon as it replaces a
 * loading state, and `onRetry` renders a Retry button that reflects
 * `isFetching` so a screen-reader or low-vision user can tell a retry is
 * in flight rather than the click having done nothing.
 */
export default function EmptyState({ title, description, action, icon, variant, onRetry, isFetching = false, className }) {
  const resolvedAction = action ?? (onRetry && (
    <Button variant="outline" onClick={onRetry} isLoading={isFetching}>Retry</Button>
  ));

  return (
    <div
      role={variant === 'error' ? 'alert' : undefined}
      className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
        {icon ?? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold text-stone-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-brand-200">{description}</p>
      )}
      {resolvedAction && <div className="mt-5">{resolvedAction}</div>}
    </div>
  );
}
