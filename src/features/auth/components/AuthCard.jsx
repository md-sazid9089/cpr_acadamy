import Card from '@/components/ui/Card.jsx';

/** Centred card shell shared by every auth screen. */
export default function AuthCard({ title, description, children, footer }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-surface-subtle px-4 py-12 dark:bg-surface-dark">
      <div className="w-full max-w-md">
        <Card className="p-7">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          )}
          <div className="mt-6">{children}</div>
        </Card>

        {footer && (
          <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</p>
        )}
      </div>
    </div>
  );
}

/** Inline error banner for failed submissions. */
export function FormAlert({ tone = 'error', children }) {
  if (!children) return null;

  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300'
      : 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-200';

  return (
    <div role="alert" className={`mb-4 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
