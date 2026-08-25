import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { FaCircleQuestion, FaListUl } from 'react-icons/fa6';

import PlayerHeader from '@/features/player/components/PlayerHeader.jsx';
import LessonSidebar from '@/features/player/components/LessonSidebar.jsx';
import LessonNav from '@/features/player/components/LessonNav.jsx';
import MobileLessonSheet from '@/features/player/components/MobileLessonSheet.jsx';
import VideoPane from '@/features/player/components/panes/VideoPane.jsx';
import QuizPane from '@/features/player/components/panes/QuizPane.jsx';
import PdfPane from '@/features/player/components/panes/PdfPane.jsx';
import TextPane from '@/features/player/components/panes/TextPane.jsx';
import LockedPane from '@/features/player/components/panes/LockedPane.jsx';
import {
  useCourseOutline,
  useCourseProgress,
} from '@/features/player/hooks/useCourseOutline.js';
import { useLessonNavigation } from '@/features/player/hooks/useLessonNavigation.js';
import { isReleased } from '@/features/player/utils/lessonState.js';

import { useMyCourses } from '@/features/student-dashboard/api/dashboard.queries.js';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CATEGORY_SLUGS } from '@/constants';
import { cn } from '@/lib/utils';

const PANES = { video: VideoPane, quiz: QuizPane, pdf: PdfPane, text: TextPane };

/**
 * Public course URL for an enrolment. The catalogue route is
 * /courses/:category/:slug, so a category is needed; without one the batch
 * index is the honest fallback rather than a link that 404s.
 */
function courseHrefFor(enrollment, courseSlug) {
  const categorySlug = CATEGORY_SLUGS[enrollment?.category];
  return categorySlug ? `/courses/${categorySlug}/${courseSlug}` : '/batches';
}

/**
 * Batch schedule for an enrolment. Built separately rather than by appending
 * '/schedule' to the course URL: when the category is unknown that URL is the
 * batch index, and '/batches/schedule' is not a route.
 */
function scheduleHrefFor(enrollment, courseSlug) {
  const categorySlug = CATEGORY_SLUGS[enrollment?.category];
  return categorySlug ? `/courses/${categorySlug}/${courseSlug}/schedule` : '/batches';
}

function LoadingPane() {
  return <div className="aspect-video w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />;
}

function MissingLessonPane({ scheduleHref }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-surface-subtle px-6 py-16 text-center dark:border-slate-800 dark:bg-surface-dark-subtle">
      <FaCircleQuestion aria-hidden="true" className="h-10 w-10 text-slate-400" />
      <p className="mt-5 text-base font-semibold text-slate-700 dark:text-slate-200">
        This lesson isn&rsquo;t in the course any more.
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Check the batch schedule to pick another lesson.
      </p>
      <Link
        to={scheduleHref}
        className={cn(
          'mt-6 inline-flex min-h-[44px] items-center rounded-lg border border-brand-600 px-5',
          'text-sm font-semibold text-brand-700 transition-colors duration-150 hover:bg-brand-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'dark:border-brand-500 dark:text-brand-300 dark:hover:bg-slate-800',
          'dark:focus-visible:ring-offset-surface-dark',
        )}
      >
        Batch schedule
      </Link>
    </div>
  );
}

function ErrorPane({ onRetry }) {
  return (
    <div className="rounded-xl bg-brand-800 px-6 py-12 text-center">
      <p className="text-sm text-white">
        This lesson didn&rsquo;t load. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'mt-5 inline-flex min-h-[44px] items-center rounded-lg bg-white px-5 text-sm font-semibold text-brand-800',
          'transition-colors duration-150 hover:bg-brand-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800',
        )}
      >
        Try again
      </button>
    </div>
  );
}

/** /learn/:courseSlug/:lessonId — player shell, sidebar and mobile sheet. */
export default function CoursePlayer() {
  const { courseSlug, lessonId } = useParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: enrollments, isLoading: enrollmentsLoading } = useMyCourses();
  const outlineQuery = useCourseOutline(courseSlug);
  const progressQuery = useCourseProgress(courseSlug);

  const outline = outlineQuery.data;
  const progress = progressQuery.data;
  const isLoading = outlineQuery.isLoading || progressQuery.isLoading;
  const isError = outlineQuery.isError || progressQuery.isError;

  const nav = useLessonNavigation(outline, lessonId);
  const enrollment = enrollments?.find((item) => item.slug === courseSlug);
  const scheduleHref = scheduleHrefFor(enrollment, courseSlug);

  // The sheet is a small-screen affordance; crossing to desktop closes it so it
  // cannot linger invisibly and keep body scroll locked.
  useEffect(() => {
    if (isDesktop) setSheetOpen(false);
  }, [isDesktop]);

  // Enrolment guard. Wait for the query rather than redirecting on undefined.
  if (!enrollmentsLoading && enrollment?.status !== 'active') {
    return <Navigate to={courseHrefFor(enrollment, courseSlug)} replace />;
  }

  const goToLesson = (lesson) => {
    setSheetOpen(false);
    navigate(`/learn/${courseSlug}/${lesson.id}`);
  };

  const activeLesson = nav.activeLesson;
  // Release date, not getLessonState: the state machine promotes whatever is
  // open to 'active', so asking it here would never report a lock and the pane
  // would happily play a lesson that has not been released.
  const isLockedPane = Boolean(activeLesson) && !isReleased(activeLesson);
  const Pane = activeLesson ? PANES[activeLesson.type] : null;

  const sidebarProps = {
    outline,
    progress,
    isLoading,
    activeLessonId: lessonId,
    activeModuleId: nav.activeModuleId,
    onSelectLesson: goToLesson,
    scheduleHref,
  };

  return (
    <div className="bg-white dark:bg-surface-dark">
      <div className="container-page grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ── Content column ── */}
        <div className="min-w-0">
          <PlayerHeader
            title={activeLesson?.title}
            type={activeLesson?.type}
            isLoading={isLoading}
          />

          {/* Sticky on mobile so the pane stays put while reading below it. */}
          <div className="sticky top-0 z-20 mt-4 bg-white lg:static lg:bg-transparent dark:bg-surface-dark lg:dark:bg-transparent">
            {isError ? (
              <ErrorPane
                onRetry={() => {
                  outlineQuery.refetch();
                  progressQuery.refetch();
                }}
              />
            ) : isLoading ? (
              <LoadingPane />
            ) : !activeLesson ? (
              // The outline loaded but holds no lesson with this id — a stale
              // "continue" link or a hand-typed URL. Without this the pane would
              // sit on the skeleton for ever.
              <MissingLessonPane scheduleHref={scheduleHref} />
            ) : isLockedPane ? (
              <LockedPane lesson={activeLesson} scheduleHref={scheduleHref} />
            ) : Pane ? (
              <Pane lesson={activeLesson} />
            ) : null}
          </div>

          {/* Sheet trigger — small screens only. */}
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={cn(
                'mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4',
                'text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-offset-surface-dark',
              )}
            >
              <FaListUl aria-hidden="true" className="h-3.5 w-3.5" />
              Lessons · {progress?.overallCompleted ?? 0} / {progress?.overallTotal ?? 0}
            </button>
          )}

          {/* Desktop nav sits under the pane; mobile gets the fixed bar below. */}
          {isDesktop && (
            <LessonNav
              previousLesson={nav.previousLesson}
              nextLesson={nav.nextLesson}
              nextLockedAt={nav.nextLockedAt}
              onNavigate={goToLesson}
              className="mt-6"
            />
          )}

          {/* Spacer so the fixed bar never covers the end of the content. */}
          {!isDesktop && <div aria-hidden="true" className="h-24" />}
        </div>

        {/* ── Sidebar column — absent from the DOM below lg ── */}
        {isDesktop && (
          <aside className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-dark-subtle">
            <LessonSidebar {...sidebarProps} className="h-[calc(100vh-6rem)]" />
          </aside>
        )}
      </div>

      {/* ── Mobile: fixed nav bar + sheet ── */}
      {!isDesktop && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-4 pt-3 dark:border-slate-800 dark:bg-surface-dark"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            <LessonNav
              previousLesson={nav.previousLesson}
              nextLesson={nav.nextLesson}
              nextLockedAt={nav.nextLockedAt}
              onNavigate={goToLesson}
              className="[&>button]:min-h-[48px] [&>button]:flex-1 [&>button]:justify-center"
            />
          </div>

          <MobileLessonSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            sidebarProps={sidebarProps}
          />
        </>
      )}
    </div>
  );
}
