import { useRef, useState } from 'react';
import Button from '@/components/ui/Button.jsx';

/**
 * Lecture video surface.
 *
 * Playback is deliberately thin for now: when `src` is absent it renders a
 * placeholder instead of a broken <video>. A watermark with the viewer's
 * identity is overlaid to discourage screen recording, and the context menu is
 * suppressed so the file URL is not one right-click away. Neither is real DRM —
 * TODO: move to a signed-URL HLS stream with token rotation.
 */
export default function VideoPlayer({ src, poster, title, watermark, onEnded }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="relative flex aspect-video w-full items-center justify-center rounded-xl bg-slate-900 text-center">
        <div className="px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5l10 7-10 7z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-white">{title ?? 'Lecture video'}</p>
          <p className="mt-1 text-xs text-slate-400">
            {/* TODO: stream from the media backend once lectures are uploaded. */}
            Video source not connected yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        controlsList="nodownload"
        onContextMenu={(event) => event.preventDefault()}
        onError={() => setError(true)}
        onEnded={onEnded}
        className="aspect-video w-full"
      >
        Your browser does not support embedded video.
      </video>

      {watermark && (
        <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/40 px-2 py-1 text-[11px] text-white/70">
          {watermark}
        </span>
      )}
    </div>
  );
}

/** Playback speed control kept separate so it can be reused by the audio view. */
export function PlaybackRateControl({ videoRef }) {
  const rates = [0.75, 1, 1.25, 1.5, 2];
  const [rate, setRate] = useState(1);

  const apply = (next) => {
    setRate(next);
    if (videoRef?.current) videoRef.current.playbackRate = next;
  };

  return (
    <div className="flex gap-1">
      {rates.map((value) => (
        <Button
          key={value}
          size="sm"
          variant={value === rate ? 'primary' : 'ghost'}
          onClick={() => apply(value)}
        >
          {value}×
        </Button>
      ))}
    </div>
  );
}
