import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { FaPenToSquare, FaPlus, FaTrash } from 'react-icons/fa6';
import {
  createScheduleEntry,
  deleteScheduleEntry,
  fetchAdminExams,
  fetchAdminSchedules,
  fetchAdminVideos,
  updateScheduleEntry,
} from '../api/admin.api.js';
import { adminExamsKey, adminScheduleKey, adminVideosKey } from './keys.js';
import PublishGate from './PublishGate.jsx';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { cn, formatClockTime, formatDate } from '@/lib/utils';

const NONE = '';
const NO_EXAM = 'NO EXAM';
const NO_CLASS = 'NO CLASS';

const EMPTY_FORM = { date: '', time: '14:30', examId: NONE, solveClassVideoId: NONE, lectureVideoId: NONE };

/** 'yyyy-mm-dd' + 'HH:mm' -> the two-line label the public routine prints. */
function routineLabel(date, time) {
  return `${formatDate(`${date}T00:00:00`, { weekday: 'long' })}\n${formatClockTime(time)}`;
}

/**
 * Routine rows for one course. The exam / solve-class / lecture cells are
 * pickers over this course's own exams and videos, with "No exam" / "No class"
 * as explicit choices — never free text, so the public routine can only ever
 * point at something that exists.
 */
export default function CourseScheduleTab() {
  const { course } = useOutletContext();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [scheduleQuery, videosQuery, examsQuery] = useQueries({
    queries: [
      { queryKey: adminScheduleKey(course.id), queryFn: () => fetchAdminSchedules({ courseId: course.id }) },
      { queryKey: adminVideosKey(course.id), queryFn: () => fetchAdminVideos({ courseId: course.id }) },
      { queryKey: adminExamsKey(course.id), queryFn: () => fetchAdminExams({ courseId: course.id }) },
    ],
  });

  const schedule = scheduleQuery.data ?? [];
  const videos = videosQuery.data ?? [];
  const exams = examsQuery.data ?? [];
  const isLoading = scheduleQuery.isLoading || videosQuery.isLoading || examsQuery.isLoading;

  const videoTitle = (id) => videos.find((video) => video.id === id)?.title ?? null;
  const examTitle = (id) => exams.find((exam) => exam.id === id)?.title ?? null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: adminScheduleKey(course.id) });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const createMutation = useMutation({ mutationFn: createScheduleEntry, onSuccess: () => { invalidate(); setEditing(null); } });
  const updateMutation = useMutation({ mutationFn: updateScheduleEntry, onSuccess: () => { invalidate(); setEditing(null); } });
  const deleteMutation = useMutation({ mutationFn: deleteScheduleEntry, onSuccess: () => { invalidate(); setDeleting(null); } });

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10), time: course.classTime?.start || '14:30' });
    setEditing('new');
  };

  const openEdit = (row) => {
    setForm({
      date: row.date,
      time: row.time,
      examId: row.examId ?? NONE,
      solveClassVideoId: row.solveClassVideoId ?? NONE,
      lectureVideoId: row.lectureVideoId ?? NONE,
    });
    setEditing(row);
  };

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      courseId: course.id,
      courseName: course.title,
      date: form.date,
      time: form.time,
      dateTime: routineLabel(form.date, form.time),
      examId: form.examId || null,
      exam: examTitle(form.examId) ?? NO_EXAM,
      solveClassVideoId: form.solveClassVideoId || null,
      solveClass: videoTitle(form.solveClassVideoId) ?? NO_CLASS,
      lectureVideoId: form.lectureVideoId || null,
      lecture: videoTitle(form.lectureVideoId) ?? NO_CLASS,
    };
    if (editing === 'new') createMutation.mutate(payload);
    else updateMutation.mutate({ id: editing.id, ...payload });
  };

  const cell = (id, fallbackLabel, resolve) => {
    const title = id ? resolve(id) : null;
    // A pointer to a deleted item reads as "No …" so the routine never shows a stale name.
    return (
      <span
        className={cn(
          'text-xs',
          title ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-400 dark:text-slate-500',
        )}
      >
        {title ?? fallbackLabel}
      </span>
    );
  };

  const columns = [
    {
      key: 'dateTime',
      header: 'Date & time',
      render: (row) => (
        <span className="whitespace-pre-line text-xs font-semibold text-slate-800 dark:text-slate-200">
          {routineLabel(row.date, row.time)}
        </span>
      ),
    },
    { key: 'exam', header: 'Exam', render: (row) => cell(row.examId, NO_EXAM, examTitle) },
    { key: 'solveClass', header: 'Solve class', render: (row) => cell(row.solveClassVideoId, NO_CLASS, videoTitle) },
    { key: 'lecture', header: 'Lecture', render: (row) => cell(row.lectureVideoId, NO_CLASS, videoTitle) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)} aria-label="Edit routine row">
            <FaPenToSquare aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(row)} aria-label="Delete routine row">
            <FaTrash aria-hidden="true" className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Schedule"
          description="The routine students see. Each row points at this course's own exams and videos."
          action={
            <Button size="sm" onClick={openCreate}>
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Add row
            </Button>
          }
        />
        <div className="mt-4">
          <Table
            columns={columns}
            rows={schedule}
            isLoading={isLoading}
            emptyTitle="No routine rows yet"
            emptyDescription="Add the first date. You can leave any cell as “No exam” or “No class”."
          />
        </div>
      </Card>

      {!isLoading && <PublishGate course={course} videos={videos} exams={exams} schedule={schedule} />}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add routine row' : 'Edit routine row'}
        description={course.title}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" required value={form.date} onChange={set('date')} />
            <Input label="Time" type="time" required value={form.time} onChange={set('time')} />
          </div>

          <Select label="Exam" value={form.examId} onChange={set('examId')}>
            <option value={NONE}>No exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </Select>

          <Select label="Solve class" value={form.solveClassVideoId} onChange={set('solveClassVideoId')}>
            <option value={NONE}>No class</option>
            {videos.map((video) => (
              <option key={video.id} value={video.id}>
                {video.title}
              </option>
            ))}
          </Select>

          <Select label="Lecture" value={form.lectureVideoId} onChange={set('lectureVideoId')}>
            <option value={NONE}>No class</option>
            {videos.map((video) => (
              <option key={video.id} value={video.id}>
                {video.title}
              </option>
            ))}
          </Select>

          {videos.length === 0 && exams.length === 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This course has no videos or exams yet, so every cell will read “No class” / “No exam”.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing === 'new' ? 'Add row' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete routine row"
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
          Remove the {deleting ? routineLabel(deleting.date, deleting.time).replace('\n', ' at ') : ''} row from the routine?
        </p>
      </Modal>
    </div>
  );
}
