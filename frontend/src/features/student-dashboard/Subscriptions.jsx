import { Link } from 'react-router-dom';
import { useSubscriptionBatches } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardPanel from './components/DashboardPanel.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Button from '@/components/ui/Button.jsx';

/** Solid primary action — matches the "View Subscriptions" button. */
const PRIMARY_ACTION =
  'flex items-center justify-center rounded-lg bg-[#1c4d96] px-4 py-2.5 text-center text-xs font-bold text-white shadow-sm transition hover:bg-[#163d78] sm:text-sm';

/** Tinted secondary action — matches the pink "Add Subscriptions" button. */
const SECONDARY_ACTION =
  'flex items-center justify-center rounded-lg bg-gradient-to-r from-rose-50 to-blue-50 px-4 py-2.5 text-center text-xs font-bold text-[#1c4d96] shadow-sm ring-1 ring-rose-100 transition hover:from-rose-100 hover:to-blue-100 sm:text-sm dark:from-slate-800 dark:to-slate-800 dark:text-blue-300 dark:ring-slate-700 dark:hover:from-slate-700 dark:hover:to-slate-700';

/**
 * /dashboard/subscriptions — the batches this student can hold subscriptions
 * against. Each card leads either to that batch's subscription list or straight
 * to the add flow.
 */
export default function Subscriptions() {
  const { data: batches = [], isLoading } = useSubscriptionBatches();

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Subscriptions" backTo="/dashboard" />

      <DashboardPanel title="Subscription Available Batches">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" label="Loading batches…" />
          </div>
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
                className="rounded-xl border-2 border-blue-300 bg-white p-5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
              >
                <h2 className="text-center text-base font-bold text-[#1c4d96] sm:text-lg dark:text-blue-300">
                  {batch.title}
                </h2>

                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                  Reg No:
                  <strong className="ml-1 text-slate-900 dark:text-white">{batch.regNo}</strong>
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
