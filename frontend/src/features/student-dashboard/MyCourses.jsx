import { useMyCourses } from './api/dashboard.queries.js';
import ProgressBar from './components/ProgressBar.jsx';
import Card from '@/components/ui/Card.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { formatDate } from '@/lib/utils';

export default function MyCourses() {
  const { data: courses = [], isLoading } = useMyCourses();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading your courses…" />
      </div>
    );
  }

  if (!courses.length) {
    return (
      <EmptyState
        title="You haven't enrolled yet"
        description="Browse the catalogue and join a batch to get started."
        action={<Button to="/courses">Browse courses</Button>}
      />
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {courses.map((course) => {
        const isPending = course.status === 'pending_payment';
        return (
          <Card key={course.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <Badge tone="brand">{course.category}</Badge>
              <StatusBadge status={course.status} />
            </div>

            <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
              {course.title}
            </h2>

            {course.expiresOn && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Access until {formatDate(course.expiresOn)}
              </p>
            )}

            <ProgressBar
              className="mt-4"
              value={course.progress}
              label={`${course.completedLessons}/${course.lessonCount} lessons`}
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button
                to={`/dashboard/learn/${course.slug}`}
                variant="outline"
                fullWidth
                disabled={isPending}
              >
                {course.progress > 0 ? 'Continue' : 'Start'}
              </Button>
              {isPending ? (
                <Button to={`/dashboard/checkout/${course.slug}`} fullWidth>
                  Complete payment
                </Button>
              ) : (
                <Button to="/dashboard/exams" fullWidth>
                  Exams
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
