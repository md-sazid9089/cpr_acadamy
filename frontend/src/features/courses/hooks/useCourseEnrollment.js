import { useMemo } from 'react';
import { useMyCourses } from '@/features/student-dashboard/api/dashboard.queries.js';
import { useAuthStore } from '@/lib/auth';
import { ACCOUNT_STATUS, ROLES } from '@/constants';

export function activeCourseIds(enrollments = []) {
  return new Set(enrollments.filter((course) => course.status === 'active').map((course) => course.courseId));
}

export function useCourseEnrollment() {
  const enabled = useAuthStore((s) => Boolean(s.accessToken && s.user?.role === ROLES.STUDENT && s.user.status === ACCOUNT_STATUS.ACTIVE));
  const { data, isError, refetch } = useMyCourses({ enabled });
  const activeIds = useMemo(() => activeCourseIds(enabled ? data : []), [data, enabled]);
  return { activeIds, checking: enabled && !data && !isError, retry: enabled && !data && isError ? refetch : null };
}
