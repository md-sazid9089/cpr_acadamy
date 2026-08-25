import { Link, useParams } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa6';
import { useSubscriptionPlans } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardPanel from './components/DashboardPanel.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { formatBDT } from '@/lib/utils';

/**
 * /dashboard/subscriptions/:batchId/add — the packages still purchasable for a
 * batch.
 *
 * NOTE: the reference screenshots stop at the "Add Subscriptions" button, so
 * this screen is inferred rather than copied. Confirm the real plan fields with
 * the client before wiring the backend.
 */
export default function AddSubscription() {
  const { batchId } = useParams();
  const { data: plans = [], isLoading } = useSubscriptionPlans(batchId);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Add Subscriptions" backTo={`/dashboard/subscriptions/${batchId}`} />

      <DashboardPanel title="Available Subscription Packages">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" label="Loading packages…" />
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-col rounded-xl border-2 border-blue-300 bg-white p-5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
              >
                <h2 className="text-center text-base font-bold text-[#1c4d96] dark:text-blue-300">
                  {plan.name}
                </h2>
                <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                  {plan.durationLabel}
                </p>

                <p className="mt-3 text-center text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatBDT(plan.amount)}
                </p>

                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <FaCheck
                        aria-hidden="true"
                        className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/dashboard/checkout/${batchId}`}
                  className="mt-5 flex items-center justify-center rounded-lg bg-[#1c4d96] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#163d78] sm:text-sm"
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
