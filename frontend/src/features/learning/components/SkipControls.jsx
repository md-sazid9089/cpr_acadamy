import { cn } from '@/lib/utils';

export const SKIP_SECONDS = 10;

/** A circular arrow with "10" inside, pointing back (rewind) or forward. */
function SkipIcon({ forward }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('h-7 w-7', forward && '-scale-x-100')}>
      <path d="M12 4a8 8 0 1 1-7.4 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 3.5v5.5h5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="12.4" y="15.6" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="currentColor" className={forward ? '-scale-x-100 [transform-origin:12.4px_12px]' : undefined}>
        {SKIP_SECONDS}
      </text>
    </svg>
  );
}

/**
 * "Back 10s" and "forward 10s" buttons over the video, either side of the centre play button.
 * Always shown while paused; while playing they appear on hover or keyboard focus (the player wrapper is a `group`).
 */
export default function SkipControls({ playing, onSkip }) {
  const button = 'pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-14 sm:w-14';
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-24 transition-opacity sm:gap-32',
        // Keyboard focus keeps them visible; a mouse click does not, so they fade once the pointer leaves.
        playing ? 'opacity-0 group-hover:opacity-100 has-[:focus-visible]:opacity-100' : 'opacity-100',
      )}
    >
      <button type="button" onClick={() => onSkip(-SKIP_SECONDS)} aria-label={`Back ${SKIP_SECONDS} seconds`} title={`Back ${SKIP_SECONDS}s`} className={button}>
        <SkipIcon />
      </button>
      <button type="button" onClick={() => onSkip(SKIP_SECONDS)} aria-label={`Forward ${SKIP_SECONDS} seconds`} title={`Forward ${SKIP_SECONDS}s`} className={button}>
        <SkipIcon forward />
      </button>
    </div>
  );
}
