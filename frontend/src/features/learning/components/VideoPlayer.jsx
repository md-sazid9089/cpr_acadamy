import { useRef, useState, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaVolumeHigh, FaVolumeXmark, FaExpand, FaCompress } from 'react-icons/fa6';
import YouTubePlayer from './YouTubePlayer.jsx';
import PlaybackRateControl from './PlaybackRateControl.jsx';

/** 'https://youtu.be/ID', '…/watch?v=ID', '…/embed/ID', '…/shorts/ID' -> 'ID', else null. */
function extractYouTubeId(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^(www|m)\./, '');
    if (host === 'youtu.be') return parsed.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      const match = parsed.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Lecture video surface.
 *
 * A YouTube link (the recommended host for unlisted lectures — see
 * YouTubePlayer) renders through a hardened embed with YouTube's own chrome
 * replaced. Any other HTTPS link falls back to a plain <video> tag. When
 * `src` is absent it renders a placeholder instead of a broken player. A
 * watermark with the viewer's identity is overlaid to discourage screen
 * recording, and the context menu is suppressed so the file URL is not one
 * right-click away. Neither is real DRM — the actual access boundary is
 * server-side enrollment gating, not the player.
 */
export default function VideoPlayer({ src, poster, title, watermark, onEnded }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
  }, [playing]);

  const seek = (event) => {
    if (!videoRef.current || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = ratio * duration;
    setCurrent(ratio * duration);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const applyRate = (value) => {
    setRate(value);
    if (videoRef.current) videoRef.current.playbackRate = value;
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapperRef.current?.requestFullscreen?.();
  };

  const handleKeyDown = (event) => {
    if (event.key === ' ') { event.preventDefault(); toggle(); }
    if (event.key === 'ArrowRight' && videoRef.current) { videoRef.current.currentTime = Math.min(duration, current + 5); }
    if (event.key === 'ArrowLeft' && videoRef.current) { videoRef.current.currentTime = Math.max(0, current - 5); }
  };

  if (!src || error) {
    return (
      <div className="relative flex aspect-video w-full items-center justify-center rounded-xl bg-stone-900 text-center">
        <div className="px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5l10 7-10 7z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-white">{title ?? 'Lecture video'}</p>
          <p className="mt-1 text-xs text-stone-400">
            Video source not connected yet.
          </p>
        </div>
      </div>
    );
  }

  const youTubeId = extractYouTubeId(src);
  if (youTubeId) {
    return <YouTubePlayer videoId={youTubeId} title={title} watermark={watermark} onEnded={onEnded} onError={() => setError(true)} />;
  }

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="group"
      aria-label={title ?? 'Lecture video'}
      onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}
      className="relative overflow-hidden rounded-xl bg-black outline-none group"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
        onError={() => setError(true)}
        onEnded={() => { setPlaying(false); onEnded?.(); }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setCurrent(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        className="aspect-video w-full"
      >
        Your browser does not support embedded video.
      </video>

      {/* Everything happens here, never on the raw video underneath. */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="absolute inset-0 flex h-full w-full items-center justify-center bg-transparent"
      >
        {!playing && (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white">
            <FaPlay aria-hidden="true" className="h-6 w-6 translate-x-0.5" />
          </span>
        )}
      </button>

      {watermark && (
        <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/40 px-2 py-1 text-[11px] text-white/70">
          {watermark}
        </span>
      )}

      {/* Bottom control bar */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="shrink-0 text-white">
          {playing ? <FaPause aria-hidden="true" className="h-4 w-4" /> : <FaPlay aria-hidden="true" className="h-4 w-4" />}
        </button>

        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={current}
          onClick={seek}
          className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/25"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
            style={{ width: duration ? `${(current / duration) * 100}%` : '0%' }}
          />
        </div>

        <span className="hidden shrink-0 text-[11px] tabular-nums text-white/80 sm:inline">
          {formatTime(current)} / {formatTime(duration)}
        </span>

        <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="shrink-0 text-white">
          {muted ? <FaVolumeXmark aria-hidden="true" className="h-4 w-4" /> : <FaVolumeHigh aria-hidden="true" className="h-4 w-4" />}
        </button>

        <div className="flex shrink-0 items-center justify-center">
          <PlaybackRateControl rate={rate} onChange={applyRate} />
        </div>

        <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} className="shrink-0 text-white">
          {fullscreen ? <FaCompress aria-hidden="true" className="h-4 w-4" /> : <FaExpand aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
