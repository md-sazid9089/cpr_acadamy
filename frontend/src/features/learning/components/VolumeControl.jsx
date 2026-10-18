import { FaVolumeHigh, FaVolumeXmark } from 'react-icons/fa6';

/** Shared mute button and volume slider for both local and YouTube videos. */
export default function VolumeControl({ volume, muted, onToggleMute, onChange }) {
  const displayedVolume = muted ? 0 : Math.round(volume * 100);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {muted
          ? <FaVolumeXmark aria-hidden="true" className="h-4 w-4" />
          : <FaVolumeHigh aria-hidden="true" className="h-4 w-4" />}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={displayedVolume}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        aria-label="Volume"
        aria-valuetext={`${displayedVolume}%`}
        className="h-5 w-14 cursor-pointer accent-brand-500 sm:w-20"
      />
    </div>
  );
}
