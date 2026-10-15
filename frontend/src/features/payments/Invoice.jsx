import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FaArrowLeft } from 'react-icons/fa6';
import { fetchInvoice } from './api/payments.api.js';
import PaymentFlow, { paymentPageTitle } from './PaymentFlow.jsx';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';

/**
 * One payment, opened from Payment History at /dashboard/invoices/:invoiceId. It shows the same
 * page as checkout — how to pay, the proof form, the review status, or the receipt — picked from
 * the invoice's own status, so a student who left mid-way comes back to exactly where they were.
 */
export default function Invoice() {
  const { invoiceId } = useParams();
  const queryClient = useQueryClient();
  const queryKey = ['payments', 'invoice', invoiceId];

  const { data: invoice, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => fetchInvoice(invoiceId),
    enabled: Boolean(invoiceId),
    retry: (count, failure) => failure?.status !== 404 && count < 2,
    // Picks up an admin's confirm or reject automatically while proof is under review.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 15000 : false),
  });

  if (isError || (!isLoading && !invoice)) {
    return (
      <EmptyState
        title="Invoice not found"
        description={error?.status === 404 ? 'This invoice does not exist or belongs to another account.' : error?.message}
        action={<Button to="/dashboard/payments">Payment history</Button>}
      />
    );
  }

  if (isLoading) return <ContentSkeleton variant="form" label="Loading invoice" />;

  return (
    <div className="space-y-4">
      <Link to="/dashboard/payments" className="payment-no-print inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
        <FaArrowLeft aria-hidden="true" className="h-3 w-3" />
        Payment history
      </Link>
      <h1 lang="bn" className="payment-no-print font-heading text-2xl font-bold text-brand-800 dark:text-white">
        {paymentPageTitle(invoice.status, Boolean(invoice.proofSubmittedAt))}
      </h1>

      <PaymentFlow
        invoice={invoice}
        onUpdated={(updated) => {
          queryClient.setQueryData(queryKey, (current) => ({ ...current, ...updated }));
          // My Courses and Subscriptions show "awaiting approval" off the same payment.
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }}
      />
    </div>
  );
}
