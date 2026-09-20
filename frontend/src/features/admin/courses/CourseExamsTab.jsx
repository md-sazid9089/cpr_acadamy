import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaTrash } from 'react-icons/fa6';
import { createExam, deleteExam, fetchAdminExams } from '../api/admin.api.js';
import { adminExamsKey } from './keys.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { QUESTION_TYPES } from '@/constants';
import { cn, formatDateTime } from '@/lib/utils';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: QUESTION_TYPES.SBA, label: 'SBA' },
  { id: QUESTION_TYPES.MTF, label: 'MCQ (True / False)' },
  { id: 'mixed', label: 'Mixed' },
];

export const TYPE_LABELS = {
  [QUESTION_TYPES.SBA]: 'SBA',
  [QUESTION_TYPES.MTF]: 'MCQ (T/F)',
  mixed: 'Mixed',
};

/** Exams belonging to one course. Clicking a row opens the question builder. */
export default function CourseExamsTab() {
  const { course } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ title: '', type: QUESTION_TYPES.SBA });

  const { data: exams = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: adminExamsKey(course.id),
    queryFn: () => fetchAdminExams({ courseId: course.id }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: adminExamsKey(course.id) });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const createMutation = useMutation({
    mutationFn: createExam,
    onSuccess: (exam) => {
      invalidate();
      setCreating(false);
      navigate(`/admin/courses/${course.id}/exams/${exam.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
  });

  const rows = filter === 'ALL' ? exams : exams.filter((exam) => exam.type === filter);

  const handleCreate = (event) => {
    event.preventDefault();
    createMutation.mutate({
      title: form.title.trim(),
      type: form.type,
      kind: 'practice',
      isPublished: false,
      courseId: course.id,
      scheduledAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      durationMinutes: 60,
      questionCount: form.type === QUESTION_TYPES.MTF ? 25 : 50,
      marksPerQuestion: form.type === QUESTION_TYPES.MTF ? 0.4 : 2,
      deductionPercent: 0,
      passMark: 70,
    });
  };

  const columns = [
    {
      key: 'title',
      header: 'Exam',
      render: (row) => <p className="max-w-md font-medium text-stone-900 line-clamp-1 dark:text-white">{row.title}</p>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge tone={row.type === QUESTION_TYPES.SBA ? 'brand' : 'info'}>{TYPE_LABELS[row.type]}</Badge>,
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      render: (row) => <span className="text-xs text-stone-700 dark:text-brand-200">{formatDateTime(row.scheduledAt)}</span>,
    },
    {
      key: 'questions',
      header: 'Questions',
      render: (row) => {
        const written = row.writtenCount ?? 0;
        const complete = written === row.questionCount && !row.incompleteCount;
        return (
          <span className={cn('text-xs font-semibold', complete ? 'text-brand-700 dark:text-brand-400' : 'text-stone-600 dark:text-brand-200')}>
            {written} / {row.questionCount}
            {row.incompleteCount > 0 && <span className="ml-1 font-normal text-brand-700 dark:text-brand-400">({row.incompleteCount} incomplete)</span>}
          </span>
        );
      },
    },
    {
      key: 'totalMarks',
      header: 'Marks',
      align: 'right',
      render: (row) => (
        <span className="text-xs text-stone-600 dark:text-brand-200">
          {row.totalMarks} · {row.durationMinutes}m
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Delete ${row.title}`}
          onClick={(event) => {
            event.stopPropagation();
            setDeleting(row);
          }}
        >
          <FaTrash aria-hidden="true" className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader
          title="Exams"
          description="SBA and MCQ (true/false) papers for this course. Open one to write its questions."
          action={
            <Button
              size="sm"
              onClick={() => {
                setForm({ title: '', type: QUESTION_TYPES.SBA });
                setCreating(true);
              }}
            >
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Create exam
            </Button>
          }
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
            rows={rows}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/admin/courses/${course.id}/exams/${row.id}`)}
            emptyTitle="No exams yet"
            emptyDescription="Create the first paper, then write its questions in the builder."
          />
        </div>
      </Card>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create exam"
        description="Name it and pick the question type. Schedule, duration and marking are set in the builder."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {createMutation.isError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {createMutation.error.message}
            </p>
          )}
          <Input
            label="Exam title"
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Weekly SBA Exam 15"
          />
          <Select
            label="Question type"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
          >
            <option value={QUESTION_TYPES.SBA}>SBA - two marks each</option>
            <option value={QUESTION_TYPES.MTF}>MCQ - five statements, 0.4 marks each</option>
            <option value="mixed">Mixed - 30 MCQ, then 20 SBA</option>
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.title.trim()} isLoading={createMutation.isPending}>
              Create and open builder
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete exam"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.id)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600 dark:text-brand-200">
          Delete <strong className="text-stone-900 dark:text-white">{deleting?.title}</strong> and its{' '}
          {deleting?.writtenCount ?? 0} questions? This cannot be undone.
        </p>
        {deleteMutation.isError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{deleteMutation.error.message}</p>
        )}
      </Modal>
    </>
  );
}
