import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { confirmPayment, fetchAdminRevenue, rejectPayment } from './api/admin.api.js';
import Card, { CardBody, CardHeader, StatCard } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Input, { Textarea } from '@/components/ui/Input.jsx';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/constants';
import { cn, formatBDT, formatDateTime, formatNumber } from '@/lib/utils';

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
        <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{row.invoiceNo}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(row.paidAt ?? row.createdAt)}</p>
      </div>
    ),
  },
  {
    key: 'courseTitle',
    header: 'Course',
    render: (row) => <p className="max-w-xs text-xs text-slate-700 line-clamp-2 dark:text-slate-300">{row.courseTitle}</p>,
  },
  {
    key: 'method',
    header: 'Method',
    render: (row) => <span className="text-xs text-slate-700 dark:text-slate-300">{METHOD_LABELS[row.method] ?? row.method}</span>,
  },
  {
    key: 'transactionId',
    header: 'Transaction ID',
    render: (row) =>
      row.transactionId ? (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {row.transactionId}
        </code>
      ) : (
        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
      ),
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{formatBDT(row.amount)}</span>,
  },
  { key: 'status', header: 'Status', align: 'right', render: (row) => <StatusBadge status={row.status} /> },
];

/**
 * Confirm / reject dialog for one pending manual payment. Confirming is what
 * activates the student's enrolment, so it asks for the provider transaction
 * ID and a note on how it was verified; both are written to the audit log.
 */
export function ReconcileDialog({ payment, onClose, onDone }) {
  const [mode, setMode] = useState('confirm');
  const [transactionId, setTransactionId] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reason, setReason] = useState('');

  const confirm = useMutation({ mutationFn: confirmPayment, onSuccess: onDone });
  const reject = useMutation({ mutationFn: rejectPayment, onSuccess: onDone });
  const error = confirm.error ?? reject.error;
  const busy = confirm.isPending || reject.isPending;

  const submit = (event) => {
    event.preventDefault();
    if (mode === 'confirm') confirm.mutate({ id: payment.id, transactionId: transactionId.trim(), amount: payment.amount, evidence: evidence.trim() });
    else reject.mutate({ id: payment.id, reason: reason.trim() });
  };

  return (
    <Modal
      open={Boolean(payment)}
      onClose={onClose}
      title={mode === 'confirm' ? 'Confirm payment received' : 'Reject payment'}
      description={payment ? `${payment.invoiceNo} · ${payment.courseTitle} · ${formatBDT(payment.amount)}` : ''}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-2">
          {[
            { id: 'confirm', label: 'Payment received' },
            { id: 'reject', label: 'Not received' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                mode === option.id
                  ? option.id === 'confirm' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error.message}
          </p>
        )}

        {mode === 'confirm' ? (
          <>
            <Input
              label="Transaction ID"
              required
              minLength={3}
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              placeholder="bKash / Nagad / bank reference"
              hint={`Confirms exactly ${formatBDT(payment?.amount)} — the invoice amount cannot be changed here.`}
            />
            <Textarea
              label="How was it verified?"
              required
              minLength={10}
              rows={3}
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              placeholder="e.g. Matched against the merchant statement on 12 Sep, sender 017…"
            />
          </>
        ) : (
          <Textarea
            label="Reason"
            required
            minLength={5}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. No matching transfer found after 7 days."
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant={mode === 'confirm' ? 'primary' : 'danger'} isLoading={busy}>
            {mode === 'confirm' ? 'Confirm & activate access' : 'Reject payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminRevenue() {
  const [filter, setFilter] = useState(PAYMENT_STATUS.PENDING);
  const [reconciling, setReconciling] = useState(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'revenue'], queryFn: fetchAdminRevenue });

  const finishReconcile = () => {
    setReconciling(null);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-start justify-center pt-20">
        <Spinner size="lg" label="Loading revenue…" />
      </div>
    );
  }

  const { summary, byMonth, byMethod, byCourse, transactions } = data;
  const peak = Math.max(...byMonth.map((month) => month.amount), 1);
  const monthChange = summary.lastMonth ? Math.round(((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100) : 0;
  const topCourse = byCourse[0]?.amount ?? 1;

  const rows = filter === 'ALL' ? transactions : transactions.filter((payment) => payment.status === filter);

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
  const pendingCount = transactions.filter((payment) => payment.status === PAYMENT_STATUS.PENDING).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue this month"
          value={formatBDT(summary.thisMonth)}
          hint={`${monthChange >= 0 ? '+' : ''}${monthChange}% vs last month`}
        />
        <StatCard label="Year to date" value={formatBDT(summary.yearToDate)} hint={`${formatNumber(summary.paidCount)} paid invoices`} />
        <StatCard label="Awaiting payment" value={formatBDT(summary.pendingAmount)} hint={`${pendingCount} pending ${pendingCount === 1 ? 'invoice' : 'invoices'} to reconcile`} />
        <StatCard label="Refunded" value={formatBDT(summary.refundedAmount)} hint="All time" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Monthly revenue" description="Paid invoices, last six months." />
          <CardBody>
            {/* CSS bars — a charting library isn't warranted for six data points. */}
            <div className="flex h-48 items-end justify-between gap-4">
              {byMonth.map((month) => (
                <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {Math.round(month.amount / 1000)}k
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-brand-500 dark:bg-brand-600"
                    style={{ height: `${(month.amount / peak) * 100}%` }}
                    title={formatBDT(month.amount)}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{month.month}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="By payment method" description="All paid invoices." />
          <CardBody className="space-y-4">
            {byMethod.map((item) => (
              <div key={item.method}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{METHOD_LABELS[item.method] ?? item.method}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatBDT(item.amount)} · {item.share}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${item.share}%` }} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Revenue by course" description="Paid invoices in the transaction list below." />
        <CardBody className="space-y-3">
          {byCourse.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No paid invoices yet.</p>}
          {byCourse.map((item) => (
            <div key={item.courseId} className="grid items-center gap-3 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <Link
                    to={`/admin/courses/${item.courseId}`}
                    className="truncate font-medium text-slate-800 hover:text-brand-700 dark:text-slate-200 dark:hover:text-brand-400"
                  >
                    {item.courseTitle}
                  </Link>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {item.count} {item.count === 1 ? 'payment' : 'payments'}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.round((item.amount / topCourse) * 100)}%` }} />
                </div>
              </div>
              <span className="text-right text-sm font-semibold text-slate-900 dark:text-white">{formatBDT(item.amount)}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Transactions"
          description="Every invoice, newest first. Pending invoices are manual payments waiting for you to confirm the money arrived — confirming activates the student's access."
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
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Table columns={columns} rows={rows} emptyTitle="No transactions" emptyDescription="Try a different filter." />
        </div>
      </Card>

      {reconciling && <ReconcileDialog payment={reconciling} onClose={() => setReconciling(null)} onDone={finishReconcile} />}
    </div>
  );
}
