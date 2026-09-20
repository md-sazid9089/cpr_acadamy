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
      <img
        src="/assets/spotlight/cpr-logo.png"
        alt="CPR Medical Academy"
        width="240"
        height="191"
        className={cn(
          // The box is intentionally wider than the artwork's own 240x191
          // ratio (a 2:1 box) — object-contain keeps the mark itself
          // undistorted and centered, with the extra width as side padding.
          'rounded-none object-contain border border-stone-200',
          compact ? 'h-11 w-[5.5rem]' : 'h-[4.5rem] w-[9rem]',
        )}
      />
    </Link>
  );
}
