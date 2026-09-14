import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchInvoice } from './api/payments.api.js';
import Card from '@/components/ui/Card.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { PAYMENT_METHODS, CONTACT } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';

const methodLabel = (id) => PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;

/** Printable invoice at /dashboard/invoices/:invoiceId. */
export default function Invoice() {
  const { invoiceId } = useParams();

  const { data: invoice, isLoading, isError, error } = useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: () => fetchInvoice(invoiceId),
    enabled: Boolean(invoiceId),
    retry: (count, failure) => failure?.status !== 404 && count < 2,
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

  if (isLoading) {
    return (
      <ContentSkeleton variant="table" label="Loading invoice" />
    );
  }

  const subtotal = invoice.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const isPending = invoice.status === 'pending';

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex justify-end gap-3 print:hidden">
        <Button to="/dashboard/payments" variant="outline">
          Back
        </Button>
        <Button onClick={() => window.print()}>Print / save PDF</Button>
      </div>

      {isPending && (
        <Card className="border-stone-200 bg-brand-50 p-5 text-sm text-brand-900 print:hidden dark:border-stone-200 dark:bg-brand-950/40 dark:text-brand-100">
          <p className="font-semibold">Awaiting your payment</p>
          <p className="mt-1">
            Send <strong>{formatBDT(invoice.total)}</strong> to the academy ({CONTACT.phone}) by bKash, Nagad, Rocket or bank
            transfer using <strong>{invoice.invoiceNo}</strong> as the reference, then share the transaction ID on WhatsApp
            ({CONTACT.whatsapp}). Your access opens the moment an administrator confirms it.
          </p>
        </Card>
      )}

      <Card className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6 dark:border-stone-200">
          <div>
            <p className="text-lg font-extrabold text-stone-900 dark:text-white">
              CPR <span className="text-brand-600 dark:text-brand-400">Medical Academy</span>
            </p>
            <p className="mt-1 max-w-xs text-xs text-stone-500 dark:text-brand-200">
              {CONTACT.address}
            </p>
            <p className="text-xs text-stone-500 dark:text-brand-200">{CONTACT.email}</p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-stone-900 dark:text-white">
              Invoice {invoice.invoiceNo}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">
              Issued {formatDate(invoice.issuedAt)}
            </p>
            <div className="mt-2">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Billed to</p>
            <p className="mt-1 text-sm font-medium text-stone-900 dark:text-white">
              {invoice.billedTo.name}
            </p>
            <p className="text-xs text-stone-500 dark:text-brand-200">{invoice.billedTo.mobile}</p>
            <p className="text-xs text-stone-500 dark:text-brand-200">
              {invoice.billedTo.institution}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Payment</p>
            <p className="mt-1 text-sm text-stone-700 dark:text-brand-200">
              {methodLabel(invoice.method)}
            </p>
            {invoice.transactionId && (
              <p className="text-xs text-stone-500 dark:text-brand-200">
                Txn {invoice.transactionId}
              </p>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-stone-200 text-left dark:border-stone-200">
              <th className="py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Description
              </th>
              <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">
                Qty
              </th>
              <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-200">
            {invoice.lines.map((line) => (
              <tr key={line.id}>
                <td className="py-3 text-stone-700 dark:text-brand-200">{line.description}</td>
                <td className="py-3 text-right text-stone-700 dark:text-brand-200">{line.quantity}</td>
                <td className="py-3 text-right text-stone-700 dark:text-brand-200">
                  {formatBDT(line.unitPrice * line.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-500 dark:text-brand-200">Subtotal</dt>
            <dd className="text-stone-800 dark:text-brand-200">{formatBDT(subtotal)}</dd>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-stone-500 dark:text-brand-200">Discount</dt>
              <dd className="text-brand-600 dark:text-brand-400">−{formatBDT(invoice.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold dark:border-stone-200">
            <dt className="text-stone-900 dark:text-white">{invoice.status === 'paid' ? 'Total paid' : 'Total due'}</dt>
            <dd className="text-brand-700 dark:text-brand-400">{formatBDT(invoice.total)}</dd>
          </div>
        </dl>

        <p className="mt-8 border-t border-stone-200 pt-4 text-center text-xs text-stone-400 dark:border-stone-200">
          This is a computer-generated invoice and does not require a signature.
        </p>
      </Card>
    </div>
  );
}
