import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRegCalendarDays } from 'react-icons/fa6';
import ProgressHeader from './ProgressHeader.jsx';
import LessonSearch from './LessonSearch.jsx';
import ModuleAccordion from './ModuleAccordion.jsx';
import { cn } from '@/lib/utils';

/** Skeleton rows while the outline loads — no spinners anywhere in the player. */
function SidebarSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="ml-3 h-8 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
          <div className="ml-3 h-8 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
      ))}
    </div>
  );
}

function matches(text, needle) {
  return Boolean(text) && text.toLowerCase().includes(needle);
}

/**
 * The single owner of the lesson accordion. The desktop column and the mobile
 * sheet both render this component; `useMediaQuery` in CoursePlayer guarantees
 * only one of them is mounted, so the accordion exists exactly once.
 *
 * @param {Object} props
 * @param {object} props.outline
 * @param {object} props.progress
 * @param {boolean} props.isLoading
 * @param {string} props.activeLessonId
 * @param {string} props.activeModuleId
 * @param {(lesson: object) => void} props.onSelectLesson
 * @param {string} props.scheduleHref  Where the pinned "Batch schedule" link points.
 * @param {boolean} [props.autoFocusSearch]
 * @param {string} [props.className]
 */
export default function LessonSidebar({
  outline,
  progress,
  isLoading,
  activeLessonId,
  activeModuleId,
  onSelectLesson,
  scheduleHref,
  autoFocusSearch = false,
  className,
}) {
  const [query, setQuery] = useState('');

  // The user's own expansion choices. Search overrides the display without
  // touching this, so clearing the box restores exactly what was open before.
  const [manualOpen, setManualOpen] = useState(() =>
    activeModuleId ? new Set([activeModuleId]) : new Set(),
  );

  // Once the outline arrives we know which module holds the active lesson.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !activeModuleId) return;
    seededRef.current = true;
    setManualOpen(new Set([activeModuleId]));
  }, [activeModuleId]);

  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  /**
   * Per-module filtered lesson lists, plus which modules have any match.
   *
   * A module matches on its own title too, not only its lessons' — a subject
   * name like "Anatomy" lives on the module heading and appears in none of the
   * lesson titles beneath it, so lesson-only matching would return nothing for
   * the most obvious search a student could type. When the module itself
   * matches, all of its lessons stay visible.
   */
  const filtered = useMemo(() => {
    if (!outline?.modules || !isSearching) {
      return { byModule: {}, matchedModuleIds: new Set() };
    }

    const byModule = {};
    const matchedModuleIds = new Set();

    for (const module of outline.modules) {
      const moduleHit = matches(module.title, trimmed) || matches(module.titleBn, trimmed);
      const lessonHits = module.lessons.filter(
        (lesson) => matches(lesson.title, trimmed) || matches(lesson.titleBn, trimmed),
      );

      if (moduleHit) {
        byModule[module.id] = module.lessons;
        matchedModuleIds.add(module.id);
      } else if (lessonHits.length) {
        byModule[module.id] = lessonHits;
        matchedModuleIds.add(module.id);
      }
    }

    return { byModule, matchedModuleIds };
  }, [outline, isSearching, trimmed]);

  const openIds = isSearching ? filtered.matchedModuleIds : manualOpen;

  const toggleModule = (moduleId) => {
    setManualOpen((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  // ── Centre the active lesson on mount, once, and only if we actually scroll.
  const scrollRef = useRef(null);
  const activeRowRef = useRef(null);
  const didCentreRef = useRef(false);

  useEffect(() => {
    if (didCentreRef.current) return;
    const container = scrollRef.current;
    const row = activeRowRef.current;
    if (!container || !row) return;
    if (container.scrollHeight <= container.clientHeight) return;

    didCentreRef.current = true;
    row.scrollIntoView({ block: 'center', behavior: 'auto' });
  });

  const activeModule = outline?.modules?.find((module) => module.id === activeModuleId);
  const visibleModules = isSearching
    ? (outline?.modules ?? []).filter((module) => filtered.matchedModuleIds.has(module.id))
    : (outline?.modules ?? []);

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="shrink-0 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <ProgressHeader
          moduleTitle={activeModule?.title ?? outline?.courseTitle}
          progress={progress?.moduleProgress?.[activeModuleId]}
          isLoading={isLoading}
        />
      </div>

      <div className="shrink-0 px-4 py-3">
        <LessonSearch value={query} onChange={setQuery} autoFocus={autoFocusSearch} />
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {isLoading ? (
          <SidebarSkeleton />
        ) : visibleModules.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No lesson matches “{query}”.
          </p>
        ) : (
          visibleModules.map((module) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              isOpen={openIds.has(module.id)}
              onToggle={() => toggleModule(module.id)}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
              progress={progress?.moduleProgress?.[module.id]}
              visibleLessons={isSearching ? filtered.byModule[module.id] : undefined}
              activeRowRef={activeRowRef}
            />
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
        <Link
          to={scheduleHref}
          className={cn(
            'flex min-h-[44px] w-full items-center justify-center rounded-lg border border-brand-600 px-4',
            'text-sm font-semibold text-brand-700 transition-colors duration-150 hover:bg-brand-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            'dark:border-brand-500 dark:text-brand-300 dark:hover:bg-slate-800',
            'dark:focus-visible:ring-offset-surface-dark',
          )}
        >
          <FaRegCalendarDays aria-hidden="true" className="mr-2 h-3.5 w-3.5" />
          Batch schedule
        </Link>
      </div>
    </div>
  );
}
