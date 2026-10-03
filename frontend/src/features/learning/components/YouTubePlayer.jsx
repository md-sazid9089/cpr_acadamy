import { useCallback, useEffect, useRef, useState } from 'react';
import { FaPlay, FaPause, FaVolumeHigh, FaVolumeXmark, FaExpand, FaCompress } from 'react-icons/fa6';
import PlaybackRateControl from './PlaybackRateControl.jsx';

let apiPromise = null;
/** Loads the YouTube IFrame API script once and resolves with `window.YT`. */
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    // A blocked or failed script must not leave a promise that never settles, or "Try again" could never work.
    tag.onerror = () => {
      tag.remove();
      apiPromise = null;
      reject(new Error('YouTube player script failed to load'));
    };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// How long to wait for the API to load and the player to fire onReady before
// giving up and falling back to a plain, fully-native YouTube embed.
const READY_TIMEOUT_MS = 8000;

/**
 * Hardened embed for an unlisted YouTube lecture.
 *
 * YouTube's own chrome is turned off (controls=0, fs=0, rel=0, disablekb=1,
 * modestbranding=1, iv_load_policy=3, the youtube-nocookie.com host) and a
 * custom control bar takes its place, so a student is never one click away
 * from a "Watch on YouTube" link, the channel page, or related-video
 * suggestions. A transparent overlay keeps every click inside our own
 * controls instead of the raw iframe, the video is cropped in slightly to
 * push YouTube's own title card off the visible edge, and reaching the end
 * seeks back to the first frame immediately so the related-videos end
 * screen never has a chance to render.
 *
 * Until the first frame plays (and again after the video ends) a black cover
 * hides the video, because YouTube paints its logo, title and "Watch on
 * YouTube" over an unstarted embed.
 *
 * If the IFrame API fails to load, the player never becomes ready, or the
 * video itself errors out, the player shows a "Try again" message. It never
 * falls back to YouTube's own player, which would bring back "Watch on
 * YouTube" and the recommended videos.
 *
 * This is deterrence, not DRM: the video id necessarily reaches the browser
 * to play at all, and a determined viewer can still find it in devtools.
 * The real access boundary is server-side — only enrolled students ever
 * receive this id, via requireCourseAccess on /courses/:slug/videos.
 */
export default function YouTubePlayer({ videoId, title, watermark, onEnded, onError }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  // True once the custom player gave up (API blocked, never ready, or a video error). There is no fallback to YouTube's
  // own player: it brings back "Watch on YouTube" and the recommendations. The student gets a retry instead.
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // False until the first frame is actually playing (and again after the video ends). YouTube paints its own logo,
  // title and "Watch on YouTube" over an unstarted video, so a plain cover hides it until playback begins.
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (failed) return undefined;
    let cancelled = false;
    let player;
    const giveUp = () => {
      // If the script never answered, forget the pending load so the retry starts a fresh one.
      if (!window.YT?.Player) apiPromise = null;
      if (!cancelled) setFailed(true);
    };
    const readyTimeout = setTimeout(giveUp, READY_TIMEOUT_MS);
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      player = new YT.Player(hostRef.current, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        width: '100%',
        height: '100%',
        playerVars: {
          controls: 0, modestbranding: 1, rel: 0, disablekb: 1, fs: 0,
          iv_load_policy: 3, playsinline: 1, origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            clearTimeout(readyTimeout);
            playerRef.current = event.target;
            setDuration(event.target.getDuration());
            setReady(true);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) { setPlaying(true); setStarted(true); setDuration(event.target.getDuration()); }
            if (event.data === YT.PlayerState.PAUSED) setPlaying(false);
            if (event.data === YT.PlayerState.ENDED) {
              setPlaying(false);
              setStarted(false);
              // Snap back to the first frame instead of letting YouTube's own
              // related-videos grid render over the finished video.
              event.target.seekTo(0, true);
              event.target.pauseVideo();
              setCurrent(0);
              onEnded?.();
            }
          },
          onError: () => { clearTimeout(readyTimeout); onError?.(); giveUp(); },
        },
      });
    }).catch(giveUp);
    return () => {
      cancelled = true;
      clearTimeout(readyTimeout);
      player?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, failed, attempt]);

  // A different lecture starts covered again.
  useEffect(() => { setStarted(false); }, [videoId]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      const current = playerRef.current;
      if (current?.getCurrentTime) setCurrent(current.getCurrentTime());
    }, 400);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  }, [playing]);

  const seek = (event) => {
    const player = playerRef.current;
    if (!player || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    player.seekTo(ratio * duration, true);
    setCurrent(ratio * duration);
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) { player.unMute(); setMuted(false); } else { player.mute(); setMuted(true); }
  };

  const applyRate = (value) => {
    setRate(value);
    playerRef.current?.setPlaybackRate(value);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapperRef.current?.requestFullscreen?.();
  };

  const handleKeyDown = (event) => {
    if (event.key === ' ') { event.preventDefault(); toggle(); }
    if (event.key === 'ArrowRight') playerRef.current?.seekTo(current + 5, true);
    if (event.key === 'ArrowLeft') playerRef.current?.seekTo(Math.max(0, current - 5), true);
  };

  // The custom player could not start. Show our own message with a retry, never YouTube's own player.
  if (failed) {
    return (
      <div role="alert" className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-black px-4 text-center text-white">
        <p className="text-sm text-white/80">The video could not be loaded. Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => { setStarted(false); setReady(false); setAttempt((value) => value + 1); setFailed(false); }}
          className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="group"
      aria-label={title ?? 'Lecture video'}
      onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}
      className="relative overflow-hidden rounded-xl bg-black outline-none"
    >
      {/* Slightly oversized and re-centered, then clipped by this wrapper's overflow-hidden —
          crops YouTube's own title card off the top edge (and matches it on every side so
          the video doesn't look off-center). Cosmetic only: it doesn't affect click-through. */}
      <div className="pointer-events-none aspect-video w-full overflow-hidden">
        <div ref={hostRef} className="h-[116%] w-[116%] -translate-x-[8%] -translate-y-[8%]" />
      </div>

      {/* Everything happens here, never on the raw iframe underneath. */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className={`absolute inset-0 flex h-full w-full items-center justify-center ${started ? 'bg-transparent' : 'bg-black'}`}
      >
        {!ready && <span className="text-sm text-white/70">Loading…</span>}
        {ready && !playing && (
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

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
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
