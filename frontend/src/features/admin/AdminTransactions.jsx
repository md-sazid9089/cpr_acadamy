import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCamera, FaCheck, FaMagnifyingGlass, FaRegCopy } from 'react-icons/fa6';
import { confirmPayment, fetchAdminTransactions, rejectPayment } from './api/admin.api.js';
import Card from '@/components/ui/Card.jsx';
import { DashboardCardHeader, dayAndTime } from './dashboard/parts.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { Textarea } from '@/components/ui/Input.jsx';
import { shortInvoiceNumber } from '@/features/payments/payment-display.js';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/constants';
import { cn, formatBDT, formatDateTime } from '@/lib/utils';

const METHOD_LABELS = Object.fromEntries(PAYMENT_METHODS.map((method) => [method.id, method.label]));

/** The admin's comment left when a payment or registration was decided, with who and when. */
export function AdminNote({ note, at, by, label = 'Admin note' }) {
  if (!note) return null;
  return (
    <div className="rounded-lg border border-stone-200 bg-surface-subtle p-3 text-sm dark:border-stone-200 dark:bg-surface-dark">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-brand-200">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-stone-800 dark:text-white">{note}</p>
      <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">
        {by ? `by ${by}` : ''}{by && at ? ' · ' : ''}{at ? formatDateTime(at) : ''}
      </p>
    </div>
  );
}

/** Transaction columns shared with the student detail page. */
export const PAYMENT_COLUMNS = [
  {
    key: 'invoiceNo',
    header: 'Invoice',
    render: (row) => (
      <div>
        <p className="font-mono text-xs font-semibold text-stone-900 dark:text-white" title={row.invoiceNo}>{shortInvoiceNumber(row.invoiceNo)}</p>
        <p className="text-xs text-stone-500 dark:text-brand-200">{formatDateTime(row.paidAt ?? row.createdAt)}</p>
      </div>
    ),
  },
  {
    key: 'courseTitle',
    header: 'Course',
    render: (row) => <p className="max-w-xs text-xs text-stone-700 line-clamp-2 dark:text-brand-200">{row.courseTitle}</p>,
  },
  {
    key: 'method',
    header: 'Method',
    render: (row) => <span className="text-xs text-stone-700 dark:text-brand-200">{METHOD_LABELS[row.method] ?? row.method}</span>,
  },
  {
    key: 'transactionId',
    header: 'Transaction ID',
    render: (row) =>
      row.transactionId ? (
        <span className="inline-flex items-center gap-1.5">
          <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-surface-dark dark:text-brand-200">
            {row.transactionId}
          </code>
          {row.screenshotUrl && <FaCamera aria-label="Screenshot attached" title="Screenshot attached" className="h-3 w-3 shrink-0 text-brand-500" />}
        </span>
      ) : (
        <span className="text-xs text-stone-400 dark:text-brand-200">—</span>
      ),
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    render: (row) => <span className="font-semibold text-stone-900 dark:text-white">{formatBDT(row.amount)}</span>,
  },
  { key: 'status', header: 'Status', align: 'right', render: (row) => <StatusBadge status={row.status} /> },
];

/** Opens a neutral proof review before the admin chooses an outcome; for a decided payment it shows the admin's note. */
export function ReconcileDialog({ payment, onClose, onDone }) {
  const [decision, setDecision] = useState('');
  const [comment, setComment] = useState('');
  const decided = payment && payment.status !== PAYMENT_STATUS.PENDING;

  const confirm = useMutation({ mutationFn: confirmPayment, onSuccess: onDone });
  const reject = useMutation({ mutationFn: rejectPayment, onSuccess: onDone });
  const error = confirm.error ?? reject.error;
  const busy = confirm.isPending || reject.isPending;
  const received = decision === 'received';

  const submit = (event) => {
    event.preventDefault();
    if (received) confirm.mutate({ id: payment.id, transactionId: payment.transactionId.trim(), amount: payment.amount, evidence: comment.trim() });
    else reject.mutate({ id: payment.id, reason: comment.trim() });
  };

  const details = [
    ['Student', payment?.studentName],
    ['Student mobile', payment?.studentMobile],
    ['Course', payment?.courseTitle],
    ['Amount', payment ? formatBDT(payment.amount) : ''],
    ['Payment method', payment ? (METHOD_LABELS[payment.method] ?? payment.method) : ''],
    ['Transaction ID', payment?.transactionId || 'Not submitted'],
    ['Submitted', payment ? formatDateTime(payment.proofSubmittedAt ?? payment.createdAt) : ''],
    ['Invoice', shortInvoiceNumber(payment?.invoiceNo)],
  ];

  return (
    <Modal
      open={Boolean(payment)}
      onClose={onClose}
      title="Review payment"
      description="Check the submitted details before accepting or rejecting."
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <dl className="divide-y divide-stone-200 rounded-lg border border-stone-200 px-4 dark:border-stone-200">
            {details.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5 text-sm">
                <dt className="text-stone-500 dark:text-brand-200">{label}</dt>
                <dd className={cn('min-w-0 break-words font-medium text-stone-900 dark:text-white', label === 'Transaction ID' || label === 'Invoice' ? 'font-mono text-xs' : '')}>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-lg border border-stone-200 bg-surface-subtle p-3 dark:border-stone-200 dark:bg-surface-dark">
            <p className="text-xs font-semibold text-stone-700 dark:text-brand-200">Payment screenshot</p>
            {payment?.screenshotUrl ? (
              <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block" title="Open full-size screenshot">
                <img src={payment.screenshotUrl} alt="Payment screenshot submitted by the student" className="max-h-64 w-full rounded-lg border border-stone-200 object-contain" />
              </a>
            ) : <p className="mt-2 text-sm text-stone-500 dark:text-brand-200">Not submitted</p>}
          </div>
        </div>

        {decided && <AdminNote note={payment.adminReviewNote} at={payment.adminReviewedAt} by={payment.adminReviewedByName ?? payment.adminReviewedBy} />}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error.message}
          </p>
        )}

        {!decided && <fieldset>
          <legend className="mb-2 text-sm font-semibold text-stone-800 dark:text-white">Decision</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant={decision === 'received' ? 'primary' : 'outline'} onClick={() => setDecision('received')} disabled={decided || !payment?.transactionId || busy}>Accept payment</Button>
            <Button type="button" variant={decision === 'not-received' ? 'danger' : 'outline'} onClick={() => setDecision('not-received')} disabled={decided || busy}>Reject payment</Button>
          </div>
          {decided && <p className="text-xs text-stone-500 dark:text-brand-200">This payment is already {payment.status}; the decision below cannot be changed here.</p>}
          {!payment?.transactionId && <p className="mt-2 text-xs text-red-600 dark:text-red-400">This payment cannot be accepted until the student submits a transaction ID.</p>}
        </fieldset>}

        {!decided && decision && (
          <Textarea
            label={received ? 'Verification note' : 'Rejection reason'}
            required
            minLength={received ? 10 : 5}
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={decision === 'not-received' ? 'e.g. No matching transfer found after 7 days.' : 'e.g. Matched against the merchant statement on 12 Sep.'}
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {decided ? 'Close' : 'Cancel'}
          </Button>
          {!decided && decision && (
            <Button type="submit" variant={decision === 'not-received' ? 'danger' : 'primary'} isLoading={busy}>
              {decision === 'not-received' ? 'Confirm rejection' : 'Confirm & activate access'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All', count: 'all' },
  { id: PAYMENT_STATUS.PENDING, label: 'Pending', count: 'pending' },
  { id: PAYMENT_STATUS.PAID, label: 'Paid', count: 'paid' },
  { id: PAYMENT_STATUS.FAILED, label: 'Failed', count: 'failed' },
  { id: PAYMENT_STATUS.REFUNDED, label: 'Refunded', count: 'refunded' },
];
const METHOD_DOTS = { bkash: 'bg-accent-500', nagad: 'bg-brand-400', rocket: 'bg-brand-700', card: 'bg-brand-500', manual: 'bg-stone-400' };

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : `Copy ${value}`}
      title={copied ? 'Copied' : 'Copy'}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-stone-400 transition-colors hover:text-brand-600 dark:text-brand-200"
    >
      {copied ? <FaCheck aria-hidden="true" className="h-3 w-3 text-brand-600" /> : <FaRegCopy aria-hidden="true" className="h-3 w-3" />}
    </button>
  );
}

/**
 * Every invoice with status chips (with counts) and a search; pending manual payments get
 * Reject and Confirm, which open the approval dialog with that outcome chosen. Lives on the admin dashboard.
 */
export default function TransactionsPanel() {
  const [filter, setFilter] = useState(PAYMENT_STATUS.PENDING);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [reconciling, setReconciling] = useState(null);
  const queryClient = useQueryClient();

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, isLoading, isError, error, isFetching, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['admin', 'transactions', filter, search],
    queryFn: ({ pageParam }) => fetchAdminTransactions({ status: filter, search, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((count, page) => count + page.items.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
  });

  const finishReconcile = () => {
    setReconciling(null);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  const latest = data?.pages[data.pages.length - 1];
  const rows = data?.pages.flatMap((page) => page.items) ?? [];
  const counts = latest?.counts ?? {};

  return (
    // contain:paint keeps the wide table's scroll width inside the card; overflow:hidden alone let it widen the page on phones.
    <Card className="min-w-0 overflow-hidden [contain:paint]">
      <DashboardCardHeader
        title="Transaction approval"
        count={latest?.pendingCount}
        description="Manual payments (bKash, Nagad, bank) to confirm once the money arrives."
        infoLabel="About transaction approval"
        info="Open a payment to review its transaction ID, payer details and screenshot. Accepting activates course access; rejecting marks the payment failed. Both require a short audit note."
      />

      <div className="space-y-3 border-b border-stone-200 px-5 py-4 sm:px-6 dark:border-stone-200">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
                  active
                    ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-500 dark:bg-brand-500'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200',
                )}
              >
                {option.label}
                {latest && (
                  <span className={cn('min-w-[22px] rounded-full px-1.5 text-xs tabular-nums',
                    active ? 'bg-white text-brand-800' : 'bg-stone-100 text-stone-600 dark:bg-surface-dark-subtle dark:text-brand-200')}>
                    {counts[option.count] ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <label className="relative block max-w-xs">
          <span className="sr-only">Search transactions</span>
          <FaMagnifyingGlass aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Name, phone or Trx ID"
            maxLength={100}
            className="block min-h-[42px] w-full rounded-control border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200"
          />
        </label>
      </div>

      {isLoading ? <div className="p-5"><ContentSkeleton variant="table" label="Loading transactions" /></div> : isError || !data ? (
        <EmptyState
          variant="error"
          title="Couldn't load transactions"
          description={error?.message || 'Something went wrong. Please try again.'}
          onRetry={refetch}
          isFetching={isFetching}
        />
      ) : rows.length === 0 ? (
        <EmptyState title="No transactions" description={search ? 'Nothing matches that search.' : 'Try a different filter.'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-stone-50 text-xs font-medium text-stone-500 dark:bg-surface-dark dark:text-brand-200">
              <tr>
                <th scope="col" className="min-w-[160px] px-5 py-3 font-medium sm:pl-6">Student</th>
                <th scope="col" className="px-3 py-3 font-medium">Amount · method</th>
                <th scope="col" className="px-3 py-3 font-medium">Trx ID</th>
                <th scope="col" className="px-3 py-3 font-medium">Status · submitted</th>
                <th scope="col" className="py-3 pl-3 pr-5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-200">
              {rows.map((row) => (
                <tr key={row.id} className="align-middle">
                  <td className="px-5 py-3.5 sm:pl-6">
                    <Link to={`/admin/students/${row.studentId}`} className="block font-semibold text-stone-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300">
                      {row.studentName}
                    </Link>
                    <p className="max-w-[150px] truncate text-xs text-stone-500 dark:text-brand-200" title={row.courseTitle}>{row.courseTitle}</p>
                    {row.studentMobile && <p className="text-xs tabular-nums text-stone-500 dark:text-brand-200">{row.studentMobile}</p>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <span className="font-bold tabular-nums text-stone-900 dark:text-white">{formatBDT(row.amount)}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-600 dark:text-brand-200">
                      <span aria-hidden="true" className={cn('h-2 w-2 rounded-sm', METHOD_DOTS[row.method] ?? 'bg-stone-400')} />
                      {METHOD_LABELS[row.method] ?? row.method}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    {row.transactionId ? (
                      <span className="inline-flex items-center gap-1">
                        <code className="whitespace-nowrap rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-surface-dark dark:text-brand-200">{row.transactionId}</code>
                        <CopyButton value={row.transactionId} />
                        {row.screenshotUrl && (
                          <a href={row.screenshotUrl} target="_blank" rel="noopener noreferrer" aria-label="Open payment screenshot" title="Screenshot attached" className="inline-flex h-6 w-6 items-center justify-center text-brand-500 hover:text-brand-700">
                            <FaCamera aria-hidden="true" className="h-3 w-3" />
                          </a>
                        )}
                      </span>
                    ) : <span className="text-xs text-stone-400 dark:text-brand-200">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <StatusBadge status={row.status} className="capitalize" />
                    <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">{dayAndTime(row.proofSubmittedAt ?? row.createdAt)}</p>
                  </td>
                  <td className="whitespace-nowrap py-3.5 pl-3 pr-5">
                    <div className="flex justify-end">
                      <Button size="sm" variant={row.status === PAYMENT_STATUS.PENDING ? 'outline' : 'ghost'} onClick={() => setReconciling(row)}>
                        {row.status === PAYMENT_STATUS.PENDING ? 'Open' : 'View'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasNextPage && (
        <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-5 py-3 text-xs text-stone-500 dark:text-brand-200">
          <span>Showing {rows.length} of {latest.total}</span>
          <Button size="sm" variant="outline" onClick={() => fetchNextPage()} isLoading={isFetchingNextPage}>
            Show more
          </Button>
        </div>
      )}

      {reconciling && (
        <ReconcileDialog
          key={reconciling.id}
          payment={reconciling}
          onClose={() => setReconciling(null)}
          onDone={finishReconcile}
        />
      )}
    </Card>
  );
}
