import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaFileLines, FaLink, FaPenToSquare, FaPlus, FaTrash } from 'react-icons/fa6';
import { createVideo, deleteVideo, fetchAdminVideos, updateVideo } from '../api/admin.api.js';
import { adminVideosKey } from './keys.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { cn, formatDate } from '@/lib/utils';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
];

const EMPTY_FORM = {
  title: '',
  scheduledDate: '',
  scheduledTime: '02:30 PM',
  duration: '1h 00m',
  status: 'published',
  videoUrl: '',
  notesUrl: '',
};

/** Lecture list for one course. Rows are grouped by the date they are scheduled for. */
export default function CourseVideosTab() {
  const { course } = useOutletContext();
  const [filter, setFilter] = useState('ALL');
  const [editing, setEditing] = useState(null); // null | 'new' | video
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: adminVideosKey(course.id),
    queryFn: () => fetchAdminVideos({ courseId: course.id }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: adminVideosKey(course.id) });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const createMutation = useMutation({ mutationFn: createVideo, onSuccess: () => { invalidate(); closeModal(); } });
  const updateMutation = useMutation({ mutationFn: updateVideo, onSuccess: () => { invalidate(); closeModal(); } });
  const deleteMutation = useMutation({ mutationFn: deleteVideo, onSuccess: () => { invalidate(); setDeleting(null); } });

  const groups = useMemo(() => {
    const visible = filter === 'ALL' ? videos : videos.filter((video) => video.status === filter);
    const byDate = new Map();
    for (const video of visible) {
      const list = byDate.get(video.scheduledDate) ?? [];
      list.push(video);
      byDate.set(video.scheduledDate, list);
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [videos, filter]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, scheduledDate: new Date().toISOString().slice(0, 10) });
    setEditing('new');
  };

  const openEdit = (video) => {
    setForm({
      title: video.title,
      scheduledDate: video.scheduledDate,
      scheduledTime: video.scheduledTime,
      duration: video.duration,
      status: video.status,
      videoUrl: video.videoUrl ?? '',
      notesUrl: video.notesUrl ?? '',
    });
    setEditing(video);
  };

  const closeModal = () => setEditing(null);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      title: form.title.trim(),
      videoUrl: form.videoUrl.trim(),
      notesUrl: form.notesUrl.trim(),
      courseId: course.id,
    };
    if (editing === 'new') createMutation.mutate(payload);
    else updateMutation.mutate({ id: editing.id, ...payload });
  };

  const saveError = createMutation.error ?? updateMutation.error;

  return (
    <>
      <Card>
        <CardHeader
          title="Videos"
          description="Recorded and live-class lectures for this course, in the order students will see them."
          action={
            <Button size="sm" onClick={openCreate}>
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Add video
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

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Loading videos…" />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            title="No videos yet"
            description="Add the first lecture. Students see it on the course hub and in the routine."
            action={
              <Button size="sm" onClick={openCreate}>
                <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
                Add video
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {groups.map(([date, list]) => (
              <section key={date} className="px-5 py-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {/* Local-time suffix so a bare date does not shift a day west of UTC. */}
                  {formatDate(`${date}T00:00:00`, { weekday: 'long' })}
                  <span className="ml-2 font-normal normal-case tracking-normal">
                    · {list.length} {list.length === 1 ? 'lecture' : 'lectures'}
                  </span>
                </h4>

                <ul className="mt-3 space-y-2">
                  {list.map((video) => (
                    <li
                      key={video.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{video.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>{video.scheduledTime}</span>
                          <span>{video.duration}</span>
                          {video.videoUrl ? (
                            <a
                              href={video.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-400"
                            >
                              <FaLink aria-hidden="true" className="h-3 w-3" />
                              Video
                            </a>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400">No video source</span>
                          )}
                          {video.notesUrl && (
                            <a
                              href={video.notesUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-400"
                            >
                              <FaFileLines aria-hidden="true" className="h-3 w-3" />
                              Lecture notes
                            </a>
                          )}
                        </p>
                      </div>

                      <Badge tone={video.status === 'published' ? 'success' : 'neutral'}>
                        {video.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>

                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(video)} aria-label={`Edit ${video.title}`}>
                          <FaPenToSquare aria-hidden="true" className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(video)} aria-label={`Delete ${video.title}`}>
                          <FaTrash aria-hidden="true" className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={closeModal}
        title={editing === 'new' ? 'Add video' : 'Edit video'}
        description={course.title}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {saveError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {saveError.message}
            </p>
          )}
          <Input
            label="Title"
            required
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. Renal System Live class"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Scheduled date" type="date" required value={form.scheduledDate} onChange={set('scheduledDate')} />
            <Input label="Scheduled time" required value={form.scheduledTime} onChange={set('scheduledTime')} placeholder="e.g. 02:30 PM" hint="Bangladesh time." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration" required value={form.duration} onChange={set('duration')} placeholder="e.g. 1h 20m" />
            <Select label="Status" value={form.status} onChange={set('status')}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </div>

          {/* TODO: add a file input beside these once a storage target is chosen
              (Vimeo, Bunny, Cloudinary or S3). Both stay URL strings on the model. */}
          <Input
            label="Video URL"
            type="url"
            value={form.videoUrl}
            onChange={set('videoUrl')}
            placeholder="https://vimeo.com/…"
            hint="Paste the hosted video link (HTTPS). Required before a lecture can be published."
          />
          <Input
            label="Lecture notes URL"
            type="url"
            value={form.notesUrl}
            onChange={set('notesUrl')}
            placeholder="https://…/notes.pdf"
            hint="Optional. Shown as a download beside the lecture."
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing === 'new' ? 'Add video' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete video"
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
          Delete <strong className="text-slate-900 dark:text-white">{deleting?.title}</strong>? Any routine row that
          points at it will show “No class” until you pick another lecture.
        </p>
      </Modal>
    </>
  );
}
