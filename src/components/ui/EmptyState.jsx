import { cn } from '@/lib/utils';

/** Neutral placeholder for empty lists, tables and not-yet-built screens. */
export default function EmptyState({ title, description, action, icon, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
        {icon ?? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
