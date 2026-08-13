import { Link } from 'react-router-dom';
import { usePaymentHistory } from './api/dashboard.queries.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import { PAYMENT_METHODS } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';

const methodLabel = (id) => PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;

export default function PaymentHistory() {
  const { data: payments = [], isLoading } = usePaymentHistory();

  const columns = [
    {
      key: 'invoiceNo',
      header: 'Invoice',
      render: (row) => (
        <Link
          to={`/dashboard/invoices/${row.id}`}
          className="font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          {row.invoiceNo}
        </Link>
      ),
    },
    { key: 'courseTitle', header: 'Course' },
    { key: 'method', header: 'Method', render: (row) => methodLabel(row.method) },
    { key: 'paidAt', header: 'Date', render: (row) => formatDate(row.paidAt) },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-slate-900 dark:text-white">{formatBDT(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Payment history"
        description="Every enrolment payment and its invoice."
        action={
          <Button variant="ghost" size="sm" to="/courses">
            Enrol in a course
          </Button>
        }
      />
      <Table
        columns={columns}
        rows={payments}
        isLoading={isLoading}
        emptyTitle="No payments yet"
        emptyDescription="Invoices appear here once you enrol in a course."
      />
    </Card>
  );
}
