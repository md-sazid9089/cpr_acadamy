import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStudents, updateStudentStatus } from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { ACCOUNT_STATUS } from '@/constants';
import { cn, formatDate } from '@/lib/utils';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: ACCOUNT_STATUS.AWAITING_APPROVAL, label: 'Pending approval' },
  { id: ACCOUNT_STATUS.ACTIVE, label: 'Active' },
  { id: ACCOUNT_STATUS.SUSPENDED, label: 'Suspended' },
];

/** Student directory and the approval queue. */
export default function AdminStudents() {
  const [filter, setFilter] = useState(ACCOUNT_STATUS.AWAITING_APPROVAL);
  const [confirming, setConfirming] = useState(null);
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin', 'students', filter],
    queryFn: () => fetchStudents({ status: filter }),
  });

  const statusMutation = useMutation({
    mutationFn: updateStudentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setConfirming(null);
    },
  });

  const columns = [
    {
      key: 'fullName',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{row.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.mobile}</p>
        </div>
      ),
    },
    { key: 'institution', header: 'Institution' },
    { key: 'interest', header: 'Track' },
    { key: 'createdAt', header: 'Registered', render: (row) => formatDate(row.createdAt) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === ACCOUNT_STATUS.AWAITING_APPROVAL && (
            <>
              <Button
                size="sm"
                onClick={() => setConfirming({ student: row, action: ACCOUNT_STATUS.ACTIVE })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirming({ student: row, action: ACCOUNT_STATUS.REJECTED })}
              >
                Reject
              </Button>
            </>
          )}
          {row.status === ACCOUNT_STATUS.ACTIVE && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming({ student: row, action: ACCOUNT_STATUS.SUSPENDED })}
            >
              Suspend
            </Button>
          )}
          {row.status === ACCOUNT_STATUS.SUSPENDED && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirming({ student: row, action: ACCOUNT_STATUS.ACTIVE })}
            >
              Reinstate
            </Button>
          )}
        </div>
      ),
    },
  ];

  const actionLabels = {
    [ACCOUNT_STATUS.ACTIVE]: 'Activate this account',
    [ACCOUNT_STATUS.REJECTED]: 'Reject this registration',
    [ACCOUNT_STATUS.SUSPENDED]: 'Suspend this account',
  };

  return (
    <>
      <Card>
        <CardHeader title="Students" description="Review registrations and manage account access." />

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
          <Table
            columns={columns}
            rows={students}
            isLoading={isLoading}
            emptyTitle="No students in this view"
            emptyDescription="Try a different filter."
          />
        </div>
      </Card>

      <Modal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title={confirming ? actionLabels[confirming.action] : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              variant={confirming?.action === ACCOUNT_STATUS.ACTIVE ? 'primary' : 'danger'}
              isLoading={statusMutation.isPending}
              onClick={() =>
                statusMutation.mutate({
                  studentId: confirming.student.id,
                  status: confirming.action,
                })
              }
            >
              Confirm
            </Button>
          </>
        }
      >
        {confirming && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white">{confirming.student.fullName}</strong>{' '}
            ({confirming.student.mobile}) from {confirming.student.institution}.
            {confirming.action === ACCOUNT_STATUS.ACTIVE
              ? ' They will receive an activation SMS and can sign in immediately.'
              : ' They will lose access and be notified by SMS.'}
          </p>
        )}
      </Modal>
    </>
  );
}
