import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import VideoPlayer from './components/VideoPlayer.jsx';
import LectureNotes from './LectureNotes.jsx';
import SecurePdfViewer from './components/SecurePdfViewer.jsx';
import { fetchCourseLessons, fetchLesson } from './api/learning.api.js';
import Card from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'notes', label: 'Lecture notes' },
  { id: 'pdf', label: 'Attachments' },
];

/** Learning screen at /dashboard/learn/:slug — player, curriculum, notes. */
export default function LessonPlayer() {
  const { slug } = useParams();
  const [activeLessonId, setActiveLessonId] = useState('l-4');
  const [tab, setTab] = useState('notes');
  const user = useAuthStore((s) => s.user);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['learning', 'lessons', slug],
    queryFn: () => fetchCourseLessons(slug),
    enabled: Boolean(slug),
  });

  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ['learning', 'lesson', activeLessonId],
    queryFn: () => fetchLesson(activeLessonId),
    enabled: Boolean(activeLessonId),
  });

  if (courseLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading course…" />
      </div>
    );
  }

  const watermark = user ? `${user.fullName} · ${user.mobile}` : 'CPR Medical Academy';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <VideoPlayer
          src={lesson?.videoUrl}
          title={lesson?.title ?? course?.courseTitle}
          watermark={watermark}
        />

        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {lesson?.title ?? 'Select a lesson'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course?.courseTitle}</p>
        </div>

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                tab === item.id
                  ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {lessonLoading ? (
          <div className="flex justify-center py-12">
            <Spinner label="Loading lesson…" />
          </div>
        ) : tab === 'notes' ? (
          <LectureNotes markdown={lesson?.notes} />
        ) : (
          <div className="space-y-4">
            {lesson?.attachments?.map((attachment) => (
              <SecurePdfViewer
                key={attachment.id}
                title={attachment.title}
                pageCount={attachment.pages}
                watermark={watermark}
              />
            ))}
          </div>
        )}
      </div>

      <aside>
        <Card className="sticky top-24 overflow-hidden">
          <p className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            Course content
          </p>

          <div className="max-h-[70vh] overflow-y-auto">
            {course?.modules.map((module) => (
              <div key={module.id}>
                <p className="bg-surface-subtle px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  {module.title}
                </p>
                <ul>
                  {module.lessons.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        disabled={item.isLocked}
                        onClick={() => setActiveLessonId(item.id)}
                        className={cn(
                          'flex w-full items-start gap-3 px-5 py-3 text-left text-sm transition-colors',
                          item.id === activeLessonId
                            ? 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60',
                          item.isLocked && 'cursor-not-allowed opacity-60',
                        )}
                      >
                        <span className="mt-0.5">
                          {item.isLocked ? '🔒' : item.isCompleted ? '✅' : '▶️'}
                        </span>
                        <span className="flex-1">
                          {item.title}
                          {item.durationMinutes > 0 && (
                            <span className="mt-0.5 block text-xs text-slate-400">
                              {item.durationMinutes} min
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <Button fullWidth variant="outline" to="/dashboard/courses">
              Back to my courses
            </Button>
          </div>
        </Card>
      </aside>
    </div>
  );
}
