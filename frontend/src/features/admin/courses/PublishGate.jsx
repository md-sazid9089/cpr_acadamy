import { useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { FaCheck, FaCircleExclamation, FaEye, FaEyeSlash, FaTriangleExclamation } from 'react-icons/fa6';
import { fetchAdminExams, fetchAdminSchedules, fetchAdminVideos, setCourseStatus } from '../api/admin.api.js';
import { adminCourseKey, adminExamsKey, adminScheduleKey, adminVideosKey } from './keys.js';
import Card, { CardBody, CardHeader } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { COURSE_STATUS } from '@/constants';
import { cn } from '@/lib/utils';

/**
 * What a course should have before it goes live. Each check names the tab
 * that fixes it so the admin does not have to hunt. These are advisory: the
 * admin can still publish with items missing, they are just told first.
 *
 * @returns {{ id: string, label: string, ok: boolean, tab: string }[]}
 */
export function publishChecks({ course, videos, exams, schedule }) {
  const publishedVideos = videos.filter((video) => video.status === 'published');
  const incompleteExams = exams.filter(
    (exam) => (exam.writtenCount ?? 0) < exam.questionCount || (exam.incompleteCount ?? 0) > 0,
  );

  return [
    { id: 'description', label: 'Description written', ok: Boolean(course.description?.trim()), tab: 'detail' },
    { id: 'outline', label: 'At least one outline item', ok: (course.highlights?.length ?? 0) > 0, tab: 'detail' },
    { id: 'fee', label: 'Regular fee set', ok: Number(course.price) > 0, tab: 'detail' },
    { id: 'startsOn', label: 'Start date set', ok: Boolean(course.startsOn), tab: 'detail' },
    {
      id: 'timing',
      label: 'Class time and days set',
      ok: Boolean(course.classTime?.start && course.classTime?.end && course.classDays?.length),
      tab: 'detail',
    },
    { id: 'videos', label: 'At least one published video', ok: publishedVideos.length > 0, tab: 'videos' },
    {
      id: 'exams',
      label: exams.length === 0 ? 'At least one exam' : 'Every exam has all its questions written',
      ok: exams.length > 0 && incompleteExams.length === 0,
      tab: 'exams',
    },
    { id: 'schedule', label: 'At least one routine row', ok: schedule.length > 0, tab: 'schedule' },
  ];
}

/** Videos, exams and routine for one course — the same cache the tabs use. */
function usePublishData(courseId) {
  const [videosQuery, examsQuery, scheduleQuery] = useQueries({
    queries: [
      { queryKey: adminVideosKey(courseId), queryFn: () => fetchAdminVideos({ courseId }) },
      { queryKey: adminExamsKey(courseId), queryFn: () => fetchAdminExams({ courseId }) },
      { queryKey: adminScheduleKey(courseId), queryFn: () => fetchAdminSchedules({ courseId }) },
    ],
  });
  return {
    videos: videosQuery.data ?? [],
    exams: examsQuery.data ?? [],
    schedule: scheduleQuery.data ?? [],
    isLoading: videosQuery.isLoading || examsQuery.isLoading || scheduleQuery.isLoading,
  };
}

function useStatusMutation(course, onDone) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status) => setCourseStatus({ id: course.id, status }),
    onSuccess: (saved) => {
      queryClient.setQueryData(adminCourseKey(course.id), saved);
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      onDone?.();
    },
  });
}

function Checklist({ checks, courseId, onNavigate }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {checks.map((check) => (
        <li key={check.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            {check.ok ? (
              <FaCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <FaCircleExclamation aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <span className={cn(check.ok ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white')}>
              {check.label}
            </span>
          </span>
          {!check.ok && (
            <Button to={`/admin/courses/${courseId}/${check.tab}`} size="sm" variant="ghost" onClick={onNavigate}>
              Fix
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Publish / Unpublish button for the course header, so it is reachable from
 * every tab. A draft stays a draft until the admin clicks Publish; the
 * confirmation shows the checklist and lets them publish anyway if something
 * is still missing.
 */
export function PublishControl({ course }) {
  const [open, setOpen] = useState(false);
  const { videos, exams, schedule, isLoading } = usePublishData(course.id);
  const mutation = useStatusMutation(course, () => setOpen(false));

  const isPublished = course.status === COURSE_STATUS.PUBLISHED;
  const checks = publishChecks({ course, videos, exams, schedule });
  const failing = checks.filter((check) => !check.ok);

  if (isPublished) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <FaEyeSlash aria-hidden="true" className="h-3.5 w-3.5" />
          Unpublish
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Unpublish this course?"
          description="It disappears from the public site and students can no longer enrol until you publish it again."
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Keep published
              </Button>
              <Button variant="danger" isLoading={mutation.isPending} onClick={() => mutation.mutate(COURSE_STATUS.DRAFT)}>
                Unpublish
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Existing enrolments are not affected. The course goes back to draft.
          </p>
        </Modal>
      </>
    );
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <FaEye aria-hidden="true" className="h-3.5 w-3.5" />
        Publish
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Publish this course?"
        description="Publishing makes it visible on the public site and open for enrolment."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep as draft
            </Button>
            <Button
              variant={failing.length > 0 ? 'accent' : 'primary'}
              isLoading={mutation.isPending}
              disabled={isLoading}
              onClick={() => mutation.mutate(COURSE_STATUS.PUBLISHED)}
            >
              <FaEye aria-hidden="true" className="h-3.5 w-3.5" />
              {failing.length > 0 ? 'Publish anyway' : 'Publish course'}
            </Button>
          </>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner label="Checking the course…" />
          </div>
        ) : (
          <div className="space-y-4">
            {failing.length > 0 ? (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                <FaTriangleExclamation aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {failing.length} {failing.length === 1 ? 'item is' : 'items are'} still missing. You can publish anyway
                  — students will see the course as it is now — or finish them first.
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                <FaCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
                Everything is in place.
              </p>
            )}
            <Checklist checks={checks} courseId={course.id} onNavigate={() => setOpen(false)} />
          </div>
        )}
      </Modal>
    </>
  );
}

/** Checklist card shown on the Schedule tab, the last step of building a course. */
export default function PublishGate({ course, videos, exams, schedule }) {
  const checks = publishChecks({ course, videos, exams, schedule });
  const failing = checks.filter((check) => !check.ok);
  const isPublished = course.status === COURSE_STATUS.PUBLISHED;

  return (
    <Card>
      <CardHeader
        title={isPublished ? 'Published' : 'Ready to publish?'}
        description={
          isPublished
            ? 'Students can see and enrol in this course. Unpublish to hide it while you make changes.'
            : failing.length === 0
              ? 'Everything is in place. The course stays a draft until you publish it.'
              : `${failing.length} ${failing.length === 1 ? 'item' : 'items'} still to finish — you can publish anyway.`
        }
        action={<PublishControl course={course} />}
      />
      <CardBody>
        <Checklist checks={checks} courseId={course.id} />
      </CardBody>
    </Card>
  );
}
