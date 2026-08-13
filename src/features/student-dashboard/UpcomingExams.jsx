import { useUpcomingExams } from './api/dashboard.queries.js';
import Card from '@/components/ui/Card.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { EXAM_STATUS } from '@/constants';
import { formatDateTime } from '@/lib/utils';

const TYPE_LABELS = { live: 'Live exam', mock: 'Mock exam', practice: 'Practice set' };

export default function UpcomingExams() {
  const { data: exams = [], isLoading } = useUpcomingExams();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading exams…" />
      </div>
    );
  }

  if (!exams.length) {
    return (
      <EmptyState
        title="No exams scheduled"
        description="Exams for your batch appear here as soon as they're published."
      />
    );
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => {
        const isRunning = exam.status === EXAM_STATUS.RUNNING;
        return (
          <Card key={exam.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{TYPE_LABELS[exam.type]}</Badge>
                <StatusBadge status={exam.status} />
              </div>
              <h2 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {exam.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {exam.courseTitle} · {formatDateTime(exam.scheduledAt)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {exam.questionCount} questions · {exam.totalMarks} marks · {exam.durationMinutes}{' '}
                minutes
              </p>
            </div>

            <div className="shrink-0">
              {isRunning ? (
                <Button to={`/dashboard/exams/${exam.id}`}>Start exam</Button>
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
