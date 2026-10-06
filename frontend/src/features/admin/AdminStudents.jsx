import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStudents, updateStudentStatus } from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import { ACCOUNT_STATUS } from '@/constants';
import { cn, formatDate } from '@/lib/utils';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: ACCOUNT_STATUS.AWAITING_APPROVAL, label: 'Pending approval' },
  { id: ACCOUNT_STATUS.ACTIVE, label: 'Active' },
  { id: ACCOUNT_STATUS.SUSPENDED, label: 'Suspended' },
  { id: ACCOUNT_STATUS.REJECTED, label: 'Rejected' },
];

/** Student directory and the approval queue. */
export default function AdminStudents() {
  const [filter, setFilter] = useState(ACCOUNT_STATUS.AWAITING_APPROVAL);
  const [confirming, setConfirming] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'students', filter, search],
    queryFn: () => fetchStudents({ status: filter, search }),
  });

  const statusMutation = useMutation({
    mutationFn: updateStudentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setConfirming(null);
    },
  });

  // Row click opens the record; the action buttons stop propagation so they don't.
  const stop = (handler) => (event) => {
    event.stopPropagation();
    handler();
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="font-medium text-stone-900 dark:text-white">{row.fullName}</p>
          <p className="text-xs text-stone-500 dark:text-brand-200">{row.mobile}</p>
        </div>
      ),
    },
    { key: 'institution', header: 'Institution' },
    { key: 'interest', header: 'Track' },
    {
      key: 'enrolments',
      header: 'Courses',
      align: 'right',
      render: (row) => <span className="text-stone-700 dark:text-brand-200">{row.enrolmentCount ?? row.enrolments?.length ?? 0}</span>,
    },
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
                onClick={stop(() => setConfirming({ student: row, action: ACCOUNT_STATUS.ACTIVE }))}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={stop(() => setConfirming({ student: row, action: ACCOUNT_STATUS.REJECTED }))}
              >
                Reject
              </Button>
            </>
          )}
          {row.status === ACCOUNT_STATUS.ACTIVE && (
            <Button
              size="sm"
              variant="ghost"
              onClick={stop(() => setConfirming({ student: row, action: ACCOUNT_STATUS.SUSPENDED }))}
            >
              Suspend
            </Button>
          )}
          {row.status === ACCOUNT_STATUS.SUSPENDED && (
            <Button
              size="sm"
              variant="outline"
              onClick={stop(() => setConfirming({ student: row, action: ACCOUNT_STATUS.ACTIVE }))}
            >
              Reinstate
            </Button>
          )}
          {row.status === ACCOUNT_STATUS.REJECTED && (
            <Button
              size="sm"
              variant="outline"
              onClick={stop(() => setConfirming({ student: row, action: ACCOUNT_STATUS.ACTIVE }))}
            >
              Approve
            </Button>
          )}
          <Button size="sm" variant="ghost" to={`/admin/students/${row.id}`} onClick={(event) => event.stopPropagation()}>
            View
          </Button>
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
        <CardHeader title="Students" description="Review registrations and manage account access. Click a row for details and payment history." />

        <form
          className="px-5 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            const value = searchText.trim();
            setSearch(value);
            // A support lookup shouldn't miss the student because of the status tab.
            if (value) setFilter('ALL');
          }}
        >
          <Input
            type="search"
            aria-label="Search students"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              if (!event.target.value) setSearch('');
            }}
            placeholder="Search by name, mobile number or Reg No — press Enter"
          />
        </form>

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
          <Table
            columns={columns}
            rows={students}
            isLoading={isLoading}
            isError={isError}
            error={error}
            isFetching={isFetching}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/admin/students/${row.id}`)}
            emptyTitle="No students in this view"
                        emptyDescription={search ? `Nothing matches "${search}". Reg No looks like 26A3F9C1; mobile numbers must be exact.` : 'Try a different filter.'}
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
          <p className="text-sm text-stone-600 dark:text-brand-200">
            <strong className="text-stone-900 dark:text-white">{confirming.student.fullName}</strong>{' '}
            ({confirming.student.mobile}) from {confirming.student.institution}.
            {confirming.action === ACCOUNT_STATUS.ACTIVE
              ? ' They will receive an activation SMS and can sign in immediately.'
              : ' They will lose access and be notified by SMS.'}
          </p>
        )}
        {statusMutation.isError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{statusMutation.error.message}</p>
        )}
      </Modal>
    </>
  );
}
