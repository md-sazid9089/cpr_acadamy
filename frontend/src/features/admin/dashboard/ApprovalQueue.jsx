import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaCheck, FaXmark } from 'react-icons/fa6';
import { fetchStudents, updateStudentStatus } from '../api/admin.api.js';
import { Avatar, DashboardCardHeader, timeAgo } from './parts.jsx';
import Card from '@/components/ui/Card.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { ACCOUNT_STATUS } from '@/constants';
import { cn } from '@/lib/utils';

const SHOWN = 5;

/** Reject asks for a second click: it ends the registration and texts the student. */
function RejectButton({ name, onConfirm, disabled }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (armed) { setArmed(false); onConfirm(); return; }
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), 3000);
      }}
      aria-label={armed ? `Click again to reject ${name}` : `Reject ${name}`}
      title={armed ? 'Click again to reject' : 'Reject'}
      className={cn(
        'flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-40',
        armed ? 'border-red-500 bg-red-50 px-3 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'w-10 border-stone-200 text-red-600 hover:border-red-500 hover:bg-red-50 dark:border-stone-200 dark:text-red-300 dark:hover:bg-red-950/40',
      )}
    >
      <FaXmark aria-hidden="true" className="h-4 w-4" />
      {armed && 'Reject?'}
    </button>
  );
}

/** Registrations waiting to be activated, with one-click approve and a confirmed reject. */
export default function ApprovalQueue({ pendingCount }) {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState('');
  const { data: students = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'students', ACCOUNT_STATUS.AWAITING_APPROVAL, ''],
    queryFn: () => fetchStudents({ status: ACCOUNT_STATUS.AWAITING_APPROVAL }),
  });
  const decide = useMutation({
    mutationFn: updateStudentStatus,
    onSuccess: () => { setProblem(''); queryClient.invalidateQueries({ queryKey: ['admin'] }); },
    onError: (err) => setProblem(err?.message || 'The change could not be saved.'),
  });
  // The oldest registrations have waited longest, so they come first.
  const queue = [...students].reverse();
  const waiting = pendingCount ?? queue.length;

  return (
    <Card className="flex flex-col overflow-hidden">
      <DashboardCardHeader
        title="Approval queue"
        count={waiting}
        description="New registrations waiting to be activated."
        infoLabel="About the approval queue"
        info="New accounts stay inactive until you approve them. Approving texts the student and opens their dashboard; rejecting ends the registration and texts them too. Oldest first."
      />
      {isLoading ? <div className="p-5"><ContentSkeleton label="Loading registrations" /></div> : isError ? (
        <EmptyState variant="error" title="Couldn't load registrations" description={error?.message} onRetry={refetch} isFetching={isFetching} />
      ) : queue.length === 0 ? (
        <EmptyState title="All caught up" description="No registrations are waiting for approval." />
      ) : (
        <ul className="divide-y divide-stone-200 dark:divide-stone-200">
          {queue.slice(0, SHOWN).map((student) => {
            const busy = decide.isPending && decide.variables?.studentId === student.id;
            const details = [student.interest, student.mobile, timeAgo(student.createdAt)].filter(Boolean).join(', ');
            return (
              <li key={student.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                <Avatar name={student.fullName} />
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/students/${student.id}`} className="block truncate font-semibold text-stone-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300">
                    {student.fullName}
                  </Link>
                  <p className="truncate text-sm text-stone-500 dark:text-brand-200" title={details}>{details}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => decide.mutate({ studentId: student.id, status: ACCOUNT_STATUS.ACTIVE })}
                  aria-label={`Approve ${student.fullName}`}
                  title="Approve"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-brand-600 transition-colors hover:border-brand-500 hover:bg-brand-50 disabled:opacity-40 dark:border-stone-200 dark:text-brand-300 dark:hover:bg-brand-950/40"
                >
                  <FaCheck aria-hidden="true" className="h-4 w-4" />
                </button>
                <RejectButton name={student.fullName} disabled={busy} onConfirm={() => decide.mutate({ studentId: student.id, status: ACCOUNT_STATUS.REJECTED })} />
              </li>
            );
          })}
        </ul>
      )}
      {problem && <p role="alert" className="mx-5 mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{problem}</p>}
      {queue.length > 0 && (
        <div className="mt-auto border-t border-stone-200 p-4 dark:border-stone-200">
          <Link
            to="/admin/students"
            className="flex min-h-[44px] items-center justify-center rounded-control bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Review all {waiting}
          </Link>
        </div>
      )}
    </Card>
  );
}
