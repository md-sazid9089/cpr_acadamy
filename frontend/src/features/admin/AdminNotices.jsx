import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaPenToSquare, FaPlus, FaThumbtack, FaTrash } from 'react-icons/fa6';
import { createAnnouncement, deleteAnnouncement, fetchAdminAnnouncements, updateAnnouncement } from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import Input, { Select, Textarea } from '@/components/ui/Input.jsx';
import { formatDateTime } from '@/lib/utils';

const CATEGORIES = ['General', 'Exam', 'Class', 'Payment'];
const EMPTY = { title: '', body: '', category: 'General', pinned: false, isPublished: true };

/** Notices shown on every student's dashboard, pinned ones first. */
export default function AdminNotices() {
  const [editing, setEditing] = useState(null); // null | 'new' | notice
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const queryClient = useQueryClient();

  const { data: notices = [], isLoading, isError, error, isFetching, refetch } = useQuery({ queryKey: ['admin', 'announcements'], queryFn: fetchAdminAnnouncements });

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'notices'] });
    setEditing(null);
    setDeleting(null);
  };
  const createMutation = useMutation({ mutationFn: createAnnouncement, onSuccess: done });
  const updateMutation = useMutation({ mutationFn: updateAnnouncement, onSuccess: done });
  const deleteMutation = useMutation({ mutationFn: deleteAnnouncement, onSuccess: done });
  const saveError = createMutation.error ?? updateMutation.error;

  const openCreate = () => {
    setForm(EMPTY);
    setEditing('new');
  };
  const openEdit = (notice) => {
    setForm({ title: notice.title, body: notice.body, category: notice.category, pinned: notice.pinned, isPublished: notice.isPublished });
    setEditing(notice);
  };
  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const payload = { ...form, title: form.title.trim(), body: form.body.trim() };
    if (editing === 'new') createMutation.mutate(payload);
    else updateMutation.mutate({ id: editing.id, ...payload });
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Notices"
          description="Announcements every student sees on their dashboard. Pinned notices stay at the top."
          action={
            <Button size="sm" onClick={openCreate}>
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              New notice
            </Button>
          }
        />
        {isLoading ? (
          <ContentSkeleton label="Loading notices" />
        ) : isError ? (
          <EmptyState
            variant="error"
            title="Couldn't load notices"
            description={error?.message || 'Something went wrong. Please try again.'}
            onRetry={refetch}
            isFetching={isFetching}
          />
        ) : notices.length === 0 ? (
          <EmptyState
            title="No notices yet"
            description="Publish exam dates, schedule changes or payment reminders here."
            action={
              <Button size="sm" onClick={openCreate}>
                <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
                New notice
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-stone-200 dark:divide-stone-200">
            {notices.map((notice) => (
              <li key={notice.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {notice.pinned && <FaThumbtack aria-hidden="true" className="h-3 w-3 text-brand-600 dark:text-brand-400" />}
                    <p className="font-medium text-stone-900 dark:text-white">{notice.title}</p>
                    <Badge tone="neutral">{notice.category}</Badge>
                    {!notice.isPublished && <Badge tone="warning">Hidden</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-brand-200">{notice.body}</p>
                  <p className="mt-1 text-xs text-stone-400">{formatDateTime(notice.publishedAt)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(notice)} aria-label={`Edit ${notice.title}`}>
                    <FaPenToSquare aria-hidden="true" className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(notice)} aria-label={`Delete ${notice.title}`}>
                    <FaTrash aria-hidden="true" className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New notice' : 'Edit notice'}>
        <form onSubmit={submit} className="space-y-4">
          {saveError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {saveError.message}
            </p>
          )}
          <Input label="Title" required maxLength={200} value={form.title} onChange={set('title')} />
          <Textarea label="Message" required rows={5} value={form.body} onChange={set('body')} />
          <Select label="Category" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-5 text-sm text-stone-700 dark:text-brand-200">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-stone-200 text-brand-600" checked={form.pinned} onChange={set('pinned')} />
              Pin to top
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-stone-200 text-brand-600" checked={form.isPublished} onChange={set('isPublished')} />
              Visible to students
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing === 'new' ? 'Publish notice' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete notice"
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
          Delete <strong className="text-stone-900 dark:text-white">{deleting?.title}</strong>? Students will no longer see it.
        </p>
      </Modal>
    </>
  );
}
