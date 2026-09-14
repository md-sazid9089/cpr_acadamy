import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaPaperPlane } from 'react-icons/fa6';
import { fetchAdminComplaints, replyToComplaintAsAdmin, setComplaintStatus } from './api/admin.api.js';
import Card, { CardBody, CardHeader } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { Textarea } from '@/components/ui/Input.jsx';
import ComplaintStatusBadge from '@/features/student-dashboard/components/complaints/ComplaintStatusBadge.jsx';
import { cn, formatDateTime } from '@/lib/utils';

const FILTERS = [
  { id: 'open', label: 'Needs reply' },
  { id: 'answered', label: 'Answered' },
  { id: 'solved', label: 'Solved' },
  { id: 'ALL', label: 'All' },
];

/** Support inbox: every student complaint (and lecture doubt), newest first. */
export default function AdminComplaints() {
  const [filter, setFilter] = useState('open');
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const queryClient = useQueryClient();

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['admin', 'complaints'],
    queryFn: fetchAdminComplaints,
    refetchInterval: 60_000,
  });

  const rows = filter === 'ALL' ? complaints : complaints.filter((item) => item.status === filter);
  const selected = complaints.find((item) => item.id === selectedId) ?? rows[0] ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
  const replyMutation = useMutation({
    mutationFn: replyToComplaintAsAdmin,
    onSuccess: () => {
      setReply('');
      invalidate();
    },
  });
  const statusMutation = useMutation({ mutationFn: setComplaintStatus, onSuccess: invalidate });

  const sendReply = (event) => {
    event.preventDefault();
    if (!selected) return;
    if (!reply.trim()) {
      setReplyError('Enter a reply before sending.');
      return;
    }
    setReplyError('');
    replyMutation.mutate({ id: selected.id, body: reply.trim() });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader title="Complain Box" description="Student support threads and lecture doubts." />
        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filter === option.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Loading threads…" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing here" description="No threads match this filter." />
        ) : (
          <ul className="mt-4 divide-y divide-stone-200 dark:divide-stone-200">
            {rows.map((item) => {
              const last = item.messages[item.messages.length - 1];
              const active = selected?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      'w-full px-5 py-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-surface-dark',
                      active && 'bg-brand-50 dark:bg-brand-950/40',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-stone-900 dark:text-white">{item.relatedTo}</p>
                      <ComplaintStatusBadge status={item.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-brand-200">{item.batchTitle || 'General'}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-stone-600 dark:text-brand-200">{last?.body}</p>
                    <p className="mt-1 text-[11px] text-stone-400">{formatDateTime(last?.sentAt ?? item.createdAt)}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="lg:col-span-3">
        {selected ? (
          <>
            <CardHeader
              title={selected.relatedTo}
              description={
                <>
                  {selected.batchTitle || 'General'} ·{' '}
                  <Link to={`/admin/students/${selected.userId}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                    Open student record
                  </Link>
                </>
              }
              action={
                <div className="flex items-center gap-2">
                  <ComplaintStatusBadge status={selected.status} />
                  {selected.status === 'solved' ? (
                    <Button size="sm" variant="outline" isLoading={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: selected.id, status: 'open' })}>
                      Reopen
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" isLoading={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: selected.id, status: 'solved' })}>
                      Mark solved
                    </Button>
                  )}
                </div>
              }
            />
            <CardBody className="space-y-3">
              {selected.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                    message.from === 'academy'
                      ? 'ml-auto bg-brand-600 text-white'
                      : 'bg-stone-100 text-stone-800 dark:bg-surface-dark dark:text-brand-200',
                  )}
                >
                  <p className="whitespace-pre-line">{message.body}</p>
                  <p className={cn('mt-1 text-[11px]', message.from === 'academy' ? 'text-white/70' : 'text-stone-400')}>
                    {message.from === 'academy' ? 'Academy' : 'Student'} · {formatDateTime(message.sentAt)}
                  </p>
                </div>
              ))}

              {selected.status === 'solved' ? (
                <p className="rounded-lg bg-surface-subtle p-3 text-xs text-stone-500 dark:bg-surface-dark dark:text-brand-200">
                  This thread is closed. Reopen it to reply.
                </p>
              ) : (
                <form onSubmit={sendReply} className="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-200">
                  <Textarea
                    label="Reply to the student"
                    rows={3}
                    value={reply}
                    onChange={(event) => {
                      setReply(event.target.value);
                      setReplyError('');
                    }}
                    placeholder="Dear Doctor, …"
                    error={replyError || replyMutation.error?.message}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" isLoading={replyMutation.isPending}>
                      <FaPaperPlane aria-hidden="true" className="h-3.5 w-3.5" />
                      Send reply
                    </Button>
                  </div>
                </form>
              )}
            </CardBody>
          </>
        ) : (
          <EmptyState title="Select a thread" description="Pick a complaint on the left to read and reply." />
        )}
      </Card>
    </div>
  );
}
