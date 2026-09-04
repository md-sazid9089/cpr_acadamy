import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  fetchCourseOptions,
} from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { cn } from '@/lib/utils';
import { FaPlus, FaTrash, FaPenToSquare } from 'react-icons/fa6';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
];

export default function AdminVideos() {
  const [filter, setFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [deletingVideo, setDeletingVideo] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: '',
    status: 'published',
  });

  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['admin', 'videos', filter],
    queryFn: () => fetchAdminVideos({ status: filter }),
  });

  const { data: courseOptions = [] } = useQuery({
    queryKey: ['admin', 'courseOptions'],
    queryFn: fetchCourseOptions,
  });

  const createMutation = useMutation({
    mutationFn: createVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'videos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'videos'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'videos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setDeletingVideo(null);
    },
  });

  const openCreateModal = () => {
    setEditingVideo(null);
    setFormData({
      title: '',
      courseId: courseOptions[0]?.id || 'c-1',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '02:30 PM',
      duration: '1h 00m',
      status: 'published',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      courseId: video.courseId,
      scheduledDate: video.scheduledDate,
      scheduledTime: video.scheduledTime,
      duration: video.duration,
      status: video.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const course = courseOptions.find((c) => c.id === formData.courseId);
    const payload = {
      ...formData,
      courseName: course?.title || 'Unknown Course',
    };

    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Lesson / Title',
      render: (row) => (
        <div className="max-w-md">
          <p className="font-medium text-slate-900 line-clamp-1 dark:text-white">{row.title}</p>
          <p className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400">{row.courseName}</p>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Scheduled Date & Time',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.scheduledDate} · {row.scheduledTime}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">{row.duration}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'published' ? 'success' : 'neutral'}>
          {row.status === 'published' ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEditModal(row)} aria-label="Edit video">
            <FaPenToSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
            onClick={() => setDeletingVideo(row)}
            aria-label="Delete video"
          >
            <FaTrash className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader
          title="Videos Management"
          description="Manage recorded video lectures shown in the At a Glance course section."
          action={
            <Button size="sm" onClick={openCreateModal}>
              <FaPlus className="h-3.5 w-3.5" />
              Add Video
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

        <div className="mt-4">
          <Table
            columns={columns}
            rows={videos}
            isLoading={isLoading}
            emptyTitle="No videos found"
            emptyDescription="Add video lessons to show on student Course Hub pages."
          />
        </div>
      </Card>

      {/* Add / Edit Video Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingVideo ? 'Edit Video Lesson' : 'Add New Video Lesson'}
        description="Set video details and assign it to a course batch schedule."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Video Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. FCPS Mid-Term Surgery Lecture: Upper GIT"
          />

          <Select
            label="Course / Batch"
            required
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
          >
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Scheduled Date"
              type="date"
              required
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            />
            <Input
              label="Scheduled Time"
              required
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              placeholder="e.g. 02:30 PM"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration"
              required
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g. 1h 20m"
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingVideo ? 'Update Video' : 'Save Video'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingVideo)}
        onClose={() => setDeletingVideo(null)}
        title="Delete Video"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingVideo(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingVideo.id)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingVideo?.title}</strong>?
          This will remove it from the student Course Hub At a Glance view.
        </p>
      </Modal>
    </>
  );
}
