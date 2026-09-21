import apiClient from '@/lib/api-client';

/** Student dashboard data — everything under /me plus the notice feed. */

export async function fetchMyCourses() {
  const { data } = await apiClient.get('/me/enrollments');
  return data;
}

export async function fetchProgressSummary() {
  const { data } = await apiClient.get('/me/progress');
  return data;
}

/** Every exam the student can see; the page groups them by status. */
export async function fetchUpcomingExams() {
  const { data } = await apiClient.get('/me/exams', { params: { limit: 100 } });
  return data;
}

export async function fetchCourseLeaderboard(slug) {
  const { data } = await apiClient.get(`/courses/${slug}/leaderboard`, { params: { limit: 100 } });
  return data;
}

export async function fetchCourseExams(slug) {
  const { data } = await apiClient.get(`/courses/${slug}/exams`, { params: { limit: 100 } });
  return data;
}

export async function fetchExamPositions(examId) {
  const { data } = await apiClient.get(`/exams/${examId}/positions`, { params: { limit: 100 } });
  return data;
}

/** Academy-wide notices, pinned first. */
export async function fetchNotices({ signal } = {}) {
  const notices = new Map();
  const limit = 50;
  for (let offset = 0; ; offset += limit) {
    const { data } = await apiClient.get('/announcements', { params: { limit, offset }, signal });
    for (const notice of data) notices.set(notice.id, notice);
    if (data.length < limit) return [...notices.values()];
  }
}

export async function fetchPaymentHistory() {
  const { data } = await apiClient.get('/me/payments', { params: { limit: 100 } });
  return data;
}

/** Active enrolments that can carry subscriptions. */
export async function fetchSubscriptionBatches() {
  const { data } = await apiClient.get('/me/subscriptions/batches');
  return data;
}

/** `{ active, unpaid, previous }` for one enrolment. */
export async function fetchSubscriptions(batchId) {
  const { data } = await apiClient.get('/me/subscriptions', { params: { batchId } });
  return data;
}

/** Packages still purchasable for one enrolment. */
export async function fetchSubscriptionPlans(batchId) {
  const { data } = await apiClient.get('/subscription-plans', { params: { batchId } });
  return data;
}

export async function fetchAccountProfile() {
  const { data } = await apiClient.get('/me/profile');
  return data;
}

/**
 * Patch one section of the profile; only the changed section is sent.
 * @param {{ section: 'basic' | 'contact' | 'address', values: Record<string, string> }} payload
 */
export async function updateAccountProfile({ section, values }) {
  const { data } = await apiClient.patch('/me/profile', { section, values });
  return data;
}

/** Devices bound to this account; the backend identifies them by X-Device-Id. */
export async function fetchDevices() {
  const { data } = await apiClient.get('/me/devices');
  return data;
}

/** Ask an administrator to move the verified device to this browser. */
export async function requestDeviceVerification({ reason }) {
  const { data } = await apiClient.post('/me/devices/verify-request', { reason });
  return data;
}

/** Changing the password revokes every session, including this one. */
export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await apiClient.post('/me/password', { currentPassword, newPassword });
  return data;
}

/**
 * Support complaints ("Complain Box"). A complaint is a thread: the student
 * opens it, the academy replies, and it is closed once resolved. `status`
 * drives the whole UI — 'solved' locks the thread and shows the closing banner.
 */
export const COMPLAINT_TOPICS = Object.freeze([
  'Lecture Sheet / Books',
  'Class & Schedule',
  'Exam & Result',
  'Payment & Invoice',
  'Device / Login Problem',
  'Other',
]);

export async function fetchComplaints() {
  const { data } = await apiClient.get('/me/complaints', { params: { limit: 100 } });
  return data;
}

export async function fetchComplaint(id) {
  const { data } = await apiClient.get(`/me/complaints/${id}`);
  return data;
}

/** @param {{ relatedTo: string, batchTitle: string, body: string }} payload */
export async function createComplaint({ relatedTo, batchTitle, body }) {
  const { data } = await apiClient.post('/me/complaints', { relatedTo, batchTitle: batchTitle ?? '', body });
  return data;
}

/** @param {{ id: string, body: string }} payload */
export async function replyToComplaint({ id, body }) {
  const { data } = await apiClient.post(`/me/complaints/${id}/replies`, { body });
  return data;
}
