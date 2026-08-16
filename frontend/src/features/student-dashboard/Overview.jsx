import { Link } from 'react-router-dom';
import { useMyCourses, useProgressSummary, useUpcomingExams } from './api/dashboard.queries.js';
import ProgressBar from './components/ProgressBar.jsx';
import Card, { CardBody, CardHeader, StatCard } from '@/components/ui/Card.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { formatDateTime } from '@/lib/utils';

/** Landing panel at /dashboard. */
export default function Overview() {
  const { data: courses = [], isLoading: coursesLoading } = useMyCourses();
  const { data: progress, isLoading: progressLoading } = useProgressSummary();
  const { data: exams = [], isLoading: examsLoading } = useUpcomingExams();

  if (coursesLoading || progressLoading || examsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading your dashboard…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall progress" value={`${progress.overallProgress}%`} hint={`${progress.lessonsCompleted} of ${progress.lessonsTotal} lessons`} />
        <StatCard label="Exams taken" value={progress.examsTaken} hint={`Average ${progress.averageScore}%`} />
        <StatCard label="Best rank" value={`#${progress.bestRank}`} hint="Across all mock exams" />
        <StatCard label="Study time" value={`${progress.studyHours} h`} hint="Since enrolment" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Continue learning"
            description="Pick up where you left off."
            action={
              <Button to="/dashboard/courses" variant="ghost" size="sm">
                All courses
              </Button>
            }
          />
          <CardBody className="space-y-4">
            {courses
              .filter((course) => course.status === 'active')
              .map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge tone="brand">{course.category}</Badge>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {course.title}
                      </p>
                      {course.nextLesson && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Next: {course.nextLesson.title}
                        </p>
                      )}
                    </div>
                    <Button to={`/dashboard/learn/${course.slug}`} size="sm">
                      Resume
                    </Button>
                  </div>
                  <ProgressBar
                    className="mt-4"
                    value={course.progress}
                    label={`${course.completedLessons}/${course.lessonCount} lessons`}
                  />
                </div>
              ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Upcoming exams"
            action={
              <Button to="/dashboard/exams" variant="ghost" size="sm">
                View all
              </Button>
            }
          />
          <CardBody className="space-y-3">
            {exams.slice(0, 3).map((exam) => (
              <Link
                key={exam.id}
                to="/dashboard/exams"
                className="block rounded-lg border border-slate-200 p-3 transition-colors hover:border-brand-400 dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{exam.title}</p>
                  <StatusBadge status={exam.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatDateTime(exam.scheduledAt)} · {exam.durationMinutes} min ·{' '}
                  {exam.questionCount} questions
                </p>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Topics to revise" description="Lowest accuracy across your recent exams." />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          {progress.weakTopics.map((topic) => (
            <div key={topic.topic}>
              <ProgressBar value={topic.accuracy} label={topic.topic} />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
