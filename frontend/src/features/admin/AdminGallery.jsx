import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaPenToSquare, FaPlus, FaTrash } from 'react-icons/fa6';
import { createGalleryPhoto, deleteGalleryPhoto, fetchAdminGallery, updateGalleryPhoto, uploadImage } from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import Input from '@/components/ui/Input.jsx';

const EMPTY = { section: '', caption: '', imageUrl: '', position: 0, isPublished: true };

/** Photos shown on the public Gallery page, grouped into admin-named sections. */
export default function AdminGallery() {
  const [filter, setFilter] = useState('ALL');
  const [editing, setEditing] = useState(null); // null | 'new' | photo
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: photos = [], isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'gallery'],
    queryFn: fetchAdminGallery,
  });

  const sections = useMemo(() => [...new Set(photos.map((photo) => photo.section))].sort(), [photos]);
  const rows = filter === 'ALL' ? photos : photos.filter((photo) => photo.section === filter);

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] });
    queryClient.invalidateQueries({ queryKey: ['marketing', 'gallery'] });
    setEditing(null);
    setDeleting(null);
  };
  const createMutation = useMutation({ mutationFn: createGalleryPhoto, onSuccess: done });
  const updateMutation = useMutation({ mutationFn: updateGalleryPhoto, onSuccess: done });
  const deleteMutation = useMutation({ mutationFn: deleteGalleryPhoto, onSuccess: done });
  const saveError = createMutation.error ?? updateMutation.error;

  const openCreate = () => {
    setForm({ ...EMPTY, section: filter === 'ALL' ? '' : filter });
    setUploadError('');
    setEditing('new');
  };
  const openEdit = (photo) => {
    setForm({ section: photo.section, caption: photo.caption, imageUrl: photo.imageUrl, position: photo.position, isPublished: photo.isPublished });
    setUploadError('');
    setEditing(photo);
  };
  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  const uploadPhoto = async (event) => {
    const [file] = event.target.files ?? [];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setForm((previous) => ({ ...previous, imageUrl }));
    } catch (uploadErr) {
      setUploadError(uploadErr.message || 'The image could not be uploaded.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const payload = { ...form, section: form.section.trim(), caption: form.caption.trim(), position: Number(form.position) || 0 };
    if (editing === 'new') createMutation.mutate(payload);
    else updateMutation.mutate({ id: editing.id, ...payload });
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Gallery"
          description="Photos shown on the public Gallery page, organized into sections students browse through."
          action={
            <Button size="sm" onClick={openCreate}>
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Add photo
            </Button>
          }
        />

        {sections.length > 0 && (
          <div className="flex flex-wrap gap-2 px-5 pt-4">
            {['ALL', ...sections].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === option
                    ? 'bg-brand-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200'
                }`}
              >
                {option === 'ALL' ? 'All sections' : option}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <ContentSkeleton label="Loading photos" />
        ) : isError ? (
          <EmptyState
            variant="error"
            title="Couldn't load the gallery"
            description={error?.message || 'Something went wrong. Please try again.'}
            onRetry={refetch}
            isFetching={isFetching}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No photos yet"
            description="Upload the first photo. Give it a section name like “Convocation” or “Campus Life” — students will see them grouped that way."
            action={
              <Button size="sm" onClick={openCreate}>
                <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
                Add photo
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
                <img src={photo.imageUrl} alt={photo.caption || photo.section} className="aspect-[4/3] w-full object-cover" />
                <div className="space-y-1 p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{photo.section}</Badge>
                    {!photo.isPublished && <Badge tone="warning">Hidden</Badge>}
                  </div>
                  {photo.caption && <p className="line-clamp-2 text-xs text-stone-600 dark:text-brand-200">{photo.caption}</p>}
                  <div className="flex justify-end gap-1 pt-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(photo)} aria-label="Edit photo">
                      <FaPenToSquare aria-hidden="true" className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(photo)} aria-label="Delete photo">
                      <FaTrash aria-hidden="true" className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add photo' : 'Edit photo'}>
        <form onSubmit={submit} className="space-y-4">
          {saveError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {saveError.message}
            </p>
          )}

          <Input
            label="Section"
            required
            list="gallery-sections"
            placeholder="e.g. Convocation, Campus Life"
            hint="Type an existing section to add to it, or a new name to start one."
            value={form.section}
            onChange={set('section')}
          />
          <datalist id="gallery-sections">
            {sections.map((section) => <option key={section} value={section} />)}
          </datalist>

          <div>
            <label htmlFor="gallery-photo-upload" className="block text-sm font-medium text-stone-700 dark:text-brand-200">
              Photo{!editing || editing === 'new' ? <span className="ml-0.5 text-red-500">*</span> : null}
            </label>
            <input
              id="gallery-photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={uploadPhoto}
              disabled={isUploading}
              className="mt-1 block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700 disabled:opacity-60 dark:text-brand-200"
            />
            <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">JPEG, PNG, or WebP up to 5 MB.</p>
            {isUploading && <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">Uploading image…</p>}
            {uploadError && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
            {form.imageUrl && <img src={form.imageUrl} alt="Selected" className="mt-3 h-24 w-32 rounded-lg border border-stone-200 object-cover" />}
          </div>

          <Input label="Caption (optional)" placeholder="Short description shown with the photo" value={form.caption} onChange={set('caption')} />

          <div className="grid grid-cols-2 gap-4 items-end">
            <Input label="Position" type="number" min="0" hint="Lower shows first within its section." value={form.position} onChange={set('position')} />
            <label className="mb-2.5 flex items-center gap-2 text-sm text-stone-700 dark:text-brand-200">
              <input type="checkbox" className="h-4 w-4 rounded border-stone-200 text-brand-600" checked={form.isPublished} onChange={set('isPublished')} />
              Visible on the site
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.imageUrl || !form.section.trim() || isUploading} isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing === 'new' ? 'Add photo' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete photo"
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
          Delete this photo from <strong className="text-stone-900 dark:text-white">{deleting?.section}</strong>? This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
