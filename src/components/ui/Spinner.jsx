import { cn } from '@/lib/utils';

const SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export default function Spinner({ size = 'md', label, className }) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)} role="status">
      <svg
        className={cn('animate-spin text-brand-600 dark:text-brand-400', SIZES[size] ?? SIZES.md)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {label && <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/** Full-viewport loader for route-level Suspense fallbacks. */
export function PageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" label="Loading…" />
    </div>
  );
}
