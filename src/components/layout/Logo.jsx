import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Wordmark + heartbeat glyph. Renders as a link to home unless `as="span"`. */
export default function Logo({ className, compact = false }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', className)} aria-label="CPR Medical Academy, home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h4l2-5 3 10 3-7 2 2h6" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            CPR <span className="text-brand-600 dark:text-brand-400">Medical Academy</span>
          </span>
          <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
            FCPS · BCS · MBBS preparation
          </span>
        </span>
      )}
    </Link>
  );
}
