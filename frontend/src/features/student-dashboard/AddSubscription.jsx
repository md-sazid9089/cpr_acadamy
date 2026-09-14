import { Link, useParams } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa6';
import { useSubscriptionBatches, useSubscriptionPlans } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardPanel from './components/DashboardPanel.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { formatBDT } from '@/lib/utils';

/**
 * /dashboard/subscriptions/:batchId/add — the packages still purchasable for a
 * batch. Subscribing opens the checkout for the batch's course with the plan
 * pre-selected.
 */
export default function AddSubscription() {
  const { batchId } = useParams();
  const { data: plans = [], isLoading } = useSubscriptionPlans(batchId);
  const { data: batches = [] } = useSubscriptionBatches();
  const batch = batches.find((item) => item.id === batchId);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Add Subscriptions"
        backTo={`/dashboard/subscriptions/${batchId}`}
        showDashboardLink={false}
      />

      <DashboardPanel title="Available Subscription Packages">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" label="Loading packages…" />
          </div>
        ) : plans.length === 0 ? (
          <p className="py-10 text-center text-sm text-stone-500 dark:text-brand-200">
            No subscription packages are on offer for this batch right now.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-col rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-stone-200 dark:border-stone-200 dark:bg-surface-dark"
              >
                <h2 className="text-center text-base font-bold text-brand-600 dark:text-brand-300">
                  {plan.name}
                </h2>
                <p className="mt-1 text-center text-xs text-stone-500 dark:text-brand-200">
                  {plan.durationLabel}
                </p>

                <p className="mt-3 text-center text-2xl font-extrabold text-stone-900 dark:text-white">
                  {formatBDT(plan.amount)}
                </p>

                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2 text-xs text-stone-600 dark:text-brand-200"
                    >
                      <FaCheck
                        aria-hidden="true"
                        className="mt-0.5 h-3 w-3 shrink-0 text-brand-500"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to={batch ? `/dashboard/checkout/${batch.slug}?batchId=${batchId}&planId=${plan.id}` : '#'}
                  aria-disabled={!batch}
                  className="mt-5 flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white border border-stone-200 transition hover:bg-brand-700 aria-disabled:pointer-events-none aria-disabled:opacity-50 sm:text-sm"
                >
                  Subscribe
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>
    </div>
  );
}
