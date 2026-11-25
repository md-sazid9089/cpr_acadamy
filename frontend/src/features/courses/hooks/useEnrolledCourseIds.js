import { useMemo } from 'react';
import { useMyCourses } from '@/features/student-dashboard/api/dashboard.queries.js';
import { useAuthStore } from '@/lib/auth';

/**
 * Course ids the signed-in student holds an active enrolment for, as a `Set` for O(1) lookups.
 * Empty for visitors and signed-out students, so public cards simply never show "Enrolled".
 */
export function useEnrolledCourseIds() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken && s.user));
  const { data } = useMyCourses();
  return useMemo(() => new Set((isAuthenticated ? data ?? [] : []).map((course) => course.courseId)), [data, isAuthenticated]);
}
