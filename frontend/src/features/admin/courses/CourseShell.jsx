import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FaArrowLeftLong,
  FaArrowUpRightFromSquare,
  FaCalendarDays,
  FaCircleInfo,
  FaClipboardList,
  FaPlay,
  FaTrophy,
} from 'react-icons/fa6';
import { fetchAdminCourse } from '../api/admin.api.js';
import { adminCourseKey } from './keys.js';
import { PublishControl } from './PublishGate.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { CATEGORY_SLUGS, COURSE_STATUS } from '@/constants';
import { batchGroupLabel } from './catalogOptions.js';
import { cn } from '@/lib/utils';

const TABS = [
  { to: 'detail', label: 'Detail', icon: FaCircleInfo },
  { to: 'videos', label: 'Videos', icon: FaPlay },
  { to: 'exams', label: 'Exams', icon: FaClipboardList },
  { to: 'schedule', label: 'Schedule', icon: FaCalendarDays },
  { to: 'leaderboard', label: 'Leaderboard', icon: FaTrophy },
];

/**
 * Wraps every /admin/courses/:id/* route. Loads the course once, shows its
 * header and tabs, and hands the course to the active tab via outlet context
 * — so no tab ever asks "which course?".
 */
export default function CourseShell() {
  const { id } = useParams();

  const { data: course, isLoading, isError } = useQuery({
    queryKey: adminCourseKey(id),
    queryFn: () => fetchAdminCourse(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <ContentSkeleton variant="form" label="Loading course" />
    );
  }

  if (isError || !course) {
    return (
      <EmptyState
        className="min-h-screen"
        title="Course not found"
        description="It may have been deleted, or the link is out of date."
        action={<Button to="/admin/courses">Back to courses</Button>}
      />
    );
  }

  const group = course.batchGroup ? { label: batchGroupLabel(course.batchGroup) } : null;
  const publicUrl = `/courses/${CATEGORY_SLUGS[course.category] ?? 'fcps'}/${course.slug}`;

  return (
    <div className="space-y-5">
      <Link
        to="/admin/courses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-600 dark:text-brand-200 dark:hover:text-brand-400"
      >
        <FaArrowLeftLong aria-hidden="true" className="h-3 w-3" />
        All courses
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{course.category}</Badge>
            {group && <Badge tone="neutral">{group.label}</Badge>}
            <StatusBadge status={course.status} />
          </div>
          <h2 className="mt-2 text-xl font-bold text-stone-900 dark:text-white sm:text-2xl">{course.title}</h2>
          {course.subtitle && (
            <p className="mt-1 text-sm text-stone-500 dark:text-brand-200">{course.subtitle}</p>
          )}
          {course.status !== COURSE_STATUS.PUBLISHED && (
            <p className="mt-1 text-sm text-brand-700 dark:text-brand-400">
              Draft — not on the public site yet. Publish when you are ready.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {course.status === COURSE_STATUS.PUBLISHED && (
            <Button variant="outline" size="sm" href={publicUrl} target="_blank" rel="noreferrer">
              View public page
              <FaArrowUpRightFromSquare aria-hidden="true" className="h-3 w-3" />
            </Button>
          )}
          <PublishControl course={course} />
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1.5 border border-stone-200 dark:bg-surface-dark-subtle"
        aria-label="Course sections"
      >
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-brand-600 text-white border border-stone-200'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-brand-200 dark:hover:bg-surface-dark',
              )
            }
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ course }} />
    </div>
  );
}
