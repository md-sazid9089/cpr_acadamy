import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaNoteSticky,
  FaFilePdf,
  FaCircleQuestion,
  FaDownload,
  FaCheck,
} from 'react-icons/fa6';
import VideoPlayer from '@/features/learning/components/VideoPlayer.jsx';
import SecurePdfViewer from '@/features/learning/components/SecurePdfViewer.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Button from '@/components/ui/Button.jsx';
import { useCourseVideos } from '@/features/course-hub/api/courseHub.queries.js';
import { markLessonComplete } from '@/features/course-hub/api/courseHub.api.js';
import { useMyCourses, dashboardKeys, useCreateComplaint } from '@/features/student-dashboard/api/dashboard.queries.js';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

/** 'YYYY-MM-DD' → 'DD Mon YYYY'. */
function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const TOOL_TABS = [
  { id: 'notes', label: 'Note Down', icon: FaNoteSticky },
  { id: 'sheet', label: 'Lecture Sheet', icon: FaFilePdf },
  { id: 'doubt', label: 'Ask a Doubt', icon: FaCircleQuestion },
];

/** Personal notes for a lesson, kept in the browser keyed by course + lesson. */
function NotesPanel({ courseSlug, lessonId }) {
  const storageKey = `cpr:notes:${courseSlug}:${lessonId}`;
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setText(localStorage.getItem(storageKey) ?? '');
    setSaved(false);
  }, [storageKey]);

  const save = () => {
    localStorage.setItem(storageKey, text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <p className="text-sm text-slate-500">
        Jot down key points while you watch. Your notes are saved to this device for each lesson.
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        rows={8}
        placeholder="Type your notes here…"
        className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={!text.trim()}>
          Save Note
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <FaCheck aria-hidden="true" className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}

/** Downloadable / viewable lecture sheet for the lesson. */
function LectureSheetPanel({ lesson }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <FaFilePdf aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Lecture Sheet (PDF)</p>
            <p className="text-xs text-slate-500">{lesson.title}</p>
          </div>
        </div>
        {lesson.notesUrl ? (
          <Button size="sm" variant="outline" href={lesson.notesUrl} target="_blank" rel="noreferrer">
            <FaDownload aria-hidden="true" className="h-3 w-3" />
            Download
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled title="Sheet will be available once uploaded">
            <FaDownload aria-hidden="true" className="h-3 w-3" />
            Download
          </Button>
        )}
      </div>

      <div className="mt-4">
        <SecurePdfViewer title={`${lesson.title} — Lecture Sheet`} />
      </div>
    </div>
  );
}

/** Submit a question about the lesson to the mentors (opens a support thread). */
function DoubtPanel({ lesson, courseTitle }) {
  const [question, setQuestion] = useState('');
  const send = useCreateComplaint();

  const submit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    send.mutate(
      { relatedTo: 'Class & Schedule', batchTitle: courseTitle ?? '', body: `[${lesson.title}] ${question.trim()}` },
      { onSuccess: () => setQuestion('') },
    );
  };

  return (
    <form onSubmit={submit}>
      <p className="text-sm text-slate-500">
        Stuck on something in “{lesson.title}”? Send your question and a mentor will reply in your Complain Box.
      </p>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={6}
        placeholder="Describe your doubt…"
        className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" type="submit" disabled={!question.trim()} isLoading={send.isPending}>
          Submit Doubt
        </Button>
        {send.isSuccess && !send.isPending && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <FaCheck aria-hidden="true" className="h-3 w-3" />
            Sent to mentors
          </span>
        )}
        {send.isError && <span className="text-xs font-medium text-red-600">{send.error.message}</span>}
      </div>
    </form>
  );
}

/**
 * Lecture player at /learn/:courseSlug/:lessonId.
 *
 * Reached from the course hub's "At a glance" tab. Shows the selected lecture
 * with a playlist plus note-taking, lecture-sheet and doubt tools.
 */
export default function CoursePlayer() {
  const { courseSlug, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState('notes');

  const { data: videoGroups = [], isLoading } = useCourseVideos(courseSlug);
  const { data: courses = [] } = useMyCourses();
  const course = courses.find((c) => c.slug === courseSlug);
  const queryClient = useQueryClient();

  // Finishing the video is what counts as completing the lesson.
  const complete = useMutation({
    mutationFn: markLessonComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.myCourses });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.progress });
    },
  });

  // Flatten the date-grouped playlist so we can find the current lesson and
  // step to the one before / after it.
  const lessons = useMemo(
    () =>
      videoGroups.flatMap((group) =>
        group.videos.map((video) => ({ ...video, date: group.date, time: group.time })),
      ),
    [videoGroups],
  );

  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const current = currentIndex >= 0 ? lessons[currentIndex] : null;
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const watermark = user?.fullName || user?.mobile || undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" label="Loading lecture…" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <p className="text-lg font-semibold text-slate-900">This lecture could not be found.</p>
        <Button to={`/dashboard/course/${courseSlug}`}>Back to course</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <Link
          to={`/dashboard/course/${courseSlug}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Back to course"
        >
          <FaArrowLeft aria-hidden="true" className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {course?.title ?? 'Course'}
          </p>
          <p className="truncate text-xs text-slate-500">
            Lesson {currentIndex + 1} of {lessons.length}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Player column */}
        <div className="min-w-0 space-y-5">
          <VideoPlayer src={current.src} title={current.title} watermark={watermark} onEnded={() => complete.mutate(current.id)} />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-base font-bold leading-snug text-slate-900 sm:text-lg">
              {current.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {formatDateLabel(current.date)} · {current.time}
              {current.duration ? ` · ${current.duration}` : ''}
            </p>

            {/* Prev / Next */}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={!prev}
                onClick={() => prev && navigate(`/learn/${courseSlug}/${prev.id}`)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <FaChevronLeft aria-hidden="true" className="h-3 w-3" />
                Previous
              </button>
              <button
                type="button"
                disabled={!next}
                onClick={() => next && navigate(`/learn/${courseSlug}/${next.id}`)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-40"
              >
                Next
                <FaChevronRight aria-hidden="true" className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Tools: Note Down · Lecture Sheet · Ask a Doubt */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div role="tablist" className="flex gap-1.5 border-b border-slate-100 p-1.5">
              {TOOL_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTool === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTool(tab.id)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm',
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-white' : 'text-brand-500')}
                    />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-5">
              {activeTool === 'notes' && <NotesPanel courseSlug={courseSlug} lessonId={lessonId} />}
              {activeTool === 'sheet' && <LectureSheetPanel lesson={current} />}
              {activeTool === 'doubt' && <DoubtPanel lesson={current} courseTitle={course?.title} />}
            </div>
          </div>
        </div>

        {/* Playlist */}
        <aside className="lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Lessons in this batch</h2>
            <div className="space-y-4">
              {videoGroups.map((group) => (
                <div key={group.date}>
                  <p className="mb-2 text-xs font-medium text-slate-400">
                    {formatDateLabel(group.date)} · {group.time}
                  </p>
                  <div className="space-y-1.5">
                    {group.videos.map((video) => {
                      const isCurrent = video.id === lessonId;
                      return (
                        <Link
                          key={video.id}
                          to={`/learn/${courseSlug}/${video.id}`}
                          className={cn(
                            'flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition',
                            isCurrent ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50',
                          )}
                          aria-current={isCurrent ? 'true' : undefined}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                              isCurrent ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
                            )}
                          >
                            <FaPlay aria-hidden="true" className="h-2.5 w-2.5" />
                          </span>
                          <span className="min-w-0">
                            <span
                              className={cn(
                                'block text-xs font-medium leading-snug line-clamp-2',
                                isCurrent ? 'text-brand-800' : 'text-slate-700',
                              )}
                            >
                              {video.title}
                            </span>
                            {video.duration && (
                              <span className="mt-0.5 block text-[11px] text-slate-400">
                                {video.duration}
                              </span>
                            )}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
