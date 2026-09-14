import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaArrowLeft, FaArrowRight, FaEye, FaRotateLeft } from 'react-icons/fa6';
import { fetchPaymentHistoryPage } from '@/features/payments/api/payments.api.js';
import { shortInvoiceNumber } from '@/features/payments/payment-display.js';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { PAYMENT_METHODS } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';
import '@/features/payments/payments.css';

const methodLabel = (id) => PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;
const PAGE_SIZE = 10;

export default function PaymentHistory() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const invalidRange = Boolean(from && to && from > to);
  const params = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, sort, ...(from ? { from } : {}), ...(to ? { to } : {}) };
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'payment-history', params],
    queryFn: ({ signal }) => fetchPaymentHistoryPage(params, signal),
    enabled: !invalidRange,
  });
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  useEffect(() => { if (data && page > pages) setPage(pages); }, [data, page, pages]);
  const resetFilters = () => { setFrom(''); setTo(''); setSort('date-desc'); setPage(1); };

  return (
    <div className="payment-history mx-auto w-full max-w-7xl space-y-6">
      <nav aria-label="Breadcrumb" className="payment-breadcrumb"><Link to="/dashboard">Dashboard</Link><span aria-hidden="true">/</span><span aria-current="page">Payments</span></nav>
      <div className="payment-page-heading">
        <div className="payment-page-title">
          <Link to="/dashboard" className="payment-icon-action" aria-label="Back to dashboard" title="Back to dashboard"><FaArrowLeft aria-hidden="true" /></Link>
          <h1 className="text-xl font-bold sm:text-2xl">Payment History</h1>
        </div>
        <Link className="payment-text-link" to="/batches">Enrol in a batch</Link>
      </div>

      <div className="payment-filters">
        <label>From date<input type="date" value={from} max={to || undefined} aria-invalid={invalidRange} aria-describedby={invalidRange ? 'payment-date-error' : undefined} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label>
        <label>To date<input type="date" value={to} min={from || undefined} aria-invalid={invalidRange} aria-describedby={invalidRange ? 'payment-date-error' : undefined} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>
        <label>Sort by<select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
          <option value="date-desc">Date: newest first</option><option value="date-asc">Date: oldest first</option>
          <option value="amount-desc">Amount: highest first</option><option value="amount-asc">Amount: lowest first</option>
        </select></label>
        {(from || to || sort !== 'date-desc') && <button className="payment-icon-action" type="button" title="Reset filters" aria-label="Reset filters" onClick={resetFilters}><FaRotateLeft aria-hidden="true" /></button>}
      </div>

      {invalidRange ? <p id="payment-date-error" role="alert">The end date must not precede the start date.</p> : isLoading ? <ContentSkeleton variant="table" label="Loading payment history" /> : isError ? (
        <div role="alert" className="payment-error"><p>Payment history could not be loaded.</p><Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button></div>
      ) : !data?.total ? (
        <EmptyState title={from || to ? 'No payments in this date range' : 'No payments yet'} description={from || to ? undefined : 'Invoices appear here once you enrol in a course.'} action={from || to ? <Button variant="outline" onClick={resetFilters}>Clear filters</Button> : <Button to="/batches">Browse Batches</Button>} />
      ) : (
        <>
          <p className="payment-result-count" role="status">{data.total} {data.total === 1 ? 'payment' : 'payments'}{from || to ? ' in date range' : ''}</p>
          <div className="payment-table-scroll" role="region" aria-label="Payment records" tabIndex={0}>
            <table className="payment-table">
              <caption className="sr-only">Payment records and filtered totals in BDT</caption>
              <colgroup><col className="payment-col-invoice" /><col className="payment-col-course" /><col className="payment-col-method" /><col className="payment-col-date" /><col className="payment-col-amount" /><col className="payment-col-status" /><col className="payment-col-action" /></colgroup>
              <thead><tr><th scope="col">Invoice</th><th scope="col">Course</th><th scope="col">Method</th><th scope="col">Date</th><th scope="col" className="payment-amount">Amount</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{data.items.map((payment) => (
                <tr key={payment.id}>
                  <td><Link className="payment-invoice-link" to={`/dashboard/invoices/${payment.id}`} title={payment.invoiceNo} aria-label={`View invoice ${payment.invoiceNo}`}>{shortInvoiceNumber(payment.invoiceNo)}</Link></td>
                  <td className="payment-course-title">{payment.courseTitle}</td>
                  <td>{methodLabel(payment.method)}</td>
                  <td><time dateTime={payment.paidAt ?? payment.createdAt}>{formatDate(payment.paidAt ?? payment.createdAt)}</time><small>{payment.paidAt ? 'Paid' : 'Issued'}</small></td>
                  <td className="payment-amount">{formatBDT(payment.amount)}</td>
                  <td><StatusBadge status={payment.status} /></td>
                  <td><Link className="payment-icon-action" to={`/dashboard/invoices/${payment.id}`} aria-label={`Open invoice ${shortInvoiceNumber(payment.invoiceNo)}`} title="View invoice"><FaEye aria-hidden="true" /></Link></td>
                </tr>
              ))}</tbody>
              <tfoot><tr><td colSpan={7}><div className="payment-totals"><strong>{from || to ? 'Date-range totals' : 'All payments totals'}</strong><dl>{Object.entries(data.totals).map(([status, amount]) => <div key={status}><dt>{status}</dt><dd>{formatBDT(amount)}</dd></div>)}</dl></div></td></tr></tfoot>
            </table>
          </div>
          <nav aria-label="Payment pagination" className="payment-pagination">
            <span>Page {page} of {pages}</span>
            <div><button type="button" className="payment-icon-action" aria-label="Previous page" title="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}><FaArrowLeft aria-hidden="true" /></button><button type="button" className="payment-icon-action" aria-label="Next page" title="Next page" disabled={page >= pages} onClick={() => setPage(page + 1)}><FaArrowRight aria-hidden="true" /></button></div>
          </nav>
        </>
      )}
    </div>
  );
}
