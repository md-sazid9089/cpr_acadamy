import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { FaArrowLeftLong, FaEnvelope, FaIdCard, FaPhone, FaSchool } from 'react-icons/fa6';
import { fetchStudent, fetchStudentPayments, updateStudentStatus } from './api/admin.api.js';
import { PAYMENT_COLUMNS } from './AdminRevenue.jsx';
import Card, { CardBody, CardHeader, StatCard } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { ACCOUNT_STATUS, PAYMENT_STATUS } from '@/constants';
import { formatBDT, formatDate, formatDateTime } from '@/lib/utils';

const ACTION_LABELS = {
  [ACCOUNT_STATUS.ACTIVE]: 'Activate this account',
  [ACCOUNT_STATUS.REJECTED]: 'Reject this registration',
  [ACCOUNT_STATUS.SUSPENDED]: 'Suspend this account',
};

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{value || '—'}</p>
      </div>
    </div>
  );
}

/** One student: profile, enrolments and every payment they have made. */
export default function AdminStudentDetail() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(null);

  const [studentQuery, paymentsQuery] = useQueries({
    queries: [
      { queryKey: ['admin', 'student', studentId], queryFn: () => fetchStudent(studentId), enabled: Boolean(studentId) },
      { queryKey: ['admin', 'student', studentId, 'payments'], queryFn: () => fetchStudentPayments(studentId), enabled: Boolean(studentId) },
    ],
  });

  const statusMutation = useMutation({
    mutationFn: updateStudentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setConfirming(null);
    },
  });

  if (studentQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-start justify-center pt-20">
        <Spinner size="lg" label="Loading student…" />
      </div>
    );
  }

  const student = studentQuery.data;
  if (studentQuery.isError || !student) {
    return (
      <EmptyState
        className="min-h-screen"
        title="Student not found"
        description="They may have been removed, or the link is out of date."
        action={<Button to="/admin/students">Back to students</Button>}
      />
    );
  }

  const payments = paymentsQuery.data ?? [];
  const totalPaid = payments.filter((p) => p.status === PAYMENT_STATUS.PAID).reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter((p) => p.status === PAYMENT_STATUS.PENDING).reduce((sum, p) => sum + p.amount, 0);
  const lastPayment = payments.find((p) => p.status === PAYMENT_STATUS.PAID);

  const enrolmentColumns = [
    {
      key: 'courseTitle',
      header: 'Course',
      render: (row) => (
        <Link to={`/admin/courses/${row.courseId}`} className="font-medium text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400">
          {row.courseTitle}
        </Link>
      ),
    },
    { key: 'enrolledAt', header: 'Enrolled', render: (row) => formatDate(row.enrolledAt) },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${row.progress}%` }} />
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400">{row.progress}%</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', align: 'right', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-5">
      <Link
        to="/admin/students"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <FaArrowLeftLong aria-hidden="true" className="h-3 w-3" />
        All students
      </Link>

      <Card>
        <CardHeader
          title={student.fullName}
          description={`Registered ${formatDate(student.createdAt)}${student.lastLoginAt ? ` · last seen ${formatDateTime(student.lastLoginAt)}` : ' · never signed in'}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{student.interest}</Badge>
              <StatusBadge status={student.status} />
              {student.status === ACCOUNT_STATUS.AWAITING_APPROVAL && (
                <>
                  <Button size="sm" onClick={() => setConfirming(ACCOUNT_STATUS.ACTIVE)}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirming(ACCOUNT_STATUS.REJECTED)}>Reject</Button>
                </>
              )}
              {student.status === ACCOUNT_STATUS.ACTIVE && (
                <Button size="sm" variant="ghost" onClick={() => setConfirming(ACCOUNT_STATUS.SUSPENDED)}>Suspend</Button>
              )}
              {student.status === ACCOUNT_STATUS.SUSPENDED && (
                <Button size="sm" variant="outline" onClick={() => setConfirming(ACCOUNT_STATUS.ACTIVE)}>Reinstate</Button>
              )}
            </div>
          }
        />
        <CardBody className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={FaPhone} label="Mobile" value={student.mobile} />
          <Fact icon={FaEnvelope} label="Email" value={student.email} />
          <Fact icon={FaIdCard} label="BMDC number" value={student.bmdcNumber} />
          <Fact icon={FaSchool} label="Institution" value={student.institution} />
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total paid" value={formatBDT(totalPaid)} hint={`${payments.filter((p) => p.status === PAYMENT_STATUS.PAID).length} paid invoices`} />
        <StatCard label="Awaiting payment" value={formatBDT(pendingAmount)} hint={pendingAmount ? 'Pending invoices' : 'Nothing outstanding'} />
        <StatCard label="Last payment" value={lastPayment ? formatBDT(lastPayment.amount) : '—'} hint={lastPayment ? formatDate(lastPayment.paidAt) : 'No payments yet'} />
      </div>

      <Card>
        <CardHeader title="Enrolments" description="Courses this student has access to." />
        <Table
          columns={enrolmentColumns}
          rows={student.enrolments}
          getRowId={(row) => row.courseId}
          emptyTitle="No enrolments"
          emptyDescription="This student has not joined a course yet."
        />
      </Card>

      <Card>
        <CardHeader title="Payment history" description="Every invoice with its method and transaction reference." />
        <Table
          columns={PAYMENT_COLUMNS}
          rows={payments}
          isLoading={paymentsQuery.isLoading}
          emptyTitle="No payments"
          emptyDescription="Nothing has been paid or invoiced for this account."
        />
      </Card>

      <Modal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title={confirming ? ACTION_LABELS[confirming] : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button
              variant={confirming === ACCOUNT_STATUS.ACTIVE ? 'primary' : 'danger'}
              isLoading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ studentId: student.id, status: confirming })}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <strong className="text-slate-900 dark:text-white">{student.fullName}</strong> ({student.mobile}).
          {confirming === ACCOUNT_STATUS.ACTIVE
            ? ' They will receive an activation SMS and can sign in immediately.'
            : ' They will lose access and be notified by SMS.'}
        </p>
        {statusMutation.isError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{statusMutation.error.message}</p>
        )}
      </Modal>
    </div>
  );
}
