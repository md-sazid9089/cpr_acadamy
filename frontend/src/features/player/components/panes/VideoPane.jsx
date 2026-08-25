import { FaCirclePlay } from 'react-icons/fa6';

/**
 * STUB — pass 2 replaces this with the real player (HLS, resume position,
 * playback rate, quality selection). The 16:9 box and its sticky behaviour on
 * mobile are already correct, so the layout will not shift when it lands.
 */
export default function VideoPane({ lesson }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-brand-950">
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <FaCirclePlay aria-hidden="true" className="h-12 w-12 text-brand-400" />
        <p className="text-sm font-semibold text-white">{lesson.title}</p>
        <p className="text-xs text-brand-300">
          Video player arrives in pass 2 · {lesson.durationMinutes} min
        </p>
      </div>
    </div>
  );
}
