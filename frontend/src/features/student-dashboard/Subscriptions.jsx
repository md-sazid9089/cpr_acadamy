import { Link } from 'react-router-dom';
import { useSubscriptionBatches } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardPanel from './components/DashboardPanel.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Button from '@/components/ui/Button.jsx';

/** Solid primary action — matches the "View Subscriptions" button. */
const PRIMARY_ACTION =
  'flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-center text-xs font-bold text-white border border-stone-200 transition hover:bg-brand-700 sm:text-sm';

/** Tinted secondary action — matches the pink "Add Subscriptions" button. */
const SECONDARY_ACTION =
  'flex items-center justify-center rounded-lg bg-brand-50 px-4 py-2.5 text-center text-xs font-bold text-brand-600 border border-stone-200 transition hover:bg-brand-100 sm:text-sm dark:bg-surface-dark dark:text-brand-300 dark:hover:bg-surface-dark';

/**
 * /dashboard/subscriptions — the batches this student can hold subscriptions
 * against. Each card leads either to that batch's subscription list or straight
 * to the add flow.
 */
export default function Subscriptions() {
  const { data: batches = [], isLoading } = useSubscriptionBatches();

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Subscriptions" backTo="/dashboard" showDashboardLink={false} />

      <DashboardPanel title="Subscription Available Batches">
        {isLoading ? (
          <ContentSkeleton variant="cards" label="Loading batches" />
        ) : batches.length === 0 ? (
          <EmptyState
            title="No subscription available batches"
            description="Enrol in a batch first — subscriptions are added on top of an active enrolment."
            action={<Button to="/batches">Browse Batches</Button>}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-stone-200 dark:border-stone-200 dark:bg-surface-dark"
              >
                <h2 className="text-center text-base font-bold text-brand-600 sm:text-lg dark:text-brand-300">
                  {batch.title}
                </h2>

                <p className="mt-2 text-center text-sm text-stone-600 dark:text-brand-200">
                  Reg No:
                  <strong className="ml-1 text-stone-900 dark:text-white">{batch.regNo}</strong>
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link to={`/dashboard/subscriptions/${batch.id}`} className={PRIMARY_ACTION}>
                    View Subscriptions
                  </Link>
                  <Link
                    to={`/dashboard/subscriptions/${batch.id}/add`}
                    className={SECONDARY_ACTION}
                  >
                    Add Subscriptions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}

export { PRIMARY_ACTION, SECONDARY_ACTION };
