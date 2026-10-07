import { Link } from 'react-router-dom';
import { FaClockRotateLeft } from 'react-icons/fa6';
import { useMyCourses, useSubscriptionBatches } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardPanel from './components/DashboardPanel.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Button from '@/components/ui/Button.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import { formatDate } from '@/lib/utils';

/** Solid primary action — matches the "View Subscriptions" button. */
const PRIMARY_ACTION =
  'flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-center text-xs font-bold text-white border border-stone-200 transition hover:bg-brand-700 sm:text-sm';

/** Tinted secondary action — matches the pink "Add Subscriptions" button. */
const SECONDARY_ACTION =
  'flex items-center justify-center rounded-lg bg-brand-50 px-4 py-2.5 text-center text-xs font-bold text-brand-600 border border-stone-200 transition hover:bg-brand-100 sm:text-sm dark:bg-surface-dark dark:text-brand-300 dark:hover:bg-surface-dark';

const CARD = 'rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-stone-200 dark:border-stone-200 dark:bg-surface-dark';

/** What a batch that cannot take subscriptions yet tells the student, and where to go next. */
function waitingState(course) {
  if (course.status === 'expired') {
    return {
      badge: <StatusBadge status="expired" />,
      note: <>Access to this batch ended on <strong>{formatDate(course.expiresOn)}</strong>. Renew it to add subscriptions.</>,
      action: <Link to={`/dashboard/checkout/${course.slug}`} className={PRIMARY_ACTION}>Renew Access</Link>,
    };
  }
  if (course.awaitingApproval) {
    return {
      badge: <StatusBadge status="pending_payment" label="Waiting for approval" />,
      note: 'Your payment is submitted and awaiting admin approval. You can add subscriptions as soon as it’s confirmed.',
      action: (
        <span className={`${SECONDARY_ACTION} cursor-default gap-2`}>
          <FaClockRotateLeft aria-hidden="true" /> Waiting for Approval
        </span>
      ),
    };
  }
  return {
    badge: <StatusBadge status="pending_payment" label="Payment pending" />,
    note: 'Complete your payment to activate this batch. Subscriptions open once it is active.',
    action: <Link to={`/dashboard/checkout/${course.slug}`} className={PRIMARY_ACTION}>Pay Course Fee</Link>,
  };
}

/**
 * /dashboard/subscriptions — the batches this student can hold subscriptions
 * against. Each active batch leads either to its subscription list or straight
 * to the add flow. Enrolments that are still unpaid, awaiting approval or
 * expired are listed underneath with what happens next, so a student who has
 * just enrolled never lands on an unexplained blank page.
 */
export default function Subscriptions() {
  const batchesQuery = useSubscriptionBatches();
  const coursesQuery = useMyCourses();

  const batches = batchesQuery.data ?? [];
  const waiting = (coursesQuery.data ?? []).filter((course) => course.status === 'pending_payment' || course.status === 'expired');
  const isLoading = batchesQuery.isLoading || coursesQuery.isLoading;
  const isError = batchesQuery.isError || coursesQuery.isError;
  const retry = () => {
    batchesQuery.refetch();
    coursesQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Subscriptions" backTo="/dashboard" showDashboardLink={false} />

      <DashboardPanel title="Subscription Available Batches">
        {isLoading ? (
          <ContentSkeleton variant="cards" label="Loading batches" />
        ) : isError ? (
          <EmptyState
            variant="error"
            title="Your batches could not be loaded"
            description="Check your connection and try again."
            onRetry={retry}
            isFetching={batchesQuery.isFetching || coursesQuery.isFetching}
          />
        ) : batches.length === 0 && waiting.length === 0 ? (
          <EmptyState
            title="No subscription available batches"
            description="Enrol in a batch first — subscriptions are added on top of an active enrolment."
            action={<Button to="/batches">Browse Batches</Button>}
          />
        ) : batches.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-600 dark:text-brand-200">
            None of your batches is active yet. Subscriptions open as soon as one is.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {batches.map((batch) => (
              <div key={batch.id} className={CARD}>
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

      {!isLoading && !isError && waiting.length > 0 && (
        <DashboardPanel title="Waiting to Become Active">
          <div className="grid gap-5 lg:grid-cols-2">
            {waiting.map((course) => {
              const { badge, note, action } = waitingState(course);
              return (
                <div key={course.id} className={CARD}>
                  <h2 className="text-center text-base font-bold text-brand-600 sm:text-lg dark:text-brand-300">
                    {course.title}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-stone-600 dark:text-brand-200">
                    <span>
                      Reg No:
                      <strong className="ml-1 text-stone-900 dark:text-white">{course.regNo}</strong>
                    </span>
                    {badge}
                  </div>

                  <p className="mt-3 text-center text-xs text-stone-600 sm:text-sm dark:text-brand-200">{note}</p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {action}
                    <Link to={`/dashboard/subscriptions/${course.id}`} className={SECONDARY_ACTION}>
                      View Subscriptions
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardPanel>
      )}
    </div>
  );
}

export { PRIMARY_ACTION, SECONDARY_ACTION };
