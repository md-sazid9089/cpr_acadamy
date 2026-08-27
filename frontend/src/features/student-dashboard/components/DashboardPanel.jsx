import { cn } from '@/lib/utils';

/**
 * Bordered card with the solid blue title strip used for every content block
 * on the student dashboard.
 *
 * @param {{ title: string, className?: string, bodyClassName?: string, children: React.ReactNode }} props
 */
export default function DashboardPanel({ title, className, bodyClassName, children }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-brand-400 bg-white shadow-sm dark:border-slate-700 dark:bg-surface-dark-subtle',
        className,
      )}
    >
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 text-center text-sm font-bold text-white sm:text-base">
        {title}
      </div>
      <div className={cn('p-6', bodyClassName)}>{children}</div>
    </div>
  );
}
