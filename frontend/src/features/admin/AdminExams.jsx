import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminExams,
  createExam,
  updateExam,
  deleteExam,
  fetchCourseOptions,
} from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { QUESTION_TYPES } from '@/constants';
import { cn, formatDateTime } from '@/lib/utils';
import { FaPlus, FaTrash, FaPenToSquare } from 'react-icons/fa6';

const FILTERS = [
  { id: 'ALL', label: 'All Exams' },
  { id: QUESTION_TYPES.SBA, label: 'SBA (Single Best Answer)' },
  { id: QUESTION_TYPES.MTF, label: 'MCQ (True / False)' },
];

export default function AdminExams() {
  const [filter, setFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deletingExam, setDeletingExam] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    type: QUESTION_TYPES.SBA,
    scheduledAt: '',
    durationMinutes: 60,
    questionCount: 50,
    totalMarks: 50,
    status: 'upcoming',
  });

  const queryClient = useQueryClient();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['admin', 'exams', filter],
    queryFn: () => fetchAdminExams({ type: filter }),
  });

  const { data: courseOptions = [] } = useQuery({
    queryKey: ['admin', 'courseOptions'],
    queryFn: fetchCourseOptions,
  });

  const createMutation = useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'exams'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'exams'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'exams'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setDeletingExam(null);
    },
  });

  const openCreateModal = () => {
    setEditingExam(null);
    setFormData({
      title: '',
      courseId: courseOptions[0]?.id || 'c-1',
      type: QUESTION_TYPES.SBA,
      scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      durationMinutes: 60,
      questionCount: 50,
      totalMarks: 50,
      status: 'upcoming',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      courseId: exam.courseId,
      type: exam.type,
      scheduledAt: exam.scheduledAt ? new Date(exam.scheduledAt).toISOString().slice(0, 16) : '',
      durationMinutes: exam.durationMinutes,
      questionCount: exam.questionCount,
      totalMarks: exam.totalMarks,
      status: exam.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const course = courseOptions.find((c) => c.id === formData.courseId);
    const payload = {
      ...formData,
      durationMinutes: Number(formData.durationMinutes),
      questionCount: Number(formData.questionCount),
      totalMarks: Number(formData.totalMarks),
      courseName: course?.title || 'Unknown Course',
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
    };

    if (editingExam) {
      updateMutation.mutate({ id: editingExam.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Exam Title & Course',
      render: (row) => (
        <div className="max-w-md">
          <p className="font-medium text-slate-900 line-clamp-1 dark:text-white">{row.title}</p>
          <p className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400">{row.courseName}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge tone={row.type === QUESTION_TYPES.SBA ? 'brand' : 'info'}>
          {row.type === QUESTION_TYPES.SBA ? 'SBA' : 'MCQ (T/F)'}
        </Badge>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled Date',
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {formatDateTime(row.scheduledAt)}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Questions / Marks',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.questionCount} Qs · {row.totalMarks} M ({row.durationMinutes}m)
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEditModal(row)} aria-label="Edit exam">
            <FaPenToSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
            onClick={() => setDeletingExam(row)}
            aria-label="Delete exam"
          >
            <FaTrash className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader
          title="Exams Management"
          description="Create and manage SBA and MCQ (True/False) exams for courses."
          action={
            <Button size="sm" onClick={openCreateModal}>
              <FaPlus className="h-3.5 w-3.5" />
              Create Exam
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
            rows={exams}
            isLoading={isLoading}
            emptyTitle="No exams found"
            emptyDescription="Create an SBA or MCQ exam to appear on the student Course Hub."
          />
        </div>
      </Card>

      {/* Add / Edit Exam Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingExam ? 'Edit Exam' : 'Create New Exam'}
        description="Configure exam type, duration, marks and schedule."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Exam Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. FCPS Part-1 Weekly SBA Exam 15"
          />

          <Select
            label="Course / Batch"
            required
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
          >
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Exam Type"
              required
              value={formData.type}
              onChange={(e) => {
                const type = e.target.value;
                setFormData({
                  ...formData,
                  type,
                  totalMarks: type === QUESTION_TYPES.MTF ? 125 : 50,
                });
              }}
            >
              <option value={QUESTION_TYPES.SBA}>SBA (Single Best Answer)</option>
              <option value={QUESTION_TYPES.MTF}>MCQ (True / False)</option>
            </Select>

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="upcoming">Upcoming</option>
              <option value="running">Running</option>
              <option value="published">Published</option>
            </Select>
          </div>

          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            required
            value={formData.scheduledAt}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Duration (min)"
              type="number"
              required
              min={5}
              max={300}
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
            />
            <Input
              label="Questions"
              type="number"
              required
              min={1}
              value={formData.questionCount}
              onChange={(e) => setFormData({ ...formData, questionCount: e.target.value })}
            />
            <Input
              label="Total Marks"
              type="number"
              required
              min={1}
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingExam ? 'Update Exam' : 'Create Exam'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingExam)}
        onClose={() => setDeletingExam(null)}
        title="Delete Exam"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingExam(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingExam.id)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingExam?.title}</strong>?
          This action will permanently remove the exam from the course syllabus.
        </p>
      </Modal>
    </>
  );
}
