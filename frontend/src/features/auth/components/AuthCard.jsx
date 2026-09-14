import Card from '@/components/ui/Card.jsx';

/** Centred card shell shared by every auth screen. */
export default function AuthCard({ title, description, children, footer, illustrations = [] }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-surface-subtle px-4 py-12 dark:bg-surface-dark">
      <div className={illustrations.length ? 'grid w-full max-w-6xl grid-cols-2 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)_minmax(0,1fr)] lg:gap-8' : 'w-full max-w-md'}>
        {illustrations.map((illustration, index) => (
          <img
            key={illustration.src}
            src={illustration.src}
            alt=""
            aria-hidden="true"
            width={illustration.width}
            height={illustration.height}
            className={`h-24 w-full object-contain sm:h-32 lg:h-auto lg:max-h-80 ${index === 0 ? 'order-1' : 'order-2 lg:order-3'}`}
          />
        ))}
        <div className={illustrations.length ? 'order-3 col-span-2 w-full max-w-md justify-self-center lg:order-2 lg:col-span-1' : undefined}>
          <Card className="p-7">
            <h1 className="text-xl font-bold text-stone-900 dark:text-white">{title}</h1>
            {description && (
              <p className="mt-1.5 text-sm text-stone-600 dark:text-brand-200">{description}</p>
            )}
            <div className="mt-6">{children}</div>
          </Card>

          {footer && (
            <p className="mt-5 text-center text-sm text-stone-600 dark:text-brand-200">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Inline error banner for failed submissions. */
export function FormAlert({ tone = 'error', children }) {
  if (!children) return null;

  const styles =
    tone === 'error'
      ? 'border-stone-200 bg-red-50 text-red-700 dark:border-stone-200 dark:bg-red-950/50 dark:text-red-300'
      : 'border-stone-200 bg-brand-50 text-brand-800 dark:border-stone-200 dark:bg-brand-950/50 dark:text-brand-200';

  return (
    <div role="alert" className={`mb-4 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
