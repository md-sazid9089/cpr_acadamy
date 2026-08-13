import { useQuery } from '@tanstack/react-query';
import { fetchExamList } from './api/exams.api.js';
import Card from '@/components/ui/Card.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { EXAM_STATUS } from '@/constants';
import { formatDateTime } from '@/lib/utils';

const TYPE_LABELS = { live: 'Live exam', mock: 'Mock exam', practice: 'Practice set' };

/** All exams for the student's enrolled courses. */
export default function ExamList() {
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams', 'list'],
    queryFn: fetchExamList,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading exams…" />
      </div>
    );
  }

  if (!exams.length) {
    return <EmptyState title="No exams yet" description="Exams appear here once your batch schedule is published." />;
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => (
        <Card key={exam.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{TYPE_LABELS[exam.type]}</Badge>
              <StatusBadge status={exam.status} />
            </div>
            <h2 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
              {exam.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatDateTime(exam.scheduledAt)} · {exam.questionCount} questions ·{' '}
              {exam.durationMinutes} min · {exam.totalMarks} marks
            </p>
          </div>

          <div className="shrink-0">
            {exam.status === EXAM_STATUS.RUNNING && (
              <Button to={`/dashboard/exams/${exam.id}`}>Start exam</Button>
            )}
            {exam.status === EXAM_STATUS.PUBLISHED && (
              <Button to={`/dashboard/exams/${exam.id}/result`} variant="outline">
                View result
              </Button>
            )}
            {exam.status === EXAM_STATUS.UPCOMING && (
              <Button variant="outline" disabled>
                Not open yet
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
