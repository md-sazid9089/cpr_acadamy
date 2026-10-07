import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCheck, FaTriangleExclamation, FaClockRotateLeft } from 'react-icons/fa6';
import { useSubscriptions } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardTabs from './components/DashboardTabs.jsx';
import { SECONDARY_ACTION } from './Subscriptions.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { formatBDT, formatDate } from '@/lib/utils';

const TABS = [
  { id: 'active', label: 'Active Subscriptions', icon: FaCheck, iconColor: 'text-brand-500' },
  { id: 'unpaid', label: 'Unpaid Subscriptions', icon: FaTriangleExclamation, iconColor: 'text-brand-500' },
  { id: 'previous', label: 'Previous Subscriptions', icon: FaClockRotateLeft, iconColor: 'text-brand-500' },
];

/** Empty-state wording per tab, matching the reference's phrasing. */
const EMPTY_TEXT = {
  active: 'No active subscription found',
  unpaid: 'No unpaid subscription found',
  previous: 'No previous subscription found',
};

/**
 * /dashboard/subscriptions/:batchId — one batch's subscriptions, split across
 * the active / unpaid / previous tabs.
 */
export default function SubscriptionDetail() {
  const { batchId } = useParams();
  const [activeTab, setActiveTab] = useState('active');
  const { data, isLoading, isError, isFetching, refetch } = useSubscriptions(batchId);

  const items = data?.[activeTab] ?? [];
  const addHref = `/dashboard/subscriptions/${batchId}/add`;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Subscriptions"
        backTo="/dashboard/subscriptions"
        showDashboardLink={false}
      />

      <DashboardTabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-200 dark:bg-surface-dark-subtle">
        {isLoading ? (
          <ContentSkeleton label="Loading subscriptions" />
        ) : isError ? (
          <EmptyState
            variant="error"
            title="Your subscriptions could not be loaded"
            description="Check your connection and try again."
            onRetry={refetch}
            isFetching={isFetching}
          />
        ) : items.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-base italic text-stone-700 dark:text-brand-200">
              {EMPTY_TEXT[activeTab]}
            </p>
            <Link to={addHref} className={`${SECONDARY_ACTION} mx-auto mt-4 w-fit px-6`}>
              Add Subscriptions
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-200 dark:bg-surface-dark"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-bold text-brand-600 sm:text-base dark:text-brand-300">
                    {item.name}
                  </h2>
                  <span className="shrink-0 text-sm font-bold text-stone-900 dark:text-white">
                    {formatBDT(item.amount)}
                  </span>
                </div>

                {item.description && (
                  <p className="mt-1.5 text-xs text-stone-600 sm:text-sm dark:text-brand-200">
                    {item.description}
                  </p>
                )}

                <dl className="mt-4 space-y-2 border-t border-stone-200 pt-3 text-xs dark:border-stone-200">
                  {activeTab === 'unpaid' ? (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-stone-500 dark:text-brand-200">Invoiced on</dt>
                        <dd className="font-semibold text-stone-800 dark:text-brand-200">
                          {formatDate(item.invoicedOn)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-stone-500 dark:text-brand-200">Status</dt>
                        <dd className="font-semibold text-brand-500 dark:text-brand-200">
                          {item.awaitingApproval ? 'Awaiting approval' : 'Payment pending'}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-stone-500 dark:text-brand-200">Started</dt>
                        <dd className="font-semibold text-stone-800 dark:text-brand-200">
                          {formatDate(item.startsOn)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-stone-500 dark:text-brand-200">
                          {activeTab === 'active' ? 'Valid until' : 'Ended'}
                        </dt>
                        <dd className="font-semibold text-stone-800 dark:text-brand-200">
                          {formatDate(item.endsOn)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>

                {/* An unpaid item's id is its invoice, which is where the transaction ID gets submitted. */}
                {activeTab === 'unpaid' && (
                  <Link
                    to={`/dashboard/invoices/${item.id}`}
                    className="mt-4 flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white border border-stone-200 transition hover:bg-brand-700 sm:text-sm"
                  >
                    {item.awaitingApproval ? 'View Invoice' : 'Pay Now'}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
