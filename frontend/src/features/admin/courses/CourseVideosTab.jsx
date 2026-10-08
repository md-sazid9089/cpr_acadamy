import { useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaFileLines, FaLink, FaPenToSquare, FaPlus, FaTrash } from 'react-icons/fa6';
import {
  createChapter,
  createVideo,
  deleteChapter,
  deleteVideo,
  fetchAdminChapters,
  fetchAdminVideos,
  updateChapter,
  updateVideo,
  uploadPdf,
} from '../api/admin.api.js';
import { openLectureNotes } from '@/features/course-hub/api/courseHub.api.js';
import { adminChaptersKey, adminVideosKey } from './keys.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { cn, formatDate } from '@/lib/utils';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
];

const UNCATEGORIZED = 'uncategorized';

const EMPTY_FORM = {
  title: '',
  scheduledDate: '',
  scheduledTime: '02:30 PM',
  duration: '1h 00m',
  status: 'published',
  videoUrl: '',
  notesUrl: '',
  chapterId: '',
};

/** Uploaded PDFs live on Cloudinary or this server; anything else is a pasted link such as Google Drive. */
const isUploadedNotes = (url) => /^\/api\/media\/[0-9a-f-]{36}\.pdf$/.test(url) || /^https:\/\/res\.cloudinary\.com\//.test(url);

const NOTES_MODES = [
  { id: 'upload', label: 'Upload PDF' },
  { id: 'drive', label: 'Google Drive link' },
];

/** Lecture list for one course, organized by chapter (e.g. "Basic Airway", "Advanced Airway"). */
export default function CourseVideosTab() {
  const { course } = useOutletContext();
  const [filter, setFilter] = useState('ALL');
  const [editing, setEditing] = useState(null); // null | 'new' | video
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [chapterEditing, setChapterEditing] = useState(null); // null | 'new' | chapter
  const [chapterTitle, setChapterTitle] = useState('');
  const [deletingChapter, setDeletingChapter] = useState(null);
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: adminVideosKey(course.id),
    queryFn: () => fetchAdminVideos({ courseId: course.id }),
  });
  const { data: chapters = [] } = useQuery({
    queryKey: adminChaptersKey(course.id),
    queryFn: () => fetchAdminChapters(course.id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: adminVideosKey(course.id) });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };
  const invalidateChapters = () => {
    queryClient.invalidateQueries({ queryKey: adminChaptersKey(course.id) });
    invalidate(); // video rows carry a denormalized chapter title
  };

  const createMutation = useMutation({ mutationFn: createVideo, onSuccess: () => { invalidate(); closeModal(); } });
  const updateMutation = useMutation({ mutationFn: updateVideo, onSuccess: () => { invalidate(); closeModal(); } });
  const deleteMutation = useMutation({ mutationFn: deleteVideo, onSuccess: () => { invalidate(); setDeleting(null); } });

  const createChapterMutation = useMutation({ mutationFn: createChapter, onSuccess: () => { invalidateChapters(); closeChapterModal(); } });
  const updateChapterMutation = useMutation({ mutationFn: updateChapter, onSuccess: () => { invalidateChapters(); closeChapterModal(); } });
  const deleteChapterMutation = useMutation({ mutationFn: deleteChapter, onSuccess: () => { invalidateChapters(); setDeletingChapter(null); } });

  const groups = useMemo(() => {
    const visible = filter === 'ALL' ? videos : videos.filter((video) => video.status === filter);
    const byChapter = new Map();
    for (const chapter of chapters) byChapter.set(chapter.id, { id: chapter.id, title: chapter.title, videos: [] });
    byChapter.set(UNCATEGORIZED, { id: UNCATEGORIZED, title: 'Uncategorized', videos: [] });
    for (const video of visible) {
      const key = video.chapterId && byChapter.has(video.chapterId) ? video.chapterId : UNCATEGORIZED;
      byChapter.get(key).videos.push(video);
    }
    return [...byChapter.values()].filter((group) => group.id !== UNCATEGORIZED || group.videos.length > 0);
  }, [videos, filter, chapters]);

  // Bumped whenever the form opens or closes, so an upload that finishes afterwards cannot
  // attach its PDF to whichever lecture happens to be open by then.
  const formSession = useRef(0);
  const openCreate = () => {
    formSession.current += 1;
    setPdfUploading(false);
    setForm({ ...EMPTY_FORM, scheduledDate: new Date().toISOString().slice(0, 10) });
    setNotesMode('upload');
    setPdfError('');
    setEditing('new');
  };

  const openEdit = (video) => {
    formSession.current += 1;
    setPdfUploading(false);
    setForm({
      title: video.title,
      scheduledDate: video.scheduledDate,
      scheduledTime: video.scheduledTime,
      duration: video.duration,
      status: video.status,
      videoUrl: video.videoUrl ?? '',
      notesUrl: video.notesUrl ?? '',
      chapterId: video.chapterId ?? '',
    });
    setNotesMode(video.notesUrl && !isUploadedNotes(video.notesUrl) ? 'drive' : 'upload');
    setPdfError('');
    setEditing(video);
  };

  const closeModal = () => {
    formSession.current += 1;
    setPdfUploading(false);
    setEditing(null);
  };

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const [notesMode, setNotesMode] = useState('upload');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const uploadNotes = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const session = formSession.current;
    setPdfError('');
    setPdfUploading(true);
    try {
      const notesUrl = await uploadPdf(file);
      if (session === formSession.current) setForm((prev) => ({ ...prev, notesUrl }));
    } catch (error) {
      if (session === formSession.current) setPdfError(error.message);
    } finally {
      if (session === formSession.current) setPdfUploading(false);
    }
  };
  const [notesOpenError, setNotesOpenError] = useState('');
  const viewNotes = (lessonId) => {
    setNotesOpenError('');
    openLectureNotes(lessonId)
      .then(({ opened }) => { if (!opened) setNotesOpenError('Your browser blocked the new tab. Allow pop-ups for this site, then try again.'); })
      .catch((error) => setNotesOpenError(error.message));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      title: form.title.trim(),
      videoUrl: form.videoUrl.trim(),
      notesUrl: form.notesUrl.trim(),
      chapterId: form.chapterId || null,
      courseId: course.id,
    };
    if (editing === 'new') createMutation.mutate(payload);
    else updateMutation.mutate({ id: editing.id, ...payload });
  };

  const saveError = createMutation.error ?? updateMutation.error;

  const openCreateChapter = () => {
    setChapterTitle('');
    setChapterEditing('new');
  };
  const openEditChapter = (chapter) => {
    setChapterTitle(chapter.title);
    setChapterEditing(chapter);
  };
  const closeChapterModal = () => setChapterEditing(null);
  const handleChapterSubmit = (event) => {
    event.preventDefault();
    const title = chapterTitle.trim();
    if (!title) return;
    if (chapterEditing === 'new') createChapterMutation.mutate({ courseId: course.id, title });
    else updateChapterMutation.mutate({ id: chapterEditing.id, title });
  };
  const chapterSaveError = createChapterMutation.error ?? updateChapterMutation.error;

  return (
    <>
      <Card>
        <CardHeader
          title="Videos"
          description="Recorded and live-class lectures for this course, organized by chapter."
          action={
            <Button size="sm" onClick={openCreate}>
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Add video
            </Button>
          }
        />

        <div className="border-b border-stone-200 px-5 py-4 dark:border-stone-200">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-stone-900 dark:text-white">Chapters</h4>
            <Button size="sm" variant="outline" onClick={openCreateChapter}>
              <FaPlus aria-hidden="true" className="h-3 w-3" />
              Add chapter
            </Button>
          </div>
          <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">
            Group lectures by topic, e.g. “Basic Airway”, “Advanced Airway”. Videos without a chapter show under Uncategorized.
          </p>
          {chapters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chapters.map((chapter) => (
                <span
                  key={chapter.id}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-100 py-1.5 pl-3 pr-2 text-xs font-medium text-stone-700 dark:bg-surface-dark dark:text-brand-200"
                >
                  {chapter.title}
                  <span className="text-stone-400">· {chapter.videoCount}</span>
                  <button
                    type="button"
                    onClick={() => openEditChapter(chapter)}
                    aria-label={`Edit ${chapter.title}`}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-white"
                  >
                    <FaPenToSquare aria-hidden="true" className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingChapter(chapter)}
                    aria-label={`Delete ${chapter.title}`}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash aria-hidden="true" className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

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
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {notesOpenError && (
          <p role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {notesOpenError}
          </p>
        )}

        {isLoading ? (
          <ContentSkeleton label="Loading videos" />
        ) : isError ? (
          <EmptyState
            variant="error"
            title="Couldn't load videos"
            description={error?.message || 'Something went wrong. Please try again.'}
            onRetry={refetch}
            isFetching={isFetching}
          />
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
          <div className="divide-y divide-stone-200 dark:divide-stone-200">
            {groups.map((group) => (
              <section key={group.id} className="px-5 py-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-brand-200">
                  {group.title}
                  <span className="ml-2 font-normal normal-case tracking-normal">
                    · {group.videos.length} {group.videos.length === 1 ? 'lecture' : 'lectures'}
                  </span>
                </h4>

                {group.videos.length === 0 ? (
                  <p className="mt-3 text-xs text-stone-400">No videos in this chapter yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {group.videos.map((video) => (
                      <li
                        key={video.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-200"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-stone-900 dark:text-white">{video.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-brand-200">
                            <span>{formatDate(`${video.scheduledDate}T00:00:00`, { day: '2-digit', month: 'short' })} · {video.scheduledTime}</span>
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
                              <span className="text-brand-700 dark:text-brand-400">No video source</span>
                            )}
                            {video.notesUrl && (
                              <button
                                type="button"
                                onClick={() => viewNotes(video.id)}
                                className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-400"
                              >
                                <FaFileLines aria-hidden="true" className="h-3 w-3" />
                                Lecture notes
                              </button>
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
                )}
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

          <Select label="Chapter" value={form.chapterId} onChange={set('chapterId')}>
            <option value="">No chapter (Uncategorized)</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
            ))}
          </Select>

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

          {/* Videos are hosted elsewhere (e.g. an unlisted YouTube link) and only the URL is stored here. See VideoPlayer/YouTubePlayer for the playback-side protections. */}
          <Input
            label="Video URL"
            type="url"
            value={form.videoUrl}
            onChange={set('videoUrl')}
            placeholder="https://youtu.be/… (unlisted) or an HTTPS video link"
            hint="Paste the hosted video link (HTTPS). Required before a lecture can be published."
          />
          <fieldset>
            <legend className="text-sm font-medium text-stone-700 dark:text-brand-200">Lecture notes (PDF)</legend>
            <div role="radiogroup" aria-label="How to add lecture notes" className="mt-1 inline-flex rounded-lg bg-stone-100 p-1 dark:bg-surface-dark">
              {NOTES_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="radio"
                  aria-checked={notesMode === mode.id}
                  onClick={() => {
                    if (mode.id === notesMode) return;
                    // Switching source drops the other kind of link so the two never mix.
                    setNotesMode(mode.id);
                    setPdfError('');
                    setForm((prev) => ({ ...prev, notesUrl: '' }));
                  }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    notesMode === mode.id ? 'border border-stone-200 bg-white text-brand-700 dark:bg-surface-dark-subtle dark:text-white' : 'text-stone-600 hover:text-stone-900 dark:text-brand-200',
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {notesMode === 'upload' ? (
              <div className="mt-3">
                {form.notesUrl && (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-surface-subtle px-3 py-2 text-sm dark:bg-surface-dark">
                    <FaFileLines aria-hidden="true" className="h-4 w-4 text-red-600" />
                    <span className="text-stone-700 dark:text-brand-200">PDF attached</span>
                    <label htmlFor="lecture-notes-upload" className="cursor-pointer font-medium text-brand-600 hover:underline dark:text-brand-400">
                      Replace
                    </label>
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, notesUrl: '' }))} className="font-medium text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                )}
                <input
                  id="lecture-notes-upload"
                  type="file"
                  accept="application/pdf,.pdf"
                  aria-label="Upload lecture notes PDF"
                  onChange={uploadNotes}
                  disabled={pdfUploading}
                  className={cn(
                    'block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700 disabled:opacity-60 dark:text-brand-200',
                    form.notesUrl && 'sr-only',
                  )}
                />
                {pdfUploading && <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">Uploading PDF…</p>}
                {pdfError && <p role="alert" className="mt-1 text-xs text-red-600">{pdfError}</p>}
                <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">
                  Optional. Up to 10 MB. Students open it with "View PDF" beside the lecture.
                </p>
              </div>
            ) : (
              <Input
                containerClassName="mt-3"
                aria-label="Google Drive link"
                type="url"
                value={form.notesUrl}
                onChange={set('notesUrl')}
                placeholder="https://drive.google.com/file/d/…/view?usp=sharing"
                hint={'Optional. Link to one PDF file (not a folder), shared as "Anyone with the link". "View PDF" opens it in Google Drive.'}
              />
            )}
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={pdfUploading} title={pdfUploading ? 'Wait for the PDF to finish uploading' : undefined} isLoading={createMutation.isPending || updateMutation.isPending}>
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
        <p className="text-sm text-stone-600 dark:text-brand-200">
          Delete <strong className="text-stone-900 dark:text-white">{deleting?.title}</strong>? Any routine row that
          points at it will show “No class” until you pick another lecture.
        </p>
      </Modal>

      <Modal
        open={chapterEditing !== null}
        onClose={closeChapterModal}
        title={chapterEditing === 'new' ? 'Add chapter' : 'Edit chapter'}
        description={course.title}
      >
        <form onSubmit={handleChapterSubmit} className="space-y-4">
          {chapterSaveError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {chapterSaveError.message}
            </p>
          )}
          <Input
            label="Chapter title"
            required
            autoFocus
            value={chapterTitle}
            onChange={(event) => setChapterTitle(event.target.value)}
            placeholder="e.g. Basic Airway Management"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeChapterModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createChapterMutation.isPending || updateChapterMutation.isPending}>
              {chapterEditing === 'new' ? 'Add chapter' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deletingChapter)}
        onClose={() => setDeletingChapter(null)}
        title="Delete chapter"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingChapter(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteChapterMutation.isPending}
              onClick={() => deleteChapterMutation.mutate(deletingChapter.id)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600 dark:text-brand-200">
          Delete <strong className="text-stone-900 dark:text-white">{deletingChapter?.title}</strong>? Its videos are
          kept and move to Uncategorized.
        </p>
      </Modal>
    </>
  );
}
