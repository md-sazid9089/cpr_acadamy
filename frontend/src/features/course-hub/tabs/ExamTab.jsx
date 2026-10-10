import { useEffect, useState } from 'react';
import { FaClipboardList, FaCircleCheck, FaCircleInfo } from 'react-icons/fa6';
import { useCourseExams } from '../api/courseHub.queries.js';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { EXAM_KIND_INFO } from '@/constants';
import { cn, formatDateTime } from '@/lib/utils';

// One badge per card, each state with its own colour.
const STATE_BADGES = {
  submitted: { label: 'Submitted', className: 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300' },
  published: { label: 'Closed', className: 'bg-stone-100 text-stone-700 dark:bg-surface-dark-subtle dark:text-brand-200' },
  running: { label: 'Live', className: 'bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300' },
  upcoming: { label: 'Upcoming', className: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200' },
};

/** When the exam stops letting students in: closing time, or start + duration for a live paper. */
function windowEnd(exam) {
  const closes = exam.closesAt ? new Date(exam.closesAt).getTime() : Infinity;
  const live = exam.type === 'live' ? new Date(exam.scheduledAt).getTime() + exam.durationMinutes * 60000 : Infinity;
  return Math.min(closes, live);
}

function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days) return `${days} d ${hours} h`;
  if (hours) return `${hours} h ${minutes} min`;
  return `${minutes} min ${seconds} s`;
}

/** Re-renders every second while `active`, so a countdown stays current. */
function useNow(active) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function ExamCard({ exam }) {
  const isRunning = exam.status === 'running';
  const isUpcoming = exam.status === 'upcoming';
  // A submitted paper is locked for good: the only way forward is its result.
  const hasResult = exam.status === 'published' || exam.status === 'submitted';
  const badge = STATE_BADGES[exam.status];
  const rules = EXAM_KIND_INFO[exam.type];

  const end = windowEnd(exam);
  const showCountdown = isRunning && Number.isFinite(end);
  const now = useNow(showCountdown);

  const subtitle = isUpcoming
    ? `Starts ${formatDateTime(exam.scheduledAt)}`
    : isRunning
      ? `Started ${formatDateTime(exam.scheduledAt)}`
      : formatDateTime(exam.scheduledAt);

  return (
    <article className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-200 dark:bg-surface-dark">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-snug text-stone-900 dark:text-white">{exam.title}</h3>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-brand-200">
            {rules?.label ?? exam.type} · {subtitle}
          </p>
        </div>
        {badge && (
          <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', badge.className)}>
            {exam.status === 'submitted' && <FaCircleCheck aria-hidden="true" className="h-3 w-3" />}
            {isRunning && <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-current motion-safe:animate-pulse" />}
            {badge.label}
          </span>
        )}
      </header>

      <dl className="mt-4 grid grid-cols-1 rounded-xl border border-stone-200 min-[361px]:grid-cols-3 dark:border-stone-200">
        {[
          ['Duration', `${exam.durationMinutes} min`],
          ['Questions', exam.questionCount],
          ['Total', `${exam.totalMarks} marks`],
        ].map(([term, value], index) => (
          <div
            key={term}
            className={cn(
              'px-3 py-2.5',
              index > 0 && 'border-t border-stone-200 min-[361px]:border-l min-[361px]:border-t-0 dark:border-stone-200',
            )}
          >
            <dt className="text-xs text-stone-500 dark:text-brand-200">{term}</dt>
            <dd className="mt-0.5 text-[0.95rem] font-semibold text-stone-900 dark:text-white">{value}</dd>
          </div>
        ))}
      </dl>

      {showCountdown && (
        <p className="mt-4 text-sm font-semibold text-accent-700 dark:text-accent-300" aria-live="off">
          {end > now ? `${formatRemaining(end - now)} left to join and finish` : 'Closing now'}
        </p>
      )}

      {/* The rules matter before and during the exam; once it's over, the result is the focus. */}
      {rules && !hasResult && (
        <details open={isUpcoming} className="group mt-4 text-sm">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-medium text-brand-600 dark:text-brand-300 [&::-webkit-details-marker]:hidden">
            <FaCircleInfo aria-hidden="true" className="h-3.5 w-3.5" />
            How timing works
          </summary>
          <p className="mt-2 leading-relaxed text-stone-600 dark:text-brand-200">{rules.summary}</p>
        </details>
      )}

      <div className="mt-auto pt-4">
        {isRunning ? (
          <Button to={`/dashboard/exams/${exam.id}`} fullWidth>
            <FaClipboardList aria-hidden="true" className="h-3.5 w-3.5" />
            Start exam
          </Button>
        ) : hasResult ? (
          <Button to={`/dashboard/exams/${exam.id}/result`} fullWidth>
            View result
          </Button>
        ) : (
          <Button fullWidth variant="outline" disabled>
            Not open yet
          </Button>
        )}
      </div>
    </article>
  );
}

/** Exam tab — every published exam of the course in one list, whatever its question format. */
export default function ExamTab({ courseSlug }) {
  const { data: exams, isLoading, isError, error, isFetching, refetch } = useCourseExams(courseSlug);

  if (isLoading) {
    return (
      <ContentSkeleton label="Loading exams" />
    );
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-xl border border-stone-200 bg-white px-6 py-12 text-center dark:border-stone-200 dark:bg-surface-dark">
        <p className="text-sm font-semibold text-stone-500 dark:text-brand-200">
          {error?.message || "Couldn't load exams. Please try again."}
        </p>
        <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
          Retry
        </Button>
      </div>
    );
  }

  if (!exams?.length) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white px-6 py-12 text-center dark:border-stone-200 dark:bg-surface-dark">
        <FaClipboardList aria-hidden="true" className="mx-auto h-8 w-8 text-stone-300 dark:text-brand-200" />
        <p className="mt-3 text-sm font-semibold text-stone-500 dark:text-brand-200">
          No exams available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} />
      ))}
    </div>
  );
}
