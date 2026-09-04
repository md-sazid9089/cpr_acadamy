import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminSchedules,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
  fetchCourseOptions,
} from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { FaPlus, FaTrash, FaPenToSquare } from 'react-icons/fa6';

export default function AdminSchedules() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);

  const [formData, setFormData] = useState({
    courseId: '',
    dateTime: '',
    exam: 'NO EXAM',
    solveClass: 'NO CLASS',
    lecture: '',
  });

  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['admin', 'schedules'],
    queryFn: fetchAdminSchedules,
  });

  const { data: courseOptions = [] } = useQuery({
    queryKey: ['admin', 'courseOptions'],
    queryFn: fetchCourseOptions,
  });

  const createMutation = useMutation({
    mutationFn: createScheduleEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateScheduleEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScheduleEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setDeletingEntry(null);
    },
  });

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormData({
      courseId: courseOptions[0]?.id || 'c-1',
      dateTime: '15 Sep 2026, Tuesday\n02:30 PM',
      exam: 'NO EXAM',
      solveClass: 'NO CLASS',
      lecture: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setFormData({
      courseId: entry.courseId,
      dateTime: entry.dateTime,
      exam: entry.exam,
      solveClass: entry.solveClass,
      lecture: entry.lecture,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const course = courseOptions.find((c) => c.id === formData.courseId);
    const payload = {
      ...formData,
      courseName: course?.title || 'Unknown Course',
    };

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (row) => (
        <span className="whitespace-pre-line text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.dateTime}
        </span>
      ),
    },
    {
      key: 'course',
      header: 'Course / Batch',
      render: (row) => (
        <span className="text-xs text-slate-600 line-clamp-1 dark:text-slate-400">
          {row.courseName}
        </span>
      ),
    },
    {
      key: 'exam',
      header: 'Exam',
      render: (row) => (
        <span
          className={`text-xs font-medium ${
            row.exam === 'NO EXAM'
              ? 'text-slate-400 dark:text-slate-500'
              : 'font-semibold text-brand-700 dark:text-brand-300'
          }`}
        >
          {row.exam}
        </span>
      ),
    },
    {
      key: 'solveClass',
      header: 'Solve Class',
      render: (row) => (
        <span
          className={`text-xs font-medium ${
            row.solveClass === 'NO CLASS'
              ? 'text-slate-400 dark:text-slate-500'
              : 'font-semibold text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {row.solveClass}
        </span>
      ),
    },
    {
      key: 'lecture',
      header: 'Lecture',
      render: (row) => (
        <span
          className={`text-xs ${
            row.lecture === 'NO CLASS'
              ? 'text-slate-400 dark:text-slate-500'
              : 'font-semibold text-slate-900 dark:text-white'
          }`}
        >
          {row.lecture}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEditModal(row)} aria-label="Edit entry">
            <FaPenToSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
            onClick={() => setDeletingEntry(row)}
            aria-label="Delete entry"
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
          title="Batch Schedule Routine"
          description="Manage daily routine entries (Exams, Solve Classes, Lectures) displayed in course schedules."
          action={
            <Button size="sm" onClick={openCreateModal}>
              <FaPlus className="h-3.5 w-3.5" />
              Add Routine Entry
            </Button>
          }
        />

        <div className="mt-4">
          <Table
            columns={columns}
            rows={schedules}
            isLoading={isLoading}
            emptyTitle="No routine entries"
            emptyDescription="Add routine items to publish the course batch schedule."
          />
        </div>
      </Card>

      {/* Add / Edit Entry Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingEntry ? 'Edit Routine Entry' : 'Add Routine Entry'}
        description="Fill in the session details for the batch routine."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Input
            label="Date & Time string"
            required
            value={formData.dateTime}
            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            placeholder="e.g. 20 Jun 2026, Saturday&#10;02:30 PM"
            hint="Supports multiple lines: Date on line 1, Time on line 2."
          />

          <Input
            label="Exam (or 'NO EXAM')"
            required
            value={formData.exam}
            onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
            placeholder="e.g. Renal System (Regular Exam) or NO EXAM"
          />

          <Input
            label="Solve Class (or 'NO CLASS')"
            required
            value={formData.solveClass}
            onChange={(e) => setFormData({ ...formData, solveClass: e.target.value })}
            placeholder="e.g. Renal System (Regular Solve Class) or NO CLASS"
          />

          <Input
            label="Lecture Topic (or 'NO CLASS')"
            required
            value={formData.lecture}
            onChange={(e) => setFormData({ ...formData, lecture: e.target.value })}
            placeholder="e.g. Orientation Program or NO CLASS"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingEntry ? 'Update Entry' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingEntry)}
        onClose={() => setDeletingEntry(null)}
        title="Delete Routine Entry"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingEntry(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingEntry.id)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete this schedule routine entry?
        </p>
      </Modal>
    </>
  );
}
