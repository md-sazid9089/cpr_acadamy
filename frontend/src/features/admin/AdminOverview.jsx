import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats } from './api/admin.api.js';
import TransactionsPanel from './AdminTransactions.jsx';
import ApprovalQueue from './dashboard/ApprovalQueue.jsx';

/** Admin dashboard: the two things waiting on an admin, side by side on wide screens. */
export default function AdminOverview() {
  // The waiting count for the approval queue; the card shows its own list even if this is still loading.
  const { data: stats } = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchAdminStats });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <ApprovalQueue pendingCount={stats?.pendingApprovals} />
      <TransactionsPanel />
    </div>
  );
}
