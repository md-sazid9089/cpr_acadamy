import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaChevronDown, FaChevronUp, FaPenToSquare, FaPlus, FaStar } from 'react-icons/fa6';
import { createHomeReview, deleteHomeReview, fetchAdminHomeReviews, reorderHomeReviews, updateHomeReview } from '../api/homeReviews.api.js';
import { DeleteButton, Problems, StatusPill, Switch } from '../upload/shared.jsx';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import Input, { Textarea } from '@/components/ui/Input.jsx';
import { cn } from '@/lib/utils';

const LIMIT = 12;
const KEY = ['admin', 'home-reviews'];
const EMPTY = { name: '', role: '', quote: '', rating: 5, isPublished: true };

function StarPicker({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-brand-200">Rating</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            aria-pressed={value === star}
            className="rounded p-1 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <FaStar aria-hidden="true" className={cn('h-5 w-5', star <= value ? 'text-brand-400' : 'text-stone-200 dark:text-brand-800')} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Admin section: the reviews shown on the home page under "শিক্ষার্থীদের বিশ্বাসের গল্প!". */
export default function HomeReviewsSection() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | review
  const [form, setForm] = useState(EMPTY);
  const [problems, setProblems] = useState([]);
  const { data: reviews = [], isLoading, isError, error, refetch, isFetching } = useQuery({ queryKey: KEY, queryFn: fetchAdminHomeReviews });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: KEY });
    queryClient.invalidateQueries({ queryKey: ['marketing', 'home-reviews'] });
  };
  const fail = (err) => setProblems([err?.message || 'The change could not be saved.']);
  const save = useMutation({
    mutationFn: (input) => (editing === 'new' ? createHomeReview(input) : updateHomeReview({ id: editing.id, ...input })),
    onSuccess: () => { refresh(); setEditing(null); },
  });
  const toggle = useMutation({ mutationFn: updateHomeReview, onSuccess: refresh, onError: fail });
  const remove = useMutation({ mutationFn: deleteHomeReview, onSuccess: refresh, onError: fail });
  const reorder = useMutation({
    mutationFn: reorderHomeReviews,
    onMutate: (ids) => queryClient.setQueryData(KEY, (list = []) => ids.map((id) => list.find((review) => review.id === id))),
    onSettled: refresh,
    onError: fail,
  });

  const open = (review) => {
    save.reset();
    setForm(review === 'new' ? EMPTY : { name: review.name, role: review.role, quote: review.quote, rating: review.rating, isPublished: review.isPublished });
    setEditing(review);
  };
  const move = (index, delta) => {
    const ids = reviews.map((review) => review.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    reorder.mutate(ids);
  };
  const set = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    save.mutate({ name: form.name.trim(), role: form.role.trim(), quote: form.quote.trim(), rating: form.rating, isPublished: form.isPublished });
  };
  const shown = reviews.filter((review) => review.isPublished).length;

  return (
    <Card>
      <CardHeader
        title="Home page reviews"
        description="The student reviews on the home page, under “শিক্ষার্থীদের বিশ্বাসের গল্প!”. Only reviews switched on appear, in this order."
        action={(
          <Button size="sm" onClick={() => open('new')} disabled={reviews.length >= LIMIT}>
            <FaPlus aria-hidden="true" className="h-3 w-3" />
            Add review
          </Button>
        )}
      />
      <div className="space-y-3 p-5">
        {isLoading ? <ContentSkeleton label="Loading home page reviews" /> : isError ? (
          <EmptyState variant="error" title="Couldn't load the home page reviews" description={error?.message} onRetry={refetch} isFetching={isFetching} />
        ) : reviews.length === 0 ? (
          <EmptyState title="No home page reviews" description="Add a review to show it on the home page. With none switched on, the reviews section is hidden." />
        ) : (
          <>
            <p className="text-sm text-stone-500 dark:text-brand-200">
              <strong className="tabular-nums text-stone-900 dark:text-white">{shown}</strong> on the home page · {reviews.length} of {LIMIT} reviews
            </p>
            <ul className="space-y-2.5">
              {reviews.map((review, index) => (
                <li key={review.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-image border border-stone-200 bg-white p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] dark:border-stone-200 dark:bg-surface-dark">
                  <div className="grid content-start gap-1">
                    <button type="button" aria-label="Move up" disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)} className="flex h-6 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:text-brand-600 disabled:opacity-30 dark:border-stone-200 dark:text-brand-200">
                      <FaChevronUp aria-hidden="true" className="h-3 w-3" />
                    </button>
                    <button type="button" aria-label="Move down" disabled={index === reviews.length - 1 || reorder.isPending} onClick={() => move(index, 1)} className="flex h-6 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:text-brand-600 disabled:opacity-30 dark:border-stone-200 dark:text-brand-200">
                      <FaChevronDown aria-hidden="true" className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-stone-900 dark:text-white">{review.name}</span>
                      {review.role && <span className="text-xs text-stone-500 dark:text-brand-200">{review.role}</span>}
                      <span className="flex gap-0.5 text-brand-400" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: review.rating }).map((_, i) => <FaStar key={i} aria-hidden="true" className="h-3 w-3" />)}
                      </span>
                    </div>
                    <p lang="bn" className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-brand-200">{review.quote}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2.5 sm:col-span-1">
                    <StatusPill on={review.isPublished} onText="On home page" />
                    <Switch label="Show on the home page" checked={review.isPublished} onChange={(isPublished) => toggle.mutate({ id: review.id, isPublished })} />
                    <button type="button" aria-label="Edit review" onClick={() => open(review)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:text-brand-600 dark:border-stone-200 dark:text-brand-200">
                      <FaPenToSquare aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    <DeleteButton label="Delete review" onConfirm={() => remove.mutate(review.id)} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        <Problems items={problems} onDismiss={() => setProblems([])} />
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add home page review' : 'Edit home page review'}>
        <form onSubmit={submit} className="space-y-4">
          {save.error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{save.error.message}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Student name" required maxLength={80} value={form.name} onChange={set('name')} placeholder="e.g. Tasmiah B. Mimi" />
            <Input label="Course or role" maxLength={80} value={form.role} onChange={set('role')} placeholder="e.g. Student, FCPS Part-1" />
          </div>
          <Textarea label="Review" required rows={5} maxLength={600} value={form.quote} onChange={set('quote')} hint={`${form.quote.length} / 600 characters`} />
          <StarPicker value={form.rating} onChange={(rating) => setForm((previous) => ({ ...previous, rating }))} />
          <Switch checked={form.isPublished} onChange={(isPublished) => setForm((previous) => ({ ...previous, isPublished }))}>Show on the home page</Switch>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" isLoading={save.isPending} disabled={!form.name.trim() || !form.quote.trim()}>
              {editing === 'new' ? 'Add review' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
