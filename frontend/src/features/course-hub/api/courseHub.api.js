import apiClient from '@/lib/api-client';

/**
 * Course Hub data layer — the enrolled student's view of one course. Every
 * endpoint requires an active enrolment (admins bypass the check).
 */

/** Video lessons released so far, grouped by release date and time. */
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
