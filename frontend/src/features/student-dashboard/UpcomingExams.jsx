import { useUpcomingExams } from './api/dashboard.queries.js';
import { FaTrophy } from 'react-icons/fa6';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import Card from '@/components/ui/Card.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { EXAM_STATUS } from '@/constants';
import { formatDateTime } from '@/lib/utils';

const TYPE_LABELS = { live: 'Live exam', mock: 'Mock exam', practice: 'Practice set' };

export default function UpcomingExams() {
  const { data: exams = [], isLoading } = useUpcomingExams();

  if (isLoading) {
    return (
      <ContentSkeleton label="Loading exams" />
    );
  }

  return (
    <div className="space-y-4">
      <DashboardPageHeader title="My Exams" backTo="/dashboard" />
      <div className="flex justify-end"><Button variant="outline" to="/dashboard/exam-positions"><FaTrophy aria-hidden="true" />Exam positions</Button></div>
      {!exams.length && (
        <EmptyState
          title="No exams scheduled"
          description="Exams for your batch appear here as soon as they're published."
        />
      )}
      {exams.map((exam) => {
        const isRunning = exam.status === EXAM_STATUS.RUNNING;
        return (
          <Card key={exam.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{TYPE_LABELS[exam.type]}</Badge>
                <StatusBadge status={exam.status} />
              </div>
              <h2 className="mt-2 text-base font-semibold text-stone-900 dark:text-white">
                {exam.title}
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-brand-200">
                {exam.courseTitle} · {formatDateTime(exam.scheduledAt)}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">
                {exam.questionCount} questions · {exam.totalMarks} marks · {exam.durationMinutes}{' '}
                minutes
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" to={`/dashboard/exam-positions?examId=${exam.id}`}><FaTrophy aria-hidden="true" />Positions</Button>
              {isRunning ? (
                <Button to={`/dashboard/exams/${exam.id}`}>Start exam</Button>
              ) : exam.status === EXAM_STATUS.SUBMITTED || exam.status === EXAM_STATUS.PUBLISHED ? (
                <Button variant="outline" to={`/dashboard/exams/${exam.id}/result`}>
                  View result
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Opens {formatDateTime(exam.scheduledAt)}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
