import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Brand mark, linking home.
 *
 * The artwork already contains the "CPR / Medical Academy" wordmark, so no
 * separate text is rendered — the alt text carries the name for screen readers
 * and for the case where the image fails to load.
 *
 * The source filename contains a space, hence the %20; keep it encoded, or
 * rename the asset to `cpr-logo.png` and update this path.
 *
 * @param {{ className?: string, compact?: boolean }} props
 * @param {boolean} [props.compact=false] Smaller mark, for tight bars.
 */
export default function Logo({ className, compact = false }) {
  return (
    <Link
      to="/"
      // Negative margin pulls the mark toward the viewport edge rather than
      // sitting on the container's text gutter, so it reads as flush left.
      className={cn('-ml-2 flex shrink-0 items-center lg:-ml-4', className)}
      aria-label="CPR Medical Academy, home"
    >
      {/* Square + object-cover so the round crop stays a true circle rather
          than an ellipse — the source is 2292x1824, so cover trims the sides
          instead of squashing. The ring keeps the mark defined against the
          white bar, since the artwork's own background is near-white. */}
      <img
        src="/assets/spotlight/cpr%20logo.png"
        alt="CPR Medical Academy"
        width="2292"
        height="1824"
        className={cn(
          'aspect-square rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700',
          compact ? 'h-11 w-11' : 'h-[4.5rem] w-[4.5rem]',
        )}
      />
    </Link>
  );
}
