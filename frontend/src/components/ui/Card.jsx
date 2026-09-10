import { cn } from '@/lib/utils';

/** Surface container used for course cards, dashboard panels and forms. */
export default function Card({ className, hoverable = false, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-sm',
        'dark:border-slate-800 dark:bg-surface-dark-subtle',
        hoverable && 'transition-shadow duration-200 hover:shadow-lg hover:shadow-brand-900/5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, title, description, action, children }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800', className)}>
      {children ?? (
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      )}
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn('border-t border-slate-200 p-5 dark:border-slate-800', className)}>{children}</div>
  );
}

/** Compact metric tile for dashboards. */
export function StatCard({ label, value, hint, icon }) {
  return (
    <Card className="border-2 p-6 shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-slate-600 dark:text-slate-300">{label}</p>
        {icon && <span className="text-2xl text-brand-600 dark:text-brand-400">{icon}</span>}
      </div>
      <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{hint}</p>}
    </Card>
  );
}
