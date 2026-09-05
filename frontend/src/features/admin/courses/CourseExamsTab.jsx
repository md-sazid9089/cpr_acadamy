import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaTrash } from 'react-icons/fa6';
import { createExam, deleteExam, fetchAdminExams } from '../api/admin.api.js';
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
];

export const TYPE_LABELS = {
  [QUESTION_TYPES.SBA]: 'SBA',
  [QUESTION_TYPES.MTF]: 'MCQ (T/F)',
};

export const adminExamsKey = (courseId) => ['admin', 'exams', courseId];

/** Exams belonging to one course. Clicking a row opens the question builder. */
export default function CourseExamsTab() {
  const { course } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ title: '', type: QUESTION_TYPES.SBA });

  const { data: exams = [], isLoading } = useQuery({
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
      courseId: course.id,
      courseName: course.title,
      scheduledAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      durationMinutes: 60,
      questionCount: form.type === QUESTION_TYPES.MTF ? 25 : 50,
      marksPerQuestion: 1,
      deductionPercent: 25,
      status: 'upcoming',
    });
  };

  const columns = [
    {
      key: 'title',
      header: 'Exam',
      render: (row) => <p className="max-w-md font-medium text-slate-900 line-clamp-1 dark:text-white">{row.title}</p>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge tone={row.type === QUESTION_TYPES.SBA ? 'brand' : 'info'}>{TYPE_LABELS[row.type]}</Badge>,
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      render: (row) => <span className="text-xs text-slate-700 dark:text-slate-300">{formatDateTime(row.scheduledAt)}</span>,
    },
    {
      key: 'questions',
      header: 'Questions',
      render: (row) => {
        const written = row.questions?.length ?? 0;
        const complete = written >= row.questionCount;
        return (
          <span className={cn('text-xs font-semibold', complete ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400')}>
            {written} / {row.questionCount}
          </span>
        );
      },
    },
    {
      key: 'totalMarks',
      header: 'Marks',
      align: 'right',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
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
            rows={rows}
            isLoading={isLoading}
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
            <option value={QUESTION_TYPES.SBA}>SBA — single best answer, one mark each</option>
            <option value={QUESTION_TYPES.MTF}>MCQ — five true/false statements, five marks each</option>
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
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Delete <strong className="text-slate-900 dark:text-white">{deleting?.title}</strong> and its{' '}
          {deleting?.questions?.length ?? 0} questions? This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
