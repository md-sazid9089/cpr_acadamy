import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaCamera } from 'react-icons/fa6';
import { confirmPayment, fetchAdminTransactions, rejectPayment } from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import Input, { Select, Textarea } from '@/components/ui/Input.jsx';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/constants';
import { cn, formatBDT, formatDateTime } from '@/lib/utils';

const METHOD_LABELS = Object.fromEntries(PAYMENT_METHODS.map((method) => [method.id, method.label]));

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: PAYMENT_STATUS.PAID, label: 'Paid' },
  { id: PAYMENT_STATUS.PENDING, label: 'Pending' },
  { id: PAYMENT_STATUS.FAILED, label: 'Failed' },
  { id: PAYMENT_STATUS.REFUNDED, label: 'Refunded' },
];

/** Transaction columns shared with the student detail page. */
export const PAYMENT_COLUMNS = [
  {
    key: 'invoiceNo',
    header: 'Invoice',
    render: (row) => (
      <div>
        <p className="font-mono text-xs font-semibold text-stone-900 dark:text-white">{row.invoiceNo}</p>
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

/**
 * Approval dialog for one pending manual payment. The admin picks the outcome
 * from a dropdown and writes a comment: "Payment received" confirms it (which
 * activates the student's enrolment, so it also needs the provider transaction
 * ID); "Not received" rejects it. The comment goes to the audit log either way.
 */
export function ReconcileDialog({ payment, onClose, onDone }) {
  const [decision, setDecision] = useState('');
  const [transactionId, setTransactionId] = useState(payment?.transactionId ?? '');
  const [comment, setComment] = useState('');

  const confirm = useMutation({ mutationFn: confirmPayment, onSuccess: onDone });
  const reject = useMutation({ mutationFn: rejectPayment, onSuccess: onDone });
  const error = confirm.error ?? reject.error;
  const busy = confirm.isPending || reject.isPending;
  const received = decision === 'received';

  const submit = (event) => {
    event.preventDefault();
    if (received) confirm.mutate({ id: payment.id, transactionId: transactionId.trim(), amount: payment.amount, evidence: comment.trim() });
    else reject.mutate({ id: payment.id, reason: comment.trim() });
  };

  return (
    <Modal
      open={Boolean(payment)}
      onClose={onClose}
      title="Review payment"
      description={payment ? `${payment.invoiceNo} · ${payment.courseTitle} · ${formatBDT(payment.amount)}` : ''}
    >
      <form onSubmit={submit} className="space-y-4">
        {(payment?.payerMobile || payment?.screenshotUrl) && (
          <div className="rounded-lg border border-stone-200 bg-surface-subtle p-3 text-xs dark:border-stone-200 dark:bg-surface-dark">
            <p className="font-semibold text-stone-700 dark:text-brand-200">Submitted by the student</p>
            {payment.payerMobile && <p className="mt-1 text-stone-600 dark:text-brand-200">Paid from: <strong>{payment.payerMobile}</strong></p>}
            {payment.screenshotUrl && (
              <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                <img src={payment.screenshotUrl} alt="Payment screenshot submitted by the student" className="max-h-40 rounded-lg border border-stone-200" />
              </a>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error.message}
          </p>
        )}

        <Select label="Payment status" required value={decision} onChange={(event) => setDecision(event.target.value)}>
          <option value="" disabled>Select an option</option>
          <option value="received">Payment received</option>
          <option value="not-received">Not received</option>
        </Select>

        {received && (
          <Input
            label="Transaction ID"
            required
            minLength={3}
            value={transactionId}
            onChange={(event) => setTransactionId(event.target.value)}
            placeholder="bKash / Nagad / bank reference"
            hint={`Confirms exactly ${formatBDT(payment?.amount)} — the invoice amount cannot be changed here.`}
          />
        )}

        <Textarea
          label="Comment"
          required
          minLength={received ? 10 : 5}
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={
            decision === 'not-received'
              ? 'e.g. No matching transfer found after 7 days.'
              : 'e.g. Matched against the merchant statement on 12 Sep, sender 017…'
          }
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant={decision === 'not-received' ? 'danger' : 'primary'} disabled={!decision} isLoading={busy}>
            {decision === 'not-received' ? 'Reject payment' : 'Approve & activate access'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Every invoice with a status filter; pending manual payments get a Reconcile
 * button that opens the approval dialog. Lives on the admin dashboard.
 */
export default function TransactionsPanel() {
  const [filter, setFilter] = useState(PAYMENT_STATUS.PENDING);
  const [reconciling, setReconciling] = useState(null);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({ queryKey: ['admin', 'transactions'], queryFn: fetchAdminTransactions });

  const finishReconcile = () => {
    setReconciling(null);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  if (isLoading) return <ContentSkeleton variant="table" label="Loading transactions" />;

  if (isError || !data) {
    return (
      <Card>
        <EmptyState
          variant="error"
          title="Couldn't load transactions"
          description={error?.message || 'Something went wrong. Please try again.'}
          onRetry={refetch}
          isFetching={isFetching}
        />
      </Card>
    );
  }

  const { transactions } = data;
  const rows = filter === 'ALL' ? transactions : transactions.filter((payment) => payment.status === filter);
  const pendingCount = transactions.filter((payment) => payment.status === PAYMENT_STATUS.PENDING).length;

  const studentColumn = {
    key: 'studentName',
    header: 'Student',
    render: (row) => (
      <Link
        to={`/admin/students/${row.studentId}`}
        className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        {row.studentName}
      </Link>
    ),
  };
  const columns = [PAYMENT_COLUMNS[0], studentColumn, ...PAYMENT_COLUMNS.slice(1), {
    key: 'actions',
    header: '',
    align: 'right',
    render: (row) =>
      row.status === PAYMENT_STATUS.PENDING ? (
        <Button size="sm" onClick={() => setReconciling(row)}>
          Reconcile
        </Button>
      ) : null,
  }];

  return (
    <Card>
      <CardHeader
        title="Transaction approval"
        description={`${pendingCount} pending ${pendingCount === 1 ? 'payment' : 'payments'}. Pending invoices are manual payments waiting for you to confirm the money arrived — confirming activates the student's access.`}
      />
      <div className="flex flex-wrap gap-2 px-5 pt-4">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === option.id
                ? 'bg-brand-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <Table columns={columns} rows={rows} emptyTitle="No transactions" emptyDescription="Try a different filter." />
      </div>

      {reconciling && <ReconcileDialog payment={reconciling} onClose={() => setReconciling(null)} onDone={finishReconcile} />}
    </Card>
  );
}
