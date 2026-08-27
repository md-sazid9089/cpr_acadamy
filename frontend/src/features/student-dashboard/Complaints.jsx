import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaPlus, FaAngleRight } from 'react-icons/fa6';
import { COMPLAINT_TOPICS } from './api/dashboard.api.js';
import { useComplaints, useCreateComplaint, useMyCourses } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardPanel from './components/DashboardPanel.jsx';
import ComplaintStatusBadge from './components/complaints/ComplaintStatusBadge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { formatDateTime } from '@/lib/utils';

const schema = z.object({
  relatedTo: z.string().min(1, 'Choose what this is about'),
  batchTitle: z.string().min(1, 'Choose a batch'),
  body: z
    .string()
    .trim()
    .min(15, 'Please describe the problem in at least 15 characters')
    .max(1000, 'Please keep it under 1000 characters'),
});

/** /dashboard/complaints — every complaint this student has opened. */
export default function Complaints() {
  const { data: complaints = [], isLoading } = useComplaints();
  const { data: courses = [] } = useMyCourses();
  const createComplaint = useCreateComplaint();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { relatedTo: '', batchTitle: '', body: '' },
  });

  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = handleSubmit(async (values) => {
    await createComplaint.mutateAsync(values);
    close();
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Complain Box" backTo="/dashboard" />

      <DashboardPanel title="My Complains">
        <div className="mb-5 flex justify-end">
          <Button onClick={() => setOpen(true)}>
            <FaPlus aria-hidden="true" className="mr-2 h-3.5 w-3.5" />
            New Complain
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" label="Loading your complains…" />
          </div>
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No complains yet"
            description="If something is wrong with your batch, sheets, exam or payment, let us know here."
            action={<Button onClick={() => setOpen(true)}>New Complain</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {complaints.map((complaint) => {
              const last = complaint.messages[complaint.messages.length - 1];

              return (
                <li key={complaint.id}>
                  <Link
                    to={`/dashboard/complaints/${complaint.id}`}
                    className="group flex items-center gap-4 rounded-xl border-2 border-brand-300 bg-white p-4 shadow-sm transition-all hover:border-brand-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h3 className="text-sm font-bold text-brand-600 sm:text-base dark:text-brand-300">
                          {complaint.relatedTo}
                        </h3>
                        <ComplaintStatusBadge status={complaint.status} />
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {complaint.batchTitle}
                      </p>

                      <p className="mt-2 line-clamp-1 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">
                          {last.from === 'student' ? 'You' : 'CPR Academy'}:
                        </span>{' '}
                        {last.body}
                      </p>

                      <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDateTime(last.sentAt)}
                      </p>
                    </div>

                    <FaAngleRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-brand-500 transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardPanel>

      <Modal
        open={open}
        onClose={close}
        title="New complain"
        description="Tell us what went wrong and we will get back to you."
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={createComplaint.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} isLoading={createComplaint.isPending}>
              Submit complain
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="complaint-topic"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Related to<span className="ml-0.5 text-red-500">*</span>
            </label>
            <select
              id="complaint-topic"
              {...register('relatedTo')}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-slate-100"
            >
              <option value="">Select a topic…</option>
              {COMPLAINT_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
            {errors.relatedTo && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.relatedTo.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="complaint-batch"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Batch<span className="ml-0.5 text-red-500">*</span>
            </label>
            <select
              id="complaint-batch"
              {...register('batchTitle')}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-slate-100"
            >
              <option value="">Select a batch…</option>
              {courses.map((course) => (
                <option key={course.id} value={course.title}>
                  {course.title}
                </option>
              ))}
            </select>
            {errors.batchTitle && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.batchTitle.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="complaint-body"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Describe the problem<span className="ml-0.5 text-red-500">*</span>
            </label>
            <textarea
              id="complaint-body"
              rows={4}
              {...register('body')}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-slate-100"
            />
            {errors.body && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.body.message}</p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
