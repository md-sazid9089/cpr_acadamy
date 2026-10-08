import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTrash } from 'react-icons/fa6';
import { deleteCourse } from '../api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';

/**
 * Permanently removes a course with its videos, chapters, exams, routine and packages.
 * The API only allows it before any student has enrolled, paid or sat an exam; after
 * that the course keeps its records and can only be unpublished.
 */
export default function DeleteCourse({ course }) {
  const [open, setOpen] = useState(false);
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
    mutation.reset();
  };

  return (
    <Card>
      <CardHeader
        title="Delete course"
        description="Removes the course with its videos, chapters, exams, routine and packages. A course students have enrolled in, paid for or sat exams in cannot be deleted — unpublish it instead."
        action={
          <Button type="button" size="sm" variant="danger" onClick={() => setOpen(true)}>
            <FaTrash aria-hidden="true" className="h-3 w-3" />
            Delete course
          </Button>
        }
      />
      <Modal
        open={open}
        onClose={close}
        title="Delete this course?"
        description="This cannot be undone."
        footer={
          <>
            <Button type="button" variant="outline" onClick={close}>
              Keep course
            </Button>
            <Button type="button" variant="danger" isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600 dark:text-brand-200">
          <strong className="text-stone-900 dark:text-white">{course.title}</strong> and everything inside it will be removed.
        </p>
        {mutation.isError && (
          <p role="alert" className="mt-3 rounded-control border border-stone-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {mutation.error.message}
          </p>
        )}
      </Modal>
    </Card>
  );
}
