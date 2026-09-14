import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { FaStar, FaRegStar, FaTrashCan, FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import {
  fetchInstructorReviews, fetchMyInstructorReview, saveInstructorReview, deleteInstructorReview,
} from '../api/courses.api.js';

function Rating({ value }) {
  return (
    <span className="inline-flex shrink-0 gap-1 text-brand-600 dark:text-brand-300" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => {
        const Icon = star <= Math.round(value) ? FaStar : FaRegStar;
        return <Icon key={star} aria-hidden="true" className="h-4 w-4" />;
      })}
    </span>
  );
}

function ReviewForm({ review, canReview, mutation }) {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [feedback, setFeedback] = useState(review?.feedback ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <form
      className="space-y-4 border-t border-stone-200 pt-6"
      onSubmit={event => {
        event.preventDefault();
        mutation.mutate({ rating, feedback: feedback.trim() });
      }}
    >
      <h3 className="text-base font-semibold text-stone-900 dark:text-white">{review ? 'Your review' : 'Review your instructor'}</h3>
      {!canReview && <p className="text-sm text-stone-600 dark:text-brand-200">An active enrollment is required to edit your review.</p>}
      <fieldset disabled={!canReview || mutation.isPending}>
        <legend className="mb-2 text-sm font-medium text-stone-700 dark:text-brand-200">Instructor rating</legend>
        <div className="flex w-fit gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <label key={star} className="relative cursor-pointer" title={`${star} ${star === 1 ? 'star' : 'stars'}`}>
              <input
                type="radio"
                name="instructor-rating"
                value={star}
                checked={rating === star}
                onChange={() => setRating(star)}
                required
                aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                className="peer sr-only"
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-200 text-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-disabled:opacity-50 dark:text-brand-300">
                {star <= rating ? <FaStar aria-hidden="true" className="h-6 w-6" /> : <FaRegStar aria-hidden="true" className="h-6 w-6" />}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="instructor-feedback" className="mb-2 block text-sm font-medium text-stone-700 dark:text-brand-200">Your feedback</label>
        <textarea
          id="instructor-feedback"
          value={feedback}
          onChange={event => setFeedback(event.target.value)}
          required
          maxLength={2000}
          rows={4}
          disabled={!canReview || mutation.isPending}
          aria-describedby="instructor-feedback-count"
          className="block w-full resize-y rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-60 dark:bg-surface-dark dark:text-white"
        />
        <p id="instructor-feedback-count" className="mt-1 text-right text-xs text-stone-500 dark:text-brand-200">{feedback.length}/2000</p>
      </div>
      <p className="text-xs text-stone-500 dark:text-brand-200">Your name and review will be public.</p>
      <div className="flex flex-wrap items-center gap-3">
        {canReview && (
          <Button type="submit" isLoading={mutation.isPending} disabled={!rating || !feedback.trim()}>
            {review ? 'Update review' : 'Submit review'}
          </Button>
        )}
        {review && !confirmDelete && (
          <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => setConfirmDelete(true)}>
            <FaTrashCan aria-hidden="true" className="mr-2 h-4 w-4" />Delete review
          </Button>
        )}
        {confirmDelete && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-stone-700 dark:text-brand-200">Delete your review?</span>
            <Button type="button" variant="danger" isLoading={mutation.isPending} onClick={() => mutation.mutate(null)}>Delete</Button>
            <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => setConfirmDelete(false)}>Cancel</Button>
          </div>
        )}
      </div>
    </form>
  );
}

export default function InstructorReviews({ slug }) {
  const { user, isAuthenticated, isApproved } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState('');
  const publicKey = ['instructor-reviews', slug];
  const ownKey = ['instructor-review', slug, user?.id];
  const reviews = useQuery({
    queryKey: [...publicKey, page],
    queryFn: () => fetchInstructorReviews(slug, page),
  });
  const own = useQuery({
    queryKey: ownKey,
    queryFn: () => fetchMyInstructorReview(slug),
    enabled: isAuthenticated && isApproved,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: review => review ? saveInstructorReview(slug, review) : deleteInstructorReview(slug),
    onMutate: () => setNotice(''),
    onSuccess: async (_result, review) => {
      setPage(0);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: publicKey }),
        queryClient.invalidateQueries({ queryKey: ownKey }),
      ]);
      setNotice(review ? 'Your review has been saved.' : 'Your review has been deleted.');
    },
  });
  const total = reviews.data?.total ?? 0;

  return (
    <section id="instructor-reviews" aria-labelledby="instructor-reviews-heading" className="min-w-0 scroll-mt-24 border-y border-stone-200 py-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <h2 id="instructor-reviews-heading" className="text-lg font-bold text-brand-900 dark:text-brand-300">Instructor Reviews</h2>
        {total > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Rating value={reviews.data.average} />
            <span className="font-bold text-stone-900 dark:text-white">{reviews.data.average.toFixed(1)} / 5</span>
            <span className="text-stone-500 dark:text-brand-200">({total} {total === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
      </div>
      {reviews.isLoading ? <Spinner label="Loading instructor reviews" /> : reviews.isError ? (
        <div className="mb-6 space-y-3">
          <p role="alert" className="text-sm text-red-600">Reviews could not be loaded.</p>
          <Button variant="outline" onClick={() => reviews.refetch()}>Try again</Button>
        </div>
      ) : total === 0 ? (
        <p className="pb-6 text-sm text-stone-500 dark:text-brand-200">No instructor reviews yet.</p>
      ) : (
        <>
          <ul className="mb-6 divide-y divide-stone-200">
            {reviews.data.reviews.map(review => (
              <li key={review.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-stone-900 dark:text-white">{review.studentName}</p>
                    <time dateTime={review.updatedAt} className="text-xs text-stone-500 dark:text-brand-200">{formatDate(review.updatedAt)}</time>
                  </div>
                  <Rating value={review.rating} />
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700 dark:text-brand-200">{review.feedback}</p>
              </li>
            ))}
          </ul>
          {(total > 5 || page > 0) && (
            <nav aria-label="Review pages" className="mb-6 flex items-center justify-between gap-3">
              <Button variant="outline" aria-label="Previous reviews" title="Previous reviews" disabled={page === 0} onClick={() => setPage(current => current - 1)}><FaArrowLeft aria-hidden="true" /></Button>
              <span className="text-sm text-stone-600 dark:text-brand-200">Page {page + 1} of {Math.max(1, Math.ceil(total / 5))}</span>
              <Button variant="outline" aria-label="Next reviews" title="Next reviews" disabled={(page + 1) * 5 >= total} onClick={() => setPage(current => current + 1)}><FaArrowRight aria-hidden="true" /></Button>
            </nav>
          )}
        </>
      )}
      {!isAuthenticated ? (
        <Button to="/login" state={{ from: location }} variant="outline">Sign in to review</Button>
      ) : !isApproved ? (
        <p className="text-sm text-stone-600 dark:text-brand-200">An approved student account is required to review.</p>
      ) : own.isLoading ? <Spinner label="Checking review eligibility" /> : own.isError ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-red-600">Your review details could not be loaded.</p>
          <Button variant="outline" onClick={() => own.refetch()}>Try again</Button>
        </div>
      ) : own.data?.canReview || own.data?.review ? (
        <ReviewForm key={`${user.id}:${own.data.review?.id ?? 'new'}`} review={own.data.review} canReview={own.data.canReview} mutation={mutation} />
      ) : (
        <p className="text-sm text-stone-600 dark:text-brand-200">Only students with an active enrollment in this course can review the instructor.</p>
      )}
      {mutation.isError && <p role="alert" className="mt-3 text-sm text-red-600">{mutation.error.message}</p>}
      <p role="status" className="mt-3 text-sm text-brand-700 dark:text-brand-300">{notice}</p>
    </section>
  );
}