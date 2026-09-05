import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCheck, FaCircleExclamation, FaEye, FaEyeSlash } from 'react-icons/fa6';
import { setCourseStatus } from '../api/admin.api.js';
import { adminCourseKey } from './CourseShell.jsx';
import { isQuestionComplete } from './QuestionCard.jsx';
import Card, { CardBody, CardHeader } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import { COURSE_STATUS } from '@/constants';
import { cn } from '@/lib/utils';

/**
 * What a course needs before it can go live. Each check names the tab that
 * fixes it so the admin does not have to hunt.
 *
 * @returns {{ id: string, label: string, ok: boolean, tab: string }[]}
 */
export function publishChecks({ course, videos, exams, schedule }) {
  const publishedVideos = videos.filter((video) => video.status === 'published');
  const incompleteExams = exams.filter(
    (exam) => exam.questions.length < exam.questionCount || exam.questions.some((q) => !isQuestionComplete(q)),
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

/** Publish / unpublish panel with the checklist that gates it. */
export default function PublishGate({ videos, exams, schedule }) {
  const { course } = useOutletContext();
  const queryClient = useQueryClient();

  const checks = publishChecks({ course, videos, exams, schedule });
  const failing = checks.filter((check) => !check.ok);
  const isPublished = course.status === COURSE_STATUS.PUBLISHED;

  const mutation = useMutation({
    mutationFn: setCourseStatus,
    onSuccess: (saved) => {
      queryClient.setQueryData(adminCourseKey(course.id), saved);
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return (
    <Card>
      <CardHeader
        title={isPublished ? 'Published' : 'Ready to publish?'}
        description={
          isPublished
            ? 'Students can see and enrol in this course. Unpublish to hide it while you make changes.'
            : failing.length === 0
              ? 'Everything is in place. Publishing makes the course visible on the public site.'
              : `${failing.length} ${failing.length === 1 ? 'item' : 'items'} to finish first.`
        }
        action={
          isPublished ? (
            <Button
              size="sm"
              variant="outline"
              isLoading={mutation.isPending}
              onClick={() => mutation.mutate({ id: course.id, status: COURSE_STATUS.DRAFT })}
            >
              <FaEyeSlash aria-hidden="true" className="h-3.5 w-3.5" />
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={failing.length > 0}
              isLoading={mutation.isPending}
              onClick={() => mutation.mutate({ id: course.id, status: COURSE_STATUS.PUBLISHED })}
            >
              <FaEye aria-hidden="true" className="h-3.5 w-3.5" />
              Publish course
            </Button>
          )
        }
      />
      <CardBody>
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
                <Button to={`/admin/courses/${course.id}/${check.tab}`} size="sm" variant="ghost">
                  Fix
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
