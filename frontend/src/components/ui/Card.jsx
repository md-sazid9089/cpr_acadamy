import { cn } from '@/lib/utils';

/** Surface container used for course cards, dashboard panels and forms. */
export default function Card({ className, hoverable = false, children, ...props }) {
  return (
    <div
      className={cn(
        'ui-card rounded-card border border-stone-200 bg-white',
        'dark:border-stone-200 dark:bg-surface-dark-subtle',
        hoverable && 'transition-colors duration-200 hover:bg-stone-50 dark:hover:bg-surface-dark',
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
    <div className={cn('flex items-start justify-between gap-4 border-b border-stone-200 p-5 dark:border-stone-200', className)}>
      {children ?? (
        <div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">{title}</h3>
          {description && <p className="mt-1 text-sm text-stone-500 dark:text-brand-200">{description}</p>}
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
    <div className={cn('border-t border-stone-200 p-5 dark:border-stone-200', className)}>{children}</div>
  );
}

/** Compact metric tile for dashboards. */
export function StatCard({ label, value, hint, icon }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-stone-600 dark:text-brand-200">{label}</p>
        {icon && <span className="text-2xl text-brand-600 dark:text-brand-400">{icon}</span>}
      </div>
      <p className="mt-3 text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">{value}</p>
      {hint && <p className="mt-2 text-sm font-medium text-stone-500 dark:text-brand-200">{hint}</p>}
    </Card>
  );
}
