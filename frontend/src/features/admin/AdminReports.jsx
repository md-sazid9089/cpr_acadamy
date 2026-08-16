import { useQuery } from '@tanstack/react-query';
import { fetchAdminReports } from './api/admin.api.js';
import Card, { CardBody, CardHeader, StatCard } from '@/components/ui/Card.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { formatBDT } from '@/lib/utils';

export default function AdminReports() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'reports'], queryFn: fetchAdminReports });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading reports…" />
      </div>
    );
  }

  const peakRevenue = Math.max(...data.revenueByMonth.map((month) => month.amount), 1);
  const totalEnrolment = data.enrolmentByCategory.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Exams held" value={data.examParticipation.examsHeld} />
        <StatCard label="Average attendance" value={`${data.examParticipation.averageAttendance}%`} />
        <StatCard label="Average score" value={`${data.examParticipation.averageScore}%`} />
      </div>

      <Card>
        <CardHeader title="Revenue" description="Last six months." />
        <CardBody>
          {/* CSS bars — a charting library isn't warranted for six data points. */}
          <div className="flex h-48 items-end justify-between gap-4">
            {data.revenueByMonth.map((month) => (
              <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {Math.round(month.amount / 1000)}k
                </span>
                <div
                  className="w-full rounded-t-lg bg-brand-500 dark:bg-brand-600"
                  style={{ height: `${(month.amount / peakRevenue) * 100}%` }}
                  title={formatBDT(month.amount)}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">{month.month}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Enrolment by category" />
        <CardBody className="space-y-4">
          {data.enrolmentByCategory.map((item) => {
            const share = Math.round((item.count / totalEnrolment) * 100);
            return (
              <div key={item.category}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.category}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.count.toLocaleString('en-BD')} ({share}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${share}%` }} />
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
