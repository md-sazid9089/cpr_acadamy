import { useProgressSummary } from './api/dashboard.queries.js';
import ProgressBar from './components/ProgressBar.jsx';
import Card, { CardBody, CardHeader, StatCard } from '@/components/ui/Card.jsx';
import Spinner from '@/components/ui/Spinner.jsx';

export default function Progress() {
  const { data, isLoading } = useProgressSummary();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading progress…" />
      </div>
    );
  }

  const peakMinutes = Math.max(...data.weeklyActivity.map((day) => day.minutes), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Course completion" value={`${data.overallProgress}%`} />
        <StatCard label="Average exam score" value={`${data.averageScore}%`} />
        <StatCard label="Exams taken" value={data.examsTaken} />
        <StatCard label="Study hours" value={data.studyHours} />
      </div>

      <Card>
        <CardHeader title="This week" description="Minutes studied per day." />
        <CardBody>
          {/* Simple CSS bar chart — no charting library needed at this size. */}
          <div className="flex h-40 items-end justify-between gap-3">
            {data.weeklyActivity.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {day.minutes}m
                </span>
                <div
                  className="w-full rounded-t-lg bg-brand-500 dark:bg-brand-600"
                  style={{ height: `${(day.minutes / peakMinutes) * 100}%` }}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">{day.day}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Needs work" description="Accuracy below 60% in recent exams." />
          <CardBody className="space-y-4">
            {data.weakTopics.map((topic) => (
              <ProgressBar key={topic.topic} value={topic.accuracy} label={topic.topic} />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Your strengths" />
          <CardBody className="space-y-4">
            {data.strongTopics.map((topic) => (
              <ProgressBar key={topic.topic} value={topic.accuracy} label={topic.topic} />
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
