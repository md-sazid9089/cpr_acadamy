import { cn } from '@/lib/utils';
import { FaPause, FaPlay } from 'react-icons/fa6';

export const SKIP_SECONDS = 10;

/** A circular arrow with "10" inside, pointing back (rewind) or forward. */
function SkipIcon({ forward }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('h-5 w-5', forward && '-scale-x-100')}>
      <path d="M12 4a8 8 0 1 1-7.4 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 3.5v5.5h5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="12.4" y="15.6" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="currentColor" className={forward ? '-scale-x-100 [transform-origin:12.4px_12px]' : undefined}>
        {SKIP_SECONDS}
      </text>
    </svg>
  );
}

/**
 * Compact transport controls for the bottom player bar. Keeping the seek
 * buttons beside play/pause makes them reachable without covering the video.
 */
export default function SkipControls({ playing, onToggle, onSkip }) {
  const button = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-10 sm:w-10';
  return (
    <div className="flex shrink-0 items-center gap-0.5" aria-label="Playback controls">
      <button type="button" onClick={() => onSkip(-SKIP_SECONDS)} aria-label={`Back ${SKIP_SECONDS} seconds`} title={`Back ${SKIP_SECONDS}s`} className={button}>
        <SkipIcon />
      </button>
      <button type="button" onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'} className={cn(button, 'bg-white/10 hover:bg-white/20')}>
        {playing
          ? <FaPause aria-hidden="true" className="h-4 w-4" />
          : <FaPlay aria-hidden="true" className="h-4 w-4 translate-x-px" />}
      </button>
      <button type="button" onClick={() => onSkip(SKIP_SECONDS)} aria-label={`Forward ${SKIP_SECONDS} seconds`} title={`Forward ${SKIP_SECONDS}s`} className={button}>
        <SkipIcon forward />
      </button>
    </div>
  );
}
