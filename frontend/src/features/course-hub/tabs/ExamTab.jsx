import { Link } from 'react-router-dom';
import { FaClipboardList, FaCircleCheck } from 'react-icons/fa6';
import { useCourseExams } from '../api/courseHub.queries.js';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { EXAM_KIND_INFO } from '@/constants';
import { formatDateTime } from '@/lib/utils';

function ExamCard({ exam }) {
  const isRunning = exam.status === 'running';
  // A submitted paper is locked for good: the only way forward is its result.
  const hasResult = exam.status === 'published' || exam.status === 'submitted';

  return (
    <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-200 dark:border-stone-200 dark:bg-surface-dark dark:hover:border-stone-200">
      <div>
        {/* Title */}
        <h3 className="text-sm font-bold text-stone-900 dark:text-white">
          {exam.title}
        </h3>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={exam.status} />
          <Badge tone="brand">{exam.type}</Badge>
        </div>

        {/* Meta */}
        <div className="mt-3 space-y-1 text-xs text-stone-600 dark:text-brand-200">
          <p>
            <span className="font-semibold text-stone-700 dark:text-brand-200">Scheduled:</span>{' '}
            {formatDateTime(exam.scheduledAt)}
          </p>
          <p>
            <span className="font-semibold text-stone-700 dark:text-brand-200">Duration:</span>{' '}
            {exam.durationMinutes} minutes
          </p>
          <p>
            <span className="font-semibold text-stone-700 dark:text-brand-200">Questions:</span>{' '}
            {exam.questionCount} · {exam.totalMarks} marks
          </p>
          {EXAM_KIND_INFO[exam.type] && <p>{EXAM_KIND_INFO[exam.type].summary}</p>}
        </div>
      </div>

      {/* Action */}
      <div className="mt-4">
        {isRunning ? (
          <Link to={`/dashboard/exams/${exam.id}`}>
            <Button fullWidth size="sm">
              <FaClipboardList aria-hidden="true" className="h-3 w-3" />
              Start Exam
            </Button>
          </Link>
        ) : hasResult ? (
          <Link to={`/dashboard/exams/${exam.id}/result`}>
            <Button fullWidth variant="outline" size="sm">
              <FaCircleCheck aria-hidden="true" className="h-3 w-3" />
              View Result
            </Button>
          </Link>
        ) : (
          <Button fullWidth variant="outline" size="sm" disabled>
            Not open yet
          </Button>
        )}
      </div>
    </div>
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
