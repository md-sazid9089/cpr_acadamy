import { useId } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import LessonRow from './LessonRow.jsx';
import { formatModuleDuration, getLessonState } from '../utils/lessonState.js';
import { cn } from '@/lib/utils';

/**
 * One module: a button header and, when open, its lesson rows.
 *
 * Lesson rows are mounted only while open — a closed module contributes nothing
 * to the DOM, which keeps the tree small on the low-end Androids this is aimed
 * at. That rules out a height transition, so the chevron is the only motion.
 *
 * @param {Object} props
 * @param {object} props.module
 * @param {boolean} props.isOpen
 * @param {() => void} props.onToggle
 * @param {string} props.activeLessonId
 * @param {(lesson: object) => void} props.onSelectLesson
 * @param {{ completed: number, total: number }} [props.progress]
 * @param {object[]} [props.visibleLessons]  Search-filtered subset.
 * @param {(node: HTMLElement | null) => void} [props.activeRowRef]
 */
export default function ModuleAccordion({
  module,
  isOpen,
  onToggle,
  activeLessonId,
  onSelectLesson,
  progress,
  visibleLessons,
  activeRowRef,
}) {
  const panelId = useId();
  const headerId = useId();
  const lessons = visibleLessons ?? module.lessons;

  const completed = progress?.completed ?? 0;
  const total = progress?.total ?? module.lessons.length;

  return (
    <section className="mb-2">
      <h3>
        <button
          type="button"
          id={headerId}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className={cn(
            'flex w-full items-start gap-3 border-l-[3px] border-brand-600 bg-brand-50 px-3 py-3 text-left',
            'transition-colors duration-150 hover:bg-brand-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            'dark:border-brand-500 dark:bg-slate-800/70 dark:hover:bg-slate-800',
            'dark:focus-visible:ring-offset-surface-dark',
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-snug text-brand-800 dark:text-brand-200">
              {module.title}
            </span>

            {module.titleBn && (
              <span
                lang="bn"
                className="mt-0.5 block font-bn text-xs leading-[1.9] text-slate-500 dark:text-slate-400"
              >
                {module.titleBn}
              </span>
            )}

            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              {formatModuleDuration(module.durationMinutes)} · {completed}/{total}
            </span>
          </span>

          <FaChevronDown
            aria-hidden="true"
            className={cn(
              'mt-1 h-3.5 w-3.5 shrink-0 text-brand-700 transition-transform duration-150 motion-reduce:transition-none',
              isOpen && 'rotate-180',
              'dark:text-brand-300',
            )}
          />
        </button>
      </h3>

      {isOpen && (
        <ul id={panelId} aria-labelledby={headerId} className="mt-1 space-y-0.5 pl-1">
          {lessons.map((lesson) => {
            const state = getLessonState(lesson, activeLessonId);
            return (
              <li key={lesson.id}>
                <LessonRow
                  ref={state === 'active' ? activeRowRef : undefined}
                  lesson={lesson}
                  state={state}
                  onSelect={onSelectLesson}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
