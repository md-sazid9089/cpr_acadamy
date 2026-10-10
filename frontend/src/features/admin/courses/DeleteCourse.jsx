import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTrash } from 'react-icons/fa6';
import { deleteCourse } from '../api/admin.api.js';
import Card from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Modal from '@/components/ui/Modal.jsx';

/**
 * Permanently removes a course with its videos, chapters, exams, routine and packages.
 * The API only allows it before any student has enrolled, paid or sat an exam; after
 * that the course keeps its records and can only be unpublished. The admin types the
 * course title to confirm, so a stray click cannot delete it.
 */
export default function DeleteCourse({ course }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteCourse(course.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.removeQueries({ queryKey: ['admin', 'course', course.id] });
      navigate('/admin/courses', { replace: true });
    },
  });
  const close = () => {
    setOpen(false);
    setTyped('');
    mutation.reset();
  };
  const confirmed = typed.trim() === course.title.trim();

  return (
    <Card className="border-red-200 dark:border-red-900/60">
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="text-base font-semibold text-red-700 dark:text-red-400">Delete course</h3>
          <p className="mt-0.5 max-w-prose text-sm text-stone-500 dark:text-brand-200">
            Removes the course with its videos, chapters, exams, schedule and packages. Courses with enrolled students, paid
            fees or exam results can’t be deleted; unpublish them instead.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
          onClick={() => setOpen(true)}
        >
          <FaTrash aria-hidden="true" className="h-3 w-3" />
          Delete course
        </Button>
      </div>
      <Modal
        open={open}
        onClose={close}
        title="Delete this course?"
        description="This can’t be undone."
        footer={
          <>
            <Button type="button" variant="outline" onClick={close}>
              Keep course
            </Button>
            <Button type="button" variant="danger" disabled={!confirmed} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
              Delete permanently
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-stone-600 dark:text-brand-200">
            <strong className="text-stone-900 dark:text-white">{course.title}</strong> and everything inside it will be removed.
            Type the course title to confirm.
          </p>
          <Input
            aria-label="Course title"
            autoComplete="off"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={course.title}
          />
          {mutation.isError && (
            <p role="alert" className="rounded-control border border-stone-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {mutation.error.message}
            </p>
          )}
        </div>
      </Modal>
    </Card>
  );
}
