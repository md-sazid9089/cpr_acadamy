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

/** Published exams of the course, latest scheduled first. */
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

/**
 * Opens a lesson's lecture PDF in a new tab. The tab is opened before the
 * signed link is fetched, inside the click itself, so pop-up blockers allow it.
 */
export async function openLectureNotes(lessonId) {
  const tab = window.open('', '_blank');
  try {
    const { url } = await fetchLessonContentUrl(lessonId, 'notes');
    if (!tab) {
      window.location.assign(url);
      return;
    }
    tab.opener = null;
    tab.location.replace(url);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

/** The signed-in student's personal note for a lesson. `{ content, updatedAt }`. */
export async function fetchLessonNote(lessonId) {
  const { data } = await apiClient.get(`/lessons/${lessonId}/notes`);
  return data;
}

/** Saves (creates or overwrites) the signed-in student's note for a lesson. */
export async function saveLessonNote(lessonId, content) {
  const { data } = await apiClient.put(`/lessons/${lessonId}/notes`, { content });
  return data;
}
