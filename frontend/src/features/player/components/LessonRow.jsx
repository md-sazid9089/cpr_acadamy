import { forwardRef } from 'react';
import {
  FaCheck,
  FaCirclePlay,
  FaClipboardList,
  FaCircleInfo,
  FaFileLines,
  FaLock,
} from 'react-icons/fa6';
import { formatUnlockShort } from '../utils/lessonState.js';
import { cn } from '@/lib/utils';

const META_ICON = {
  video: FaCirclePlay,
  quiz: FaClipboardList,
  pdf: FaFileLines,
  text: FaCircleInfo,
};

/** Meta text for an unlocked lesson, by type. */
function metaLabel(lesson) {
  switch (lesson.type) {
    case 'video':
      return `${lesson.durationMinutes} min`;
    case 'quiz':
      return `${lesson.questionCount} questions`;
    case 'pdf':
      return 'Lecture sheet';
    case 'text':
      return 'Read';
    default:
      return '';
  }
}

/** 24px status indicator, driven entirely by the state machine. */
function StatusIndicator({ state }) {
  if (state === 'completed') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600">
        <FaCheck aria-hidden="true" className="h-3 w-3 text-white" />
      </span>
    );
  }

  if (state === 'locked') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
        <FaLock aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
      </span>
    );
  }

  if (state === 'available') {
    return (
      <span className="h-6 w-6 shrink-0 rounded-full border-2 border-brand-300" aria-hidden="true" />
    );
  }

  // active — the row's own fill is the signal, so no indicator.
  return <span className="h-6 w-6 shrink-0" aria-hidden="true" />;
}

/**
 * One lesson row: indicator · title · meta.
 *
 * Locked rows render as a div with aria-disabled so a screen reader still
 * announces them (and their unlock date) without offering them as an action.
 *
 * @param {Object} props
 * @param {object} props.lesson
 * @param {'active'|'completed'|'available'|'locked'} props.state
 * @param {(lesson: object) => void} props.onSelect
 */
const LessonRow = forwardRef(function LessonRow({ lesson, state, onSelect }, ref) {
  const isActive = state === 'active';
  const locked = state === 'locked';
  const MetaIcon = META_ICON[lesson.type];

  const body = (
    <>
      <StatusIndicator state={state} />

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-sm leading-snug',
            isActive && 'font-semibold text-white',
            state === 'completed' && 'text-brand-700 dark:text-brand-300',
            state === 'available' && 'text-brand-800 dark:text-slate-200',
            locked && 'text-slate-500 dark:text-slate-500',
          )}
        >
          {lesson.title}
        </span>

        <span
          className={cn(
            'mt-1 flex items-center gap-1.5 text-xs',
            isActive ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400',
          )}
        >
          {locked ? (
            <>
              <FaLock aria-hidden="true" className="h-2.5 w-2.5" />
              Unlocks {formatUnlockShort(lesson.releaseAt)}
            </>
          ) : (
            <>
              {MetaIcon && <MetaIcon aria-hidden="true" className="h-3 w-3" />}
              {metaLabel(lesson)}
            </>
          )}
        </span>
      </span>
    </>
  );

  const shared = 'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left';

  if (locked) {
    return (
      <div ref={ref} aria-disabled="true" className={cn(shared, 'cursor-not-allowed')}>
        {body}
      </div>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect?.(lesson)}
      aria-current={isActive ? 'true' : undefined}
      className={cn(
        shared,
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-surface-dark',
        isActive ? 'bg-brand-600' : 'hover:bg-brand-50 dark:hover:bg-slate-800',
      )}
    >
      {body}
    </button>
  );
});

export default LessonRow;
