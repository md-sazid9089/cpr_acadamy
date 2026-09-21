import apiClient from '@/lib/api-client';

/** Upload an admin-selected image and return the API-delivered URL. */
export async function uploadImage(file) {
  if (!file?.type || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.');
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.readAsDataURL(file);
  });
  const response = await apiClient.post('/admin/uploads/images', { data });
  return response.data.url;
}
import { QUESTION_TYPES } from '@/constants';

/**
 * Admin data access. Every endpoint is role-gated server-side too — the
 * ProtectedRoute check is a UX affordance, not a security boundary.
 *
 * The editor works in "Dhaka wall-clock" terms (a date plus a time) and
 * percentage-based negative marking; the API stores instants and percentage
 * points. The small adapters below translate in both directions so the
 * components never see the difference.
 */

// ─── Time helpers ──────────────────────────────────────────────────────────

const DHAKA_OFFSET = '+06:00';

/** '2026-07-25' + '14:30' (or '02:30 PM') in Dhaka time -> ISO instant. */
export function dhakaInstant(date, time) {
  const [hours, minutes] = to24h(time).split(':');
  return new Date(`${date}T${hours}:${minutes}:00${DHAKA_OFFSET}`).toISOString();
}

/** Accepts 'HH:mm' or 'hh:mm AM/PM' and returns 'HH:mm'. */
export function to24h(value) {
  const match = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!match) return '00:00';
  let hours = Number(match[1]) % 24;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

/** '1h 20m' | '58m' | '75' -> minutes. */
export function parseDuration(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (/^\d+$/.test(text)) return Number(text);
  const hours = Number(text.match(/(\d+)\s*h/)?.[1] ?? 0);
  const minutes = Number(text.match(/(\d+)\s*m/)?.[1] ?? 0);
  return hours * 60 + minutes;
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

// ─── Stats & reports ───────────────────────────────────────────────────────

export async function fetchAdminStats() {
  const { data } = await apiClient.get('/admin/stats');
  return data;
}

const MONTH_LABEL = new Intl.DateTimeFormat('en-GB', { month: 'short' });
function monthLabel(yyyyMm) {
  const [year, month] = yyyyMm.split('-').map(Number);
  return MONTH_LABEL.format(new Date(Date.UTC(year, month - 1, 1)));
}

export async function fetchAdminReports() {
  const { data } = await apiClient.get('/admin/reports');
  return { ...data, revenueByMonth: data.revenueByMonth.map((row) => ({ ...row, month: monthLabel(row.month) })) };
}

export async function fetchAdminRevenue() {
  const { data } = await apiClient.get('/admin/revenue');
  return { ...data, byMonth: data.byMonth.map((row) => ({ ...row, month: monthLabel(row.month) })) };
}

// ─── Students ──────────────────────────────────────────────────────────────

export async function fetchStudents({ status, search } = {}) {
  const { data } = await apiClient.get('/admin/students', {
    params: { status: status && status !== 'ALL' ? status : undefined, search: search || undefined, limit: 100 },
  });
  return data;
}

/** @param {string} id */
export async function fetchStudent(id) {
  const { data } = await apiClient.get(`/admin/students/${id}`);
  return { ...data, enrolments: data.enrollments ?? [] };
}

/** @param {string} studentId */
export async function fetchStudentPayments(studentId) {
  const { data } = await apiClient.get(`/admin/students/${studentId}/payments`, { params: { limit: 100 } });
  return data;
}

/** @param {{ studentId: string, status: string }} args Triggers the status SMS. */
export async function updateStudentStatus({ studentId, status }) {
  const { data } = await apiClient.patch(`/admin/students/${studentId}/status`, { status });
  return data;
}

// ─── Payments ──────────────────────────────────────────────────────────────

/** Reconciles a manual payment; this is what activates the enrolment. */
export async function confirmPayment({ id, transactionId, amount, evidence }) {
  const { data } = await apiClient.post(`/admin/payments/${id}/confirm`, { transactionId, amount, evidence });
  return data;
}

export async function rejectPayment({ id, reason }) {
  const { data } = await apiClient.post(`/admin/payments/${id}/reject`, { reason });
  return data;
}

// ─── Courses ───────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Editor form -> API body. Derived/read-only fields are dropped. */
function toCoursePayload(course) {
  const payload = {};
  const copy = (key, value) => {
    if (value !== undefined) payload[key] = value;
  };
  copy('title', course.title);
  copy('slug', course.slug);
  copy('category', course.category);
  copy('price', course.price === undefined ? undefined : Number(course.price) || 0);
  if (course.discountPrice !== undefined) {
    payload.discountPrice = course.discountPrice === '' || course.discountPrice === null ? null : Number(course.discountPrice);
  }
  copy('accessDays', course.accessDays);
  copy('isPublished', course.isPublished);
  copy('mixedNegativeMarkingMin', course.mixedNegativeMarkingMin);
  copy('mixedNegativeMarkingMax', course.mixedNegativeMarkingMax);
  copy('mixedPassMarkMin', course.mixedPassMarkMin);
  copy('mixedPassMarkMax', course.mixedPassMarkMax);
  copy('subtitle', course.subtitle);
  copy('description', course.description);
  copy('duration', course.duration);
  copy('branch', course.branch);
  copy('isFeatured', course.isFeatured);
  copy('highlights', course.highlights);
  copy('classDays', course.classDays);
  copy('classTime', course.classTime);
  if (course.thumbnailUrl !== undefined) payload.thumbnailUrl = course.thumbnailUrl ?? '';
  for (const key of ['batchGroup', 'batchType', 'session']) {
    if (course[key] !== undefined) payload[key] = course[key] ?? '';
  }
  if (course.startsOn !== undefined) payload.startsOn = course.startsOn || null;
  if (course.offer !== undefined) {
    payload.offer = course.offer?.label ? { label: course.offer.label, endsAt: course.offer.endsAt || null } : null;
  }
  return payload;
}

export async function fetchAdminCourses() {
  const { data } = await apiClient.get('/admin/courses', { params: { limit: 100 } });
  return data;
}

/** @param {string} id */
export async function fetchAdminCourse(id) {
  const { data } = await apiClient.get(`/admin/courses/${id}`);
  return data;
}

export async function fetchAdminCourseLeaderboard(id) {
  const { data } = await apiClient.get(`/admin/courses/${id}/leaderboard`, { params: { limit: 500 } });
  return data;
}

/**
 * Creates a draft. Only what the New-course dialog collects is required; the
 * Detail tab fills the rest in.
 *
 * @param {{ title: string, category: string, batchGroup?: string, price: number }} input
 */
export async function createCourse(input) {
  const base = slugify(input.title).slice(0, 140) || 'course';
  const { data } = await apiClient.post('/admin/courses', {
    slug: `${base}-${Date.now().toString(36).slice(-4)}`,
    title: input.title,
    category: input.category,
    batchGroup: input.batchGroup ?? '',
    price: Number(input.price) || 0,
  });
  return data;
}

/** @param {{ id: string } & Partial<import('@/types').Course>} args */
export async function updateCourse({ id, ...updates }) {
  const { data } = await apiClient.patch(`/admin/courses/${id}`, toCoursePayload(updates));
  return data;
}

/** @param {{ id: string, status: 'draft' | 'published' }} args */
export async function setCourseStatus({ id, status }) {
  const { data } = await apiClient.patch(`/admin/courses/${id}`, { isPublished: status === 'published' });
  return data;
}

// ─── Videos ────────────────────────────────────────────────────────────────

function toVideoPayload(video) {
  const payload = {};
  if (video.courseId !== undefined) payload.courseId = video.courseId;
  if (video.title !== undefined) payload.title = video.title;
  if (video.videoUrl !== undefined) payload.src = video.videoUrl ?? '';
  if (video.notesUrl !== undefined) payload.notesUrl = video.notesUrl ?? '';
  if (video.status !== undefined) payload.status = video.status;
  if (video.duration !== undefined) payload.durationMinutes = parseDuration(video.duration);
  if (video.scheduledDate && video.scheduledTime) payload.scheduledAt = dhakaInstant(video.scheduledDate, video.scheduledTime);
  if (video.chapterId !== undefined) payload.chapterId = video.chapterId || null;
  return payload;
}

/** @param {{ courseId?: string, status?: string }} [filters] */
export async function fetchAdminVideos({ courseId, status } = {}) {
  const { data } = await apiClient.get('/admin/videos', {
    params: { courseId: courseId || undefined, status: status && status !== 'ALL' ? status : undefined, limit: 100 },
  });
  return data;
}

export async function createVideo(video) {
  const { data } = await apiClient.post('/admin/videos', toVideoPayload(video));
  return data;
}

export async function updateVideo({ id, ...updates }) {
  const { data } = await apiClient.patch(`/admin/videos/${id}`, toVideoPayload(updates));
  return data;
}

export async function deleteVideo(id) {
  const { data } = await apiClient.delete(`/admin/videos/${id}`);
  return data;
}

// ─── Chapters ──────────────────────────────────────────────────────────────

/** @param {string} courseId */
export async function fetchAdminChapters(courseId) {
  const { data } = await apiClient.get('/admin/chapters', { params: { courseId, limit: 100 } });
  return data;
}

export async function createChapter({ courseId, title }) {
  const { data } = await apiClient.post('/admin/chapters', { courseId, title });
  return data;
}

export async function updateChapter({ id, title }) {
  const { data } = await apiClient.patch(`/admin/chapters/${id}`, { title });
  return data;
}

export async function deleteChapter(id) {
  const { data } = await apiClient.delete(`/admin/chapters/${id}`);
  return data;
}

// ─── Exams ─────────────────────────────────────────────────────────────────

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e'];

function questionId() {
  return `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** A fresh, unanswered question of the given type. */
export function blankQuestion(type, marks = type === QUESTION_TYPES.MTF ? 0.4 : 2) {
  const options = OPTION_IDS.map((id) => ({ id, text: '' }));
  return type === QUESTION_TYPES.MTF
    ? { id: questionId(), type, stem: '', imageUrl: '', options, correctAnswer: {}, explanation: '', marks }
    : { id: questionId(), type, stem: '', imageUrl: '', options, correctOptionId: '', explanation: '', marks };
}

/** API question -> editor question (SBA keys live in `correctOptionId`). */
function toEditorQuestion(question) {
  const base = { id: question.id, type: question.type, stem: question.stem ?? '', imageUrl: question.imageUrl ?? '', options: question.options, explanation: question.explanation ?? '', marks: question.marks ?? 1 };
  return question.type === QUESTION_TYPES.MTF
    ? { ...base, correctAnswer: question.correctAnswer && typeof question.correctAnswer === 'object' ? question.correctAnswer : {} }
    : { ...base, correctOptionId: typeof question.correctAnswer === 'string' ? question.correctAnswer : '' };
}

function toApiQuestion(question) {
  const correctAnswer = question.type === QUESTION_TYPES.MTF
    ? (question.correctAnswer && Object.keys(question.correctAnswer).length ? question.correctAnswer : null)
    : (question.correctOptionId || null);
  return {
    id: question.id,
    type: question.type,
    stem: question.stem ?? '',
    imageUrl: question.imageUrl ?? '',
    options: question.options.map((option) => ({ id: option.id, text: option.text ?? '' })),
    correctAnswer,
    explanation: question.explanation ?? '',
    marks: Number(question.marks ?? 1),
  };
}

/**
 * API exam -> editor exam. `type` is the question type the editor filters on;
 * the live/mock/practice classification is exposed as `kind`.
 */
function toEditorExam(exam) {
  const marksPerQuestion = Number(exam.marksPerQuestion ?? 1);
  const deductionPercent = Number(exam.negativeMarking ?? 0);
  const type = exam.questionType ?? QUESTION_TYPES.SBA;
  const questionCount = exam.targetQuestionCount ?? exam.questionCount ?? 0;
  return {
    id: exam.id,
    courseId: exam.courseId,
    courseName: exam.courseName ?? exam.courseTitle,
    title: exam.title,
    type,
    kind: exam.type,
    status: exam.status,
    isPublished: exam.isPublished,
    scheduledAt: exam.scheduledAt,
    closesAt: exam.closesAt,
    resultsAt: exam.resultsAt,
    durationMinutes: exam.durationMinutes,
    questionCount,
    writtenCount: exam.questionCount ?? 0,
    incompleteCount: (exam.questionCount ?? 0) - (exam.completeQuestionCount ?? 0),
    marksPerQuestion,
    deductionPercent,
    passMark: Number(exam.passMark ?? 70),
    totalMarks: exam.totalMarks ?? 0,
    attemptCount: exam.attemptCount ?? 0,
    questions: Array.isArray(exam.questions) ? exam.questions.map(toEditorQuestion) : undefined,
  };
}

function toExamPayload(exam) {
  const payload = {};
  if (exam.courseId !== undefined) payload.courseId = exam.courseId;
  if (exam.title !== undefined) payload.title = exam.title;
  if (exam.type !== undefined) payload.questionType = exam.type;
  if (exam.kind !== undefined) payload.type = exam.kind;
  if (exam.isPublished !== undefined) payload.isPublished = exam.isPublished;
  if (exam.scheduledAt !== undefined) payload.scheduledAt = exam.scheduledAt;
  if (exam.closesAt !== undefined) payload.closesAt = exam.closesAt || null;
  if (exam.resultsAt !== undefined) payload.resultsAt = exam.resultsAt || null;
  if (exam.durationMinutes !== undefined) payload.durationMinutes = Math.max(1, Number(exam.durationMinutes) || 1);
  if (exam.questionCount !== undefined) payload.targetQuestionCount = Math.max(0, Number(exam.questionCount) || 0);
  if (exam.marksPerQuestion !== undefined) payload.marksPerQuestion = round3(Number(exam.marksPerQuestion) || 0);
  if (exam.deductionPercent !== undefined) payload.negativeMarking = round3(Number(exam.deductionPercent));
  if (exam.passMark !== undefined) payload.passMark = round3(Number(exam.passMark));
  if (exam.questions !== undefined) {
    payload.questions = exam.questions.map(toApiQuestion);
  }
  return payload;
}

/** @param {{ courseId?: string, type?: string }} [filters] */
export async function fetchAdminExams({ courseId, type } = {}) {
  const { data } = await apiClient.get('/admin/exams', {
    params: { courseId: courseId || undefined, type: type && type !== 'ALL' ? type : undefined, limit: 100 },
  });
  return data.map(toEditorExam);
}

/** @param {string} id */
export async function fetchAdminExam(id) {
  const { data } = await apiClient.get(`/admin/exams/${id}`);
  return toEditorExam(data);
}

export async function fetchAdminExamPositions(id) {
  const { data } = await apiClient.get(`/admin/exams/${id}/positions`, { params: { limit: 500 } });
  return data;
}

export async function updateAdminExamScore(examId, userId, score, revisionReason) {
  const { data } = await apiClient.patch(`/admin/exams/${examId}/attempts/${userId}`, { score, revisionReason });
  return data;
}

export async function createExam(exam) {
  const { data } = await apiClient.post('/admin/exams', toExamPayload({ kind: 'practice', isPublished: false, ...exam }));
  return toEditorExam(data);
}

/**
 * Saves settings and/or questions. Send `questions` (the full editor list) to
 * replace the paper, retaining each question's own marks.
 */
export async function updateExam({ id, ...updates }) {
  const { data } = await apiClient.patch(`/admin/exams/${id}`, toExamPayload(updates));
  return toEditorExam(data);
}

export async function deleteExam(id) {
  const { data } = await apiClient.delete(`/admin/exams/${id}`);
  return data;
}

// ─── Schedules ─────────────────────────────────────────────────────────────

function toSchedulePayload(entry) {
  const payload = {};
  if (entry.courseId !== undefined) payload.courseId = entry.courseId;
  if (entry.date && entry.time) payload.scheduledAt = dhakaInstant(entry.date, entry.time);
  for (const key of ['exam', 'solveClass', 'lecture']) {
    if (entry[key] !== undefined) payload[key] = entry[key];
  }
  for (const key of ['examId', 'solveClassVideoId', 'lectureVideoId']) {
    if (entry[key] !== undefined) payload[key] = entry[key] || null;
  }
  return payload;
}

/** @param {{ courseId?: string }} [filters] */
export async function fetchAdminSchedules({ courseId } = {}) {
  const { data } = await apiClient.get('/admin/schedules', { params: { courseId: courseId || undefined, limit: 100 } });
  return data;
}

export async function createScheduleEntry(entry) {
  const { data } = await apiClient.post('/admin/schedules', toSchedulePayload(entry));
  return data;
}

export async function updateScheduleEntry({ id, ...updates }) {
  const { data } = await apiClient.patch(`/admin/schedules/${id}`, toSchedulePayload(updates));
  return data;
}

export async function deleteScheduleEntry(id) {
  const { data } = await apiClient.delete(`/admin/schedules/${id}`);
  return data;
}

// ─── Complaints ────────────────────────────────────────────────────────────

export async function fetchAdminComplaints() {
  const { data } = await apiClient.get('/admin/complaints', { params: { limit: 100 } });
  return data;
}

export async function replyToComplaintAsAdmin({ id, body }) {
  const { data } = await apiClient.post(`/admin/complaints/${id}/replies`, { body });
  return data;
}

/** @param {{ id: string, status: 'open' | 'solved' }} args */
export async function setComplaintStatus({ id, status }) {
  const { data } = await apiClient.patch(`/admin/complaints/${id}/status`, { status });
  return data;
}

// ─── Announcements ─────────────────────────────────────────────────────────

export async function fetchAdminAnnouncements() {
  const { data } = await apiClient.get('/admin/announcements', { params: { limit: 100 } });
  return data;
}

export async function createAnnouncement(input) {
  const { data } = await apiClient.post('/admin/announcements', input);
  return data;
}

export async function updateAnnouncement({ id, ...updates }) {
  const { data } = await apiClient.patch(`/admin/announcements/${id}`, updates);
  return data;
}

export async function deleteAnnouncement(id) {
  const { data } = await apiClient.delete(`/admin/announcements/${id}`);
  return data;
}

// ─── Gallery ────────────────────────────────────────────────────────────────

export async function fetchAdminGallery() {
  const { data } = await apiClient.get('/admin/gallery', { params: { limit: 200 } });
  return data;
}

export async function createGalleryPhoto(input) {
  const { data } = await apiClient.post('/admin/gallery', input);
  return data;
}

export async function updateGalleryPhoto({ id, ...updates }) {
  const { data } = await apiClient.patch(`/admin/gallery/${id}`, updates);
  return data;
}

export async function deleteGalleryPhoto(id) {
  const { data } = await apiClient.delete(`/admin/gallery/${id}`);
  return data;
}
