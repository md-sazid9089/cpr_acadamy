import { FaTriangleExclamation } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

/**
 * The form-level error: what went wrong with a submission when it is not about one field (those show under
 * the field itself). `role="alert"` makes screen readers announce it as soon as it appears.
 */
export default function FormError({ children, className }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-control border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700',
        'dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
        className,
      )}
    >
      <FaTriangleExclamation aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
