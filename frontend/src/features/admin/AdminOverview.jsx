import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats } from './api/admin.api.js';
import Card, { CardBody, CardHeader } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import TransactionsPanel from './AdminTransactions.jsx';

export default function AdminOverview() {
  const { data: stats, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
  });

  if (isLoading) {
    return (
      <ContentSkeleton variant="dashboard" label="Loading dashboard" />
    );
  }

  if (isError || !stats) {
    return (
      <EmptyState
        variant="error"
        title="Couldn't load the dashboard"
        description={error?.message || 'Something went wrong. Please try again.'}
        onRetry={refetch}
        isFetching={isFetching}
      />
    );
  }

  return (
    <div className="space-y-6">
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
          <p className="text-sm text-stone-600 dark:text-brand-200">
            New accounts stay inactive until approved here. Students see a pending-approval screen
            and receive an SMS the moment you activate them.
          </p>
        </CardBody>
      </Card>

      <TransactionsPanel />
    </div>
  );
}
