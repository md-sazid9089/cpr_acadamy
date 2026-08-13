import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats } from './api/admin.api.js';
import Card, { CardBody, CardHeader, StatCard } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { formatBDT } from '@/lib/utils';

export default function AdminOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
  });

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total students" value={stats.totalStudents.toLocaleString('en-BD')} hint={`+${stats.newRegistrations7d} in the last 7 days`} />
        <StatCard label="Pending approvals" value={stats.pendingApprovals} hint="Accounts waiting for activation" />
        <StatCard label="Active courses" value={stats.activeCourses} />
        <StatCard label="Revenue this month" value={formatBDT(stats.revenueThisMonth)} />
        <StatCard label="Exams this week" value={stats.examsThisWeek} />
        <StatCard label="New registrations" value={stats.newRegistrations7d} hint="Last 7 days" />
      </div>

      <Card>
        <CardHeader
          title="Approval queue"
          description={`${stats.pendingApprovals} registrations are waiting for review.`}
          action={
            <Button to="/admin/students" size="sm">
              Review now
            </Button>
          }
        />
        <CardBody>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            New accounts stay inactive until approved here. Students see a pending-approval screen
            and receive an SMS the moment you activate them.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
