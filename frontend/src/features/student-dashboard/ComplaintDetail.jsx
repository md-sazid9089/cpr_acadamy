import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useComplaint, useReplyToComplaint } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { formatDateTime } from '@/lib/utils';

/**
 * One message. The student's own replies sit right with a blue bubble; the
 * academy's sit left in green, matching the reference thread.
 */
function Message({ message }) {
  const isStudent = message.from === 'student';

  return (
    <li className={isStudent ? 'text-right' : 'text-left'}>
      <p className="text-xs font-bold text-stone-600 dark:text-brand-200">
        {isStudent ? 'Your Reply' : 'CPR Academy Reply'}
      </p>

      <div
        className={`mt-1.5 inline-block max-w-[85%] rounded-xl px-4 py-3 text-left text-sm leading-relaxed ${
          isStudent
            ? 'bg-brand-50 text-stone-800 dark:bg-brand-950/40 dark:text-brand-200'
            : 'bg-brand-50 text-stone-800 dark:bg-brand-950/30 dark:text-brand-200'
        }`}
      >
        {message.body}
      </div>

      <p className="mt-1.5 text-xs text-stone-500 dark:text-brand-200">
        {formatDateTime(message.sentAt)}
      </p>
    </li>
  );
}

/** /dashboard/complaints/:complaintId — the "Complain Solve" thread. */
export default function ComplaintDetail() {
  const { complaintId } = useParams();
  const { data: complaint, isLoading, isError } = useComplaint(complaintId);
  const reply = useReplyToComplaint();
  const [body, setBody] = useState('');
  const threadEndRef = useRef(null);

  const messageCount = complaint?.messages.length ?? 0;

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messageCount]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading complain…" />
      </div>
    );
  }

  if (isError || !complaint) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Complain Solve" backTo="/dashboard/complaints" />
        <EmptyState
          title="Complain not found"
          description="It may have been removed, or the link is out of date."
          action={<Button to="/dashboard/complaints">Back to Complain Box</Button>}
        />
      </div>
    );
  }

  const isSolved = complaint.status === 'solved';

  const send = async () => {
    await reply.mutateAsync({ id: complaint.id, body: body.trim() });
    setBody('');
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Complain Solve" backTo="/dashboard/complaints" />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-200 dark:bg-surface-dark-subtle">
        {/* ── Thread meta ── */}
        <div className="border-b border-stone-200 pb-4 dark:border-stone-200">
          <p className="text-sm text-stone-700 dark:text-brand-200">
            <span className="font-bold text-stone-900 dark:text-white">Related to:</span>{' '}
            {complaint.relatedTo}
          </p>
          <p className="mt-1 text-sm text-stone-700 dark:text-brand-200">
            <span className="font-bold text-stone-900 dark:text-white">Batch:</span>{' '}
            {complaint.batchTitle}
          </p>
        </div>

        {/* ── Conversation ── */}
        <ul className="max-h-[26rem] space-y-6 overflow-y-auto bg-stone-50/70 p-4 dark:bg-surface-dark">
          {complaint.messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          <li ref={threadEndRef} aria-hidden="true" />
        </ul>

        {/* ── Footer: closing banner, or the reply box ── */}
        {isSolved ? (
          <div className="border-t border-stone-200 pt-5 text-center dark:border-stone-200">
            <p className="text-base font-bold text-brand-600 sm:text-lg dark:text-brand-300">
              This conversation is ended.
            </p>
            <p className="mt-1 text-base font-bold text-brand-600 sm:text-lg dark:text-brand-300">
              Hope you are satisfied with our support
            </p>
          </div>
        ) : (
          <div className="border-t border-stone-200 pt-5 dark:border-stone-200">
            <label
              htmlFor="complaint-reply"
              className="block text-sm font-medium text-stone-700 dark:text-brand-200"
            >
              Your reply
            </label>
            <textarea
              id="complaint-reply"
              rows={3}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add more detail, or let us know if the problem is still there…"
              className="mt-1.5 block w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-stone-200 dark:border-stone-200 dark:bg-surface-dark-subtle dark:text-brand-200"
            />
            <div className="mt-3 flex justify-end">
              <Button
                onClick={send}
                isLoading={reply.isPending}
                disabled={body.trim().length < 5}
              >
                Send reply
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
