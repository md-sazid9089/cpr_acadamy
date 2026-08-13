import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchInvoice } from './api/payments.api.js';
import Card from '@/components/ui/Card.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { PAYMENT_METHODS, CONTACT } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';

const methodLabel = (id) => PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;

/** Printable invoice at /dashboard/invoices/:invoiceId. */
export default function Invoice() {
  const { invoiceId } = useParams();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: () => fetchInvoice(invoiceId),
    enabled: Boolean(invoiceId),
  });

  if (isLoading || !invoice) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading invoice…" />
      </div>
    );
  }

  const subtotal = invoice.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex justify-end gap-3 print:hidden">
        <Button to="/dashboard/payments" variant="outline">
          Back
        </Button>
        <Button onClick={() => window.print()}>Print / save PDF</Button>
      </div>

      <Card className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
          <div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              CPR <span className="text-brand-600 dark:text-brand-400">Medical Academy</span>
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
              {CONTACT.address}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{CONTACT.email}</p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Invoice {invoice.invoiceNo}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Issued {formatDate(invoice.issuedAt)}
            </p>
            <div className="mt-2">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Billed to</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
              {invoice.billedTo.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.billedTo.mobile}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {invoice.billedTo.institution}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              {methodLabel(invoice.method)}
            </p>
            {invoice.transactionId && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Txn {invoice.transactionId}
              </p>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left dark:border-slate-800">
              <th className="py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </th>
              <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Qty
              </th>
              <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoice.lines.map((line) => (
              <tr key={line.id}>
                <td className="py-3 text-slate-700 dark:text-slate-300">{line.description}</td>
                <td className="py-3 text-right text-slate-700 dark:text-slate-300">{line.quantity}</td>
                <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                  {formatBDT(line.unitPrice * line.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
            <dd className="text-slate-800 dark:text-slate-200">{formatBDT(subtotal)}</dd>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Discount</dt>
              <dd className="text-emerald-600 dark:text-emerald-400">−{formatBDT(invoice.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-800">
            <dt className="text-slate-900 dark:text-white">Total paid</dt>
            <dd className="text-brand-700 dark:text-brand-400">{formatBDT(invoice.total)}</dd>
          </div>
        </dl>

        <p className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400 dark:border-slate-800">
          This is a computer-generated invoice and does not require a signature.
        </p>
      </Card>
    </div>
  );
}
