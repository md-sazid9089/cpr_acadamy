import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaCircleCheck, FaCamera, FaPen } from 'react-icons/fa6';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInvoice, submitPaymentProof, uploadPaymentScreenshot } from './api/payments.api.js';
import Card from '@/components/ui/Card.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { PAYMENT_METHODS, CONTACT } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';
import './payments.css';

const methodLabel = (id) => PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;

/**
 * Replaces the old "share it over WhatsApp" step: the student sends the money
 * externally, then submits the transaction ID, the mobile they paid from, and
 * an optional screenshot right here for an admin to review before confirming.
 */
function PaymentProofForm({ invoice, onSubmitted }) {
  const [editing, setEditing] = useState(!invoice.proofSubmittedAt);
  const [transactionId, setTransactionId] = useState(invoice.transactionId ?? '');
  const [payerMobile, setPayerMobile] = useState(invoice.payerMobile ?? '');
  const [screenshotUrl, setScreenshotUrl] = useState(invoice.screenshotUrl ?? '');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const submitMutation = useMutation({
    mutationFn: submitPaymentProof,
    onSuccess: (updated) => {
      setEditing(false);
      onSubmitted(updated);
    },
  });

  const handleFile = async (event) => {
    const [file] = event.target.files ?? [];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      setScreenshotUrl(await uploadPaymentScreenshot(file));
    } catch (error) {
      setUploadError(error.message ?? 'The screenshot could not be uploaded.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  if (!editing) {
    return (
      <Card className="invoice-payment-notice border-stone-200 bg-brand-50 p-5 text-sm text-brand-900 print:hidden dark:border-stone-200 dark:bg-brand-950/40 dark:text-brand-100">
        <p className="flex items-center gap-2 font-semibold">
          <FaCircleCheck aria-hidden="true" className="h-4 w-4 shrink-0" /> Payment proof submitted
        </p>
        <p className="mt-1">
          Transaction ID <strong>{invoice.transactionId}</strong> from <strong>{invoice.payerMobile}</strong>
          {invoice.proofSubmittedAt && <> on {formatDate(invoice.proofSubmittedAt)}</>}. An administrator will confirm it shortly
          and your access will open automatically.
        </p>
        {invoice.screenshotUrl && (
          <img src={invoice.screenshotUrl} alt="Submitted payment screenshot" className="mt-3 max-h-48 rounded-lg border border-stone-200" />
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
        >
          <FaPen aria-hidden="true" className="h-3 w-3" /> Made a mistake? Edit submission
        </button>
      </Card>
    );
  }

  return (
    <Card className="invoice-payment-notice border-stone-200 bg-brand-50 p-5 text-sm text-brand-900 print:hidden dark:border-stone-200 dark:bg-brand-950/40 dark:text-brand-100">
      <p className="font-semibold">Awaiting your payment</p>
      <p className="mt-1">
        Send <strong>{formatBDT(invoice.total)}</strong> to the academy ({CONTACT.phone}) by bKash, Nagad, Rocket or bank
        transfer using <strong>{invoice.invoiceNo}</strong> as the reference, then submit the transaction ID below.
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitMutation.mutate({ id: invoice.id, transactionId: transactionId.trim(), payerMobile: payerMobile.trim(), screenshotUrl });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Transaction ID"
            required
            minLength={3}
            maxLength={120}
            placeholder="e.g. 9F7K2LX0PQ"
            value={transactionId}
            onChange={(event) => setTransactionId(event.target.value)}
          />
          <Input
            label="Mobile number you paid from"
            required
            inputMode="numeric"
            placeholder="01712345678"
            value={payerMobile}
            onChange={(event) => setPayerMobile(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700 dark:text-brand-200">
            Payment screenshot <span className="font-normal text-stone-500 dark:text-brand-200">(optional)</span>
          </label>
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-control border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:bg-surface-dark-subtle dark:text-brand-200">
            <FaCamera aria-hidden="true" className="h-3.5 w-3.5" />
            {isUploading ? 'Uploading…' : screenshotUrl ? 'Replace screenshot' : 'Attach screenshot'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} disabled={isUploading} />
          </label>
          {uploadError && <p className="text-xs font-medium text-red-600 dark:text-red-400">{uploadError}</p>}
          {screenshotUrl && <img src={screenshotUrl} alt="Payment screenshot preview" className="max-h-40 rounded-lg border border-stone-200" />}
        </div>

        {submitMutation.isError && (
          <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">{submitMutation.error.message}</p>
        )}

        <Button type="submit" isLoading={submitMutation.isPending} disabled={isUploading}>
          Submit for review
        </Button>
      </form>
    </Card>
  );
}

/** Printable invoice at /dashboard/invoices/:invoiceId. */
export default function Invoice() {
  const { invoiceId } = useParams();
  const queryClient = useQueryClient();
  const queryKey = ['payments', 'invoice', invoiceId];

  const { data: invoice, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => fetchInvoice(invoiceId),
    enabled: Boolean(invoiceId),
    retry: (count, failure) => failure?.status !== 404 && count < 2,
    // Picks up an admin's confirm/reject automatically while proof is under review.
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

  if (isLoading) {
    return (
      <ContentSkeleton variant="table" label="Loading invoice" />
    );
  }

  const subtotal = invoice.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const isPending = invoice.status === 'pending';

  return (
    <div className="invoice-page mx-auto max-w-3xl space-y-4">
      <div className="invoice-toolbar flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button to="/dashboard/payments" variant="outline">
          <FaArrowLeft aria-hidden="true" /> Payment history
        </Button>
        {invoice.status === 'paid' ? (
          <Button onClick={() => window.print()}><FaPrint aria-hidden="true" /> Print slip</Button>
        ) : (
          <span className="text-xs text-stone-500 dark:text-brand-200">
            The printable slip is available once an administrator confirms this payment.
          </span>
        )}
      </div>

      {isPending && invoice.method === 'manual' && (
        <PaymentProofForm
          invoice={invoice}
          onSubmitted={(updated) => queryClient.setQueryData(queryKey, (current) => ({ ...current, ...updated }))}
        />
      )}

      <Card className="invoice-document p-5 sm:p-8">
        <div className="invoice-heading flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6 dark:border-stone-200">
          <div className="invoice-brand">
            <img src="/assets/spotlight/cpr-logo.png" alt="CPR Medical Academy logo" width="52" height="52" className="invoice-logo" />
            <div>
            <p className="text-lg font-extrabold text-stone-900 dark:text-white">
              CPR <span className="text-brand-600 dark:text-brand-400">Medical Academy</span>
            </p>
            <p className="mt-1 max-w-xs text-xs text-stone-500 dark:text-brand-200">
              {CONTACT.address}
            </p>
            <p className="text-xs text-stone-500 dark:text-brand-200">{CONTACT.email}</p>
            </div>
          </div>

          <div className="invoice-reference">
            <h1 className="text-lg font-bold">Invoice</h1>
            <p className="invoice-full-id text-xs font-semibold text-stone-900 dark:text-white">
              {invoice.invoiceNo}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">
              Issued {formatDate(invoice.issuedAt)}
            </p>
            {invoice.paidAt && <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">Paid {formatDate(invoice.paidAt)}</p>}
            <div className="mt-2">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        <div className="invoice-parties grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Billed to</p>
            <p className="mt-1 text-sm font-medium text-stone-900 dark:text-white">
              {invoice.billedTo.name}
            </p>
            <p className="text-xs text-stone-500 dark:text-brand-200">{invoice.billedTo.mobile}</p>
            {invoice.billedTo.institution && <p className="text-xs text-stone-500 dark:text-brand-200">
              Institution: {invoice.billedTo.institution}
            </p>}
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Payment</p>
            <p className="mt-1 text-sm text-stone-700 dark:text-brand-200">
              {methodLabel(invoice.method)}
            </p>
            {invoice.transactionId && (
              <p className="text-xs text-stone-500 dark:text-brand-200">
                Transaction ID: {invoice.transactionId}
              </p>
            )}
          </div>
        </div>

        <table className="invoice-lines w-full text-sm">
          <colgroup><col /><col style={{ width: '3rem' }} /><col style={{ width: '30%' }} /></colgroup>
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
            <dt className="text-stone-900 dark:text-white">{invoice.status === 'paid' ? 'Total paid' : invoice.status === 'refunded' ? 'Total refunded' : invoice.status === 'pending' ? 'Total due' : 'Invoice total'}</dt>
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
