import apiClient from '@/lib/api-client';

/**
 * Course Hub data layer — the enrolled student's view of one course. Every
 * endpoint requires an active enrolment (admins bypass the check).
 */

/** Video lessons released so far, grouped by chapter. */
export async function fetchCourseVideos(slug) {
  const { data } = await apiClient.get(`/courses/${encodeURIComponent(slug)}/videos`);
  return data;
}

/** `{ sba, mcq }` — published exams of the course split by question type. */
export async function fetchCourseExams(slug) {
  const { data } = await apiClient.get(`/courses/${encodeURIComponent(slug)}/exams`);
  return data;
}

/** Routine rows; `dateTime` is the two-line label the table prints. */
export async function fetchCourseSchedule(slug) {
  const { data } = await apiClient.get(`/courses/${encodeURIComponent(slug)}/schedule`);
  return data;
}

/** Records that the signed-in student finished a lesson (idempotent). */
export async function markLessonComplete(lessonId) {
  const { data } = await apiClient.post(`/lessons/${lessonId}/complete`);
  return data;
}

/**
 * A short-lived signed link for a lesson's video or notes file. The backend never hands
 * out the permanent source URL for directly-hosted content — enrollment is re-checked on
 * every call, and the link itself expires, so it can't outlive access to the course.
 */
export async function fetchLessonContentUrl(lessonId, kind) {
  const { data } = await apiClient.get(`/lessons/${lessonId}/content-url`, { params: { kind } });
  return data;
}
