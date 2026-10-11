import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaArrowLeft, FaArrowRight, FaRegStar, FaStar, FaTrash } from 'react-icons/fa6';
import { deleteAdminReview, fetchAdminCourses, fetchAdminReviews } from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import FormError from '@/components/ui/FormError.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { Select } from '@/components/ui/Input.jsx';
import { categorySlug } from '@/features/courses/catalog.js';
import { formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 20;

function Stars({ value }) {
  return (
    <span className="inline-flex shrink-0 gap-0.5 text-brand-600 dark:text-brand-300" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const Icon = star <= Math.round(value) ? FaStar : FaRegStar;
        return <Icon key={star} aria-hidden="true" className="h-3.5 w-3.5" />;
      })}
    </span>
  );
}

/** Every instructor review students have left, with who wrote it, so an admin can remove one that breaks the rules. */
export default function AdminReviews() {
  const [courseId, setCourseId] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({ queryKey: ['admin', 'courses'], queryFn: fetchAdminCourses });
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'reviews', courseId, rating, page],
    queryFn: () => fetchAdminReviews({ courseId, rating: Number(rating) || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const total = data?.total ?? 0;
  const reviews = data?.reviews ?? [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const deleteMutation = useMutation({
    mutationFn: deleteAdminReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-reviews'] });
      // The last review on a later page is gone: step back so the list is not empty.
      if (page > 0 && reviews.length === 1) setPage((current) => current - 1);
      setDeleting(null);
    },
  });
  const closeDelete = () => {
    deleteMutation.reset();
    setDeleting(null);
  };
  const filterBy = (setter) => (event) => {
    setter(event.target.value);
    setPage(0);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Instructor Reviews"
          description="What students wrote about their instructors. Reviews are public on each course page; delete one that is abusive, false or off-topic."
          action={
            total > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Stars value={data.average} />
                <span className="font-bold text-stone-900 dark:text-white">{data.average.toFixed(1)} / 5</span>
                <span className="text-stone-500 dark:text-brand-200">({total} {total === 1 ? 'review' : 'reviews'})</span>
              </div>
            )
          }
        />

        <div className="grid gap-3 px-5 pt-4 sm:grid-cols-2 lg:max-w-2xl">
          <Select label="Course" value={courseId} onChange={filterBy(setCourseId)}>
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </Select>
          <Select label="Rating" value={rating} onChange={filterBy(setRating)}>
            <option value="">Any rating</option>
            {[5, 4, 3, 2, 1].map((stars) => (
              <option key={stars} value={stars}>
                {stars} {stars === 1 ? 'star' : 'stars'}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <ContentSkeleton label="Loading reviews" />
        ) : isError ? (
          <EmptyState
            variant="error"
            title="Couldn't load reviews"
            description={error?.message || 'Something went wrong. Please try again.'}
            onRetry={refetch}
            isFetching={isFetching}
          />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews"
            description={courseId || rating ? 'No reviews match these filters.' : 'Students can review the instructor once they finish every lesson of a course.'}
          />
        ) : (
          <>
            <ul className="mt-4 divide-y divide-stone-200 dark:divide-stone-200">
              {reviews.map((review) => (
                <li key={review.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Stars value={review.rating} />
                        <Link
                          to={`/admin/students/${review.userId}`}
                          className="break-words text-sm font-semibold text-stone-900 hover:underline dark:text-white"
                        >
                          {review.studentName}
                        </Link>
                        <span className="text-xs text-stone-500 dark:text-brand-200">{review.studentMobile}</span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-brand-200">
                        <a
                          href={`/courses/${categorySlug(review.courseCategory)}/${review.courseSlug}#instructor-reviews`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-brand-700 hover:underline dark:text-brand-400"
                        >
                          {review.courseTitle}
                        </a>
                        {' · '}
                        <time dateTime={review.updatedAt}>{formatDateTime(review.updatedAt)}</time>
                        {review.updatedAt !== review.createdAt && ' (edited)'}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(review)} aria-label={`Delete review by ${review.studentName}`}>
                      <FaTrash aria-hidden="true" className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700 dark:text-brand-200">{review.feedback}</p>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <nav aria-label="Review pages" className="flex items-center justify-between gap-3 border-t border-stone-200 px-5 py-3">
                <Button size="sm" variant="outline" aria-label="Previous reviews" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
                  <FaArrowLeft aria-hidden="true" />
                </Button>
                <span className="text-sm text-stone-600 dark:text-brand-200">
                  Page {page + 1} of {pages}
                </span>
                <Button size="sm" variant="outline" aria-label="Next reviews" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>
                  <FaArrowRight aria-hidden="true" />
                </Button>
              </nav>
            )}
          </>
        )}
      </Card>

      <Modal
        open={Boolean(deleting)}
        onClose={closeDelete}
        title="Delete review"
        footer={
          <>
            <Button variant="outline" onClick={closeDelete}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.id)}>
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormError>{deleteMutation.error?.message}</FormError>
          <p className="text-sm text-stone-600 dark:text-brand-200">
            Delete <strong className="text-stone-900 dark:text-white">{deleting?.studentName}</strong>&rsquo;s review of{' '}
            <strong className="text-stone-900 dark:text-white">{deleting?.courseTitle}</strong>? It disappears from the course page and cannot be undone.
          </p>
          {deleting?.feedback && (
            <blockquote className="line-clamp-4 whitespace-pre-wrap break-words border-l-2 border-stone-200 pl-3 text-sm text-stone-500 dark:text-brand-200">
              {deleting.feedback}
            </blockquote>
          )}
        </div>
      </Modal>
    </>
  );
}
