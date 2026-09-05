import { ACCOUNT_STATUS, COURSE_STATUS, QUESTION_TYPES } from '@/constants';
import { sleep } from '@/lib/utils';
import { MOCK_COURSES, commitCourse } from '@/features/courses/api/mock-courses.js';
import { computeTotalMarks } from '../utils/marking.js';
// import apiClient from '@/lib/api-client';

/**
 * Admin data, mocked.
 * TODO: GET /admin/stats, /admin/students, PATCH /admin/students/:id/status,
 * GET/POST/PATCH /admin/courses(/:id), POST /admin/courses/:id/publish,
 * GET /admin/reports,
 * GET/POST/PATCH/DELETE /admin/courses/:id/videos,
 * GET/POST/PATCH/DELETE /admin/courses/:id/exams,
 * GET/POST/PATCH/DELETE /admin/exams/:id/questions(/:qid), PUT …/questions/order,
 * GET/POST/PATCH/DELETE /admin/courses/:id/schedule.
 * Every one of these is role-gated server-side too — the ProtectedRoute check
 * is a UX affordance, not a security boundary.
 */

export async function fetchAdminStats() {
  await sleep(350);
  return {
    totalStudents: 12480,
    pendingApprovals: 37,
    activeCourses: 14,
    revenueThisMonth: 1842000,
    examsThisWeek: 9,
    newRegistrations7d: 214,
    totalVideos: 156,
    totalExams: 48,
    scheduleEntries: 42,
  };
}

// ─── Students ──────────────────────────────────────────────────────────────

let MOCK_STUDENTS = [
  { id: 'u-11', fullName: 'Dr. Sadia Rahman', mobile: '01712345678', email: 'sadia.rahman@example.com', bmdcNumber: 'A-78412', institution: 'Dhaka Medical College', interest: 'FCPS', status: ACCOUNT_STATUS.AWAITING_APPROVAL, createdAt: '2026-08-12T08:20:00.000Z', lastLoginAt: null, enrolments: [] },
  { id: 'u-12', fullName: 'Dr. Imran Kabir', mobile: '01812345678', email: 'imran.kabir@example.com', bmdcNumber: 'A-80115', institution: 'Chittagong Medical College', interest: 'BCS', status: ACCOUNT_STATUS.AWAITING_APPROVAL, createdAt: '2026-08-12T11:05:00.000Z', lastLoginAt: null, enrolments: [] },
  { id: 'u-13', fullName: 'Dr. Nusrat Jahan', mobile: '01912345678', email: 'nusrat.jahan@example.com', bmdcNumber: 'A-69230', institution: 'BSMMU', interest: 'FCPS', status: ACCOUNT_STATUS.ACTIVE, createdAt: '2026-06-01T09:00:00.000Z', lastLoginAt: '2026-09-04T18:42:00.000Z', enrolments: [
    { courseId: 'c-1', courseTitle: 'FCPS Part-1 Medicine — January Batch', enrolledAt: '2026-06-02T10:15:00.000Z', status: 'active', progress: 62 },
    { courseId: 'c-8', courseTitle: 'FCPS Part-1 Medicine — Mock Plus Batch', enrolledAt: '2026-08-20T14:00:00.000Z', status: 'active', progress: 18 },
  ] },
  { id: 'u-14', fullName: 'Dr. Tanvir Ahmed', mobile: '01612345678', email: 'tanvir.ahmed@example.com', bmdcNumber: 'A-91004', institution: 'Rajshahi Medical College', interest: 'MBBS', status: ACCOUNT_STATUS.ACTIVE, createdAt: '2026-05-18T14:30:00.000Z', lastLoginAt: '2026-09-03T09:10:00.000Z', enrolments: [
    { courseId: 'c-4', courseTitle: 'MBBS 3rd Professional — Final Revision', enrolledAt: '2026-05-19T08:00:00.000Z', status: 'active', progress: 88 },
  ] },
  { id: 'u-15', fullName: 'Dr. Farhana Akter', mobile: '01512345678', email: 'farhana.akter@example.com', bmdcNumber: 'A-72651', institution: 'Sylhet MAG Osmani', interest: 'BCS', status: ACCOUNT_STATUS.SUSPENDED, createdAt: '2026-02-09T10:15:00.000Z', lastLoginAt: '2026-07-30T20:05:00.000Z', enrolments: [
    { courseId: 'c-3', courseTitle: 'BCS (Health) Cadre — Full Preparation', enrolledAt: '2026-02-10T11:00:00.000Z', status: 'expired', progress: 41 },
  ] },
];

function findStudent(id) {
  const student = MOCK_STUDENTS.find((s) => s.id === id);
  if (!student) {
    throw { status: 404, code: 'STUDENT_NOT_FOUND', message: 'This student could not be found.' };
  }
  return student;
}

export async function fetchStudents({ status } = {}) {
  await sleep(400);
  return status && status !== 'ALL'
    ? MOCK_STUDENTS.filter((student) => student.status === status)
    : [...MOCK_STUDENTS];
}

/** @param {string} id */
export async function fetchStudent(id) {
  await sleep(350);
  return { ...findStudent(id) };
}

/** @param {{ studentId: string, status: string }} args */
export async function updateStudentStatus({ studentId, status }) {
  await sleep(400);
  // TODO: PATCH /admin/students/:id/status — triggers the activation SMS.
  findStudent(studentId).status = status;
  return { ok: true, studentId, status };
}

// ─── Payments / revenue ────────────────────────────────────────────────────

const MOCK_PAYMENTS = [
  { id: 'pay-1', invoiceNo: 'CPR-2026-001842', studentId: 'u-13', studentName: 'Dr. Nusrat Jahan', courseId: 'c-1', courseTitle: 'FCPS Part-1 Medicine — January Batch', amount: 13500, method: 'bkash', transactionId: 'BKH8ZQ11X4', status: 'paid', paidAt: '2026-06-02T10:14:00.000Z' },
  { id: 'pay-2', invoiceNo: 'CPR-2026-002310', studentId: 'u-13', studentName: 'Dr. Nusrat Jahan', courseId: 'c-8', courseTitle: 'FCPS Part-1 Medicine — Mock Plus Batch', amount: 4500, method: 'nagad', transactionId: 'NGD5TR88K2', status: 'paid', paidAt: '2026-08-20T13:58:00.000Z' },
  { id: 'pay-3', invoiceNo: 'CPR-2026-001590', studentId: 'u-14', studentName: 'Dr. Tanvir Ahmed', courseId: 'c-4', courseTitle: 'MBBS 3rd Professional — Final Revision', amount: 5900, method: 'card', transactionId: 'CRD77A1B9Q', status: 'paid', paidAt: '2026-05-19T07:58:00.000Z' },
  { id: 'pay-4', invoiceNo: 'CPR-2026-000117', studentId: 'u-15', studentName: 'Dr. Farhana Akter', courseId: 'c-3', courseTitle: 'BCS (Health) Cadre — Full Preparation', amount: 8900, method: 'rocket', transactionId: 'RKT2MN90LP', status: 'paid', paidAt: '2026-02-10T10:59:00.000Z' },
  { id: 'pay-5', invoiceNo: 'CPR-2026-002415', studentId: 'u-15', studentName: 'Dr. Farhana Akter', courseId: 'c-15', courseTitle: 'BCS Written & Viva — Intensive Batch', amount: 9500, method: 'bkash', transactionId: null, status: 'failed', paidAt: '2026-07-28T19:40:00.000Z' },
  { id: 'pay-6', invoiceNo: 'CPR-2026-002501', studentId: 'u-14', studentName: 'Dr. Tanvir Ahmed', courseId: 'c-16', courseTitle: 'MBBS Final Professional — SBA Batch', amount: 4200, method: 'bkash', transactionId: null, status: 'pending', paidAt: '2026-09-03T09:12:00.000Z' },
  { id: 'pay-7', invoiceNo: 'CPR-2026-002488', studentId: 'u-13', studentName: 'Dr. Nusrat Jahan', courseId: 'c-2', courseTitle: 'FCPS Part-2 Surgery — Clinical Intensive', amount: 25000, method: 'card', transactionId: 'CRD11ZX40PL', status: 'refunded', paidAt: '2026-08-30T16:20:00.000Z' },
];

/** @param {string} studentId */
export async function fetchStudentPayments(studentId) {
  await sleep(350);
  return MOCK_PAYMENTS.filter((payment) => payment.studentId === studentId).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

export async function fetchAdminRevenue() {
  await sleep(450);
  const paid = MOCK_PAYMENTS.filter((payment) => payment.status === 'paid');
  const byCourse = Object.values(
    paid.reduce((acc, payment) => {
      const entry = acc[payment.courseId] ?? { courseId: payment.courseId, courseTitle: payment.courseTitle, amount: 0, count: 0 };
      entry.amount += payment.amount;
      entry.count += 1;
      acc[payment.courseId] = entry;
      return acc;
    }, {}),
  ).sort((a, b) => b.amount - a.amount);

  return {
    summary: {
      thisMonth: 1842000,
      lastMonth: 1755000,
      yearToDate: 12480000,
      pendingAmount: MOCK_PAYMENTS.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      refundedAmount: MOCK_PAYMENTS.filter((p) => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0),
      paidCount: 1486,
    },
    byMonth: [
      { month: 'Mar', amount: 1240000 },
      { month: 'Apr', amount: 1385000 },
      { month: 'May', amount: 1120000 },
      { month: 'Jun', amount: 1690000 },
      { month: 'Jul', amount: 1755000 },
      { month: 'Aug', amount: 1842000 },
    ],
    byMethod: [
      { method: 'bkash', amount: 985000, share: 53 },
      { method: 'nagad', amount: 412000, share: 22 },
      { method: 'card', amount: 298000, share: 16 },
      { method: 'rocket', amount: 147000, share: 9 },
    ],
    byCourse,
    transactions: [...MOCK_PAYMENTS].sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
  };
}

// ─── Courses ───────────────────────────────────────────────────────────────
// Backed by the same MOCK_COURSES array the public catalogue reads, so an edit
// here is visible on /courses/:category/:slug straight away.

function findCourse(id) {
  const course = MOCK_COURSES.find((c) => c.id === id);
  if (!course) {
    throw { status: 404, code: 'COURSE_NOT_FOUND', message: 'This course could not be found.' };
  }
  return course;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function fetchAdminCourses() {
  await sleep(400);
  return [...MOCK_COURSES];
}

/** @param {string} id */
export async function fetchAdminCourse(id) {
  await sleep(300);
  return { ...findCourse(id) };
}

/**
 * Creates a draft. Only what the New-course dialog collects is required; the
 * Detail tab fills the rest in.
 *
 * @param {{ title: string, category: string, batchGroup?: string, price: number }} input
 */
export async function createCourse(input) {
  await sleep(500);
  const id = `c-${Date.now()}`;
  const course = {
    id,
    slug: `${slugify(input.title)}-${id.slice(-4)}`,
    title: input.title,
    category: input.category,
    batchGroup: input.batchGroup ?? null,
    batchType: null,
    session: null,
    branch: 'online',
    subtitle: '',
    thumbnailUrl: null,
    description: '',
    highlights: [],
    price: Number(input.price) || 0,
    discountPrice: null,
    offer: null,
    duration: '',
    classTime: { start: '', end: '' },
    classDays: [],
    lessonCount: 0,
    enrolledCount: 0,
    rating: null,
    startsOn: null,
    isFeatured: false,
    status: COURSE_STATUS.DRAFT,
  };
  MOCK_COURSES.unshift(course);
  commitCourse(course);
  return { ...course };
}

/** @param {{ id: string } & Partial<import('@/types').Course>} args */
export async function updateCourse({ id, ...updates }) {
  await sleep(400);
  const course = findCourse(id);
  Object.assign(course, updates);
  commitCourse(course);
  return { ...course };
}

/** @param {{ id: string, status: 'draft' | 'published' }} args */
export async function setCourseStatus({ id, status }) {
  await sleep(400);
  const course = findCourse(id);
  course.status = status;
  commitCourse(course);
  return { ...course };
}

export async function fetchAdminReports() {
  await sleep(400);
  return {
    revenueByMonth: [
      { month: 'Mar', amount: 1240000 },
      { month: 'Apr', amount: 1385000 },
      { month: 'May', amount: 1120000 },
      { month: 'Jun', amount: 1690000 },
      { month: 'Jul', amount: 1755000 },
      { month: 'Aug', amount: 1842000 },
    ],
    enrolmentByCategory: [
      { category: 'FCPS', count: 5420 },
      { category: 'BCS', count: 4380 },
      { category: 'MBBS', count: 2680 },
    ],
    examParticipation: { averageAttendance: 78, examsHeld: 132, averageScore: 64.2 },
  };
}

// ─── Videos CRUD ───────────────────────────────────────────────────────────
// `videoUrl` / `notesUrl` are plain URLs for now.
// TODO: swap for real uploads once a storage target is chosen (Vimeo, Bunny,
// Cloudinary or S3 are the candidates). The field shape stays a string either
// way — the upload widget just fills it in.

let MOCK_VIDEOS = [
  { id: 'v-1', title: 'Orientation Program For FCPS Mid-Term Surgery Regular Batch-2 December\'26', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-07-25', scheduledTime: '04:00 PM', duration: '1h 12m', status: 'published', videoUrl: 'https://vimeo.com/000000001', notesUrl: null },
  { id: 'v-2', title: 'FCPS Mid-Term Surgery Regular Batch Dec\'26-Lecture How To Prepare For Mid-Term Surgery.', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-07-25', scheduledTime: '04:00 PM', duration: '58m', status: 'published', videoUrl: 'https://vimeo.com/000000002', notesUrl: 'https://example.com/notes/how-to-prepare.pdf' },
  { id: 'v-3', title: 'FCPS Mid-Term Surgery Long & Regular Batch December\'26, Lecture: Upper GIT', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-07-26', scheduledTime: '02:30 PM', duration: '1h 05m', status: 'published', videoUrl: 'https://vimeo.com/000000003', notesUrl: 'https://example.com/notes/upper-git.pdf' },
  { id: 'v-4', title: 'FCPS Mid-Term Surgery Regular Batch December\'26, Lecture: Basic Principle of Surgery-1 (Chapter-1, 2, 3)', courseId: 'c-2', courseName: 'FCPS Part-2 Surgery — Clinical Intensive', scheduledDate: '2026-07-29', scheduledTime: '02:30 PM', duration: '1h 20m', status: 'published', videoUrl: 'https://vimeo.com/000000004', notesUrl: null },
  { id: 'v-5', title: 'Renal System Live class Dec\'26', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-08-02', scheduledTime: '02:30 PM', duration: '1h 15m', status: 'published', videoUrl: 'https://vimeo.com/000000005', notesUrl: 'https://example.com/notes/renal.pdf' },
  { id: 'v-6', title: 'Body fluid, Electrolytes, Acid Base Balance Live class Dec\'26', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-08-02', scheduledTime: '02:30 PM', duration: '55m', status: 'draft', videoUrl: '', notesUrl: null },
  { id: 'v-7', title: 'Respiratory & General Physiology Live class Dec\'26', courseId: 'c-3', courseName: 'BCS (Health) Cadre — Full Preparation', scheduledDate: '2026-08-09', scheduledTime: '02:30 PM', duration: '1h 10m', status: 'published', videoUrl: 'https://vimeo.com/000000007', notesUrl: null },
  { id: 'v-8', title: 'Cell Injury & Adaptation Live class Dec\'26', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-08-16', scheduledTime: '02:30 PM', duration: '1h 05m', status: 'draft', videoUrl: '', notesUrl: null },
];

/** @param {{ courseId?: string, status?: string }} [filters] */
export async function fetchAdminVideos({ courseId, status } = {}) {
  await sleep(400);
  let videos = [...MOCK_VIDEOS];
  if (courseId) videos = videos.filter((v) => v.courseId === courseId);
  if (status && status !== 'ALL') videos = videos.filter((v) => v.status === status);
  return videos;
}

export async function createVideo(video) {
  await sleep(500);
  const course = MOCK_COURSES.find((c) => c.id === video.courseId);
  const newVideo = { ...video, courseName: course?.title ?? video.courseName, id: `v-${Date.now()}` };
  MOCK_VIDEOS = [newVideo, ...MOCK_VIDEOS];
  return newVideo;
}

export async function updateVideo({ id, ...updates }) {
  await sleep(400);
  MOCK_VIDEOS = MOCK_VIDEOS.map((v) => (v.id === id ? { ...v, ...updates } : v));
  return MOCK_VIDEOS.find((v) => v.id === id);
}

export async function deleteVideo(id) {
  await sleep(300);
  MOCK_VIDEOS = MOCK_VIDEOS.filter((v) => v.id !== id);
  return { ok: true };
}

// ─── Exams CRUD ────────────────────────────────────────────────────────────

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e'];

/** A fresh, unanswered question of the given type. */
export function blankQuestion(type) {
  const options = OPTION_IDS.map((id) => ({ id, text: '' }));
  return type === QUESTION_TYPES.MTF
    ? { id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, stem: '', imageUrl: '', options, correctAnswer: {}, explanation: '' }
    : { id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, stem: '', imageUrl: '', options, correctOptionId: '', explanation: '' };
}

// Same shapes exams.api.js serves to the student runner, plus the answer key.
const SEED_QUESTIONS = {
  sba1: {
    id: 'q-1',
    type: QUESTION_TYPES.SBA,
    stem: 'A 58-year-old man presents with crushing central chest pain for two hours. ECG shows ST elevation in leads II, III and aVF. Which coronary artery is most likely occluded?',
    imageUrl: '',
    options: [
      { id: 'a', text: 'Left anterior descending artery' },
      { id: 'b', text: 'Right coronary artery' },
      { id: 'c', text: 'Left circumflex artery' },
      { id: 'd', text: 'Left main coronary artery' },
      { id: 'e', text: 'Posterior descending artery' },
    ],
    correctOptionId: 'b',
    explanation: 'Inferior ST elevation (II, III, aVF) localises to the right coronary artery in around 80% of people.',
  },
  sba2: {
    id: 'q-3',
    type: QUESTION_TYPES.SBA,
    stem: 'Which of the following is the most appropriate first-line treatment for a stable patient with newly diagnosed atrial fibrillation and a CHA₂DS₂-VASc score of 4?',
    imageUrl: '',
    options: [
      { id: 'a', text: 'Aspirin 75 mg daily' },
      { id: 'b', text: 'Direct oral anticoagulant' },
      { id: 'c', text: 'Immediate electrical cardioversion' },
      { id: 'd', text: 'Clopidogrel alone' },
      { id: 'e', text: 'No antithrombotic therapy' },
    ],
    correctOptionId: 'b',
    explanation: '',
  },
  mtf1: {
    id: 'q-2',
    type: QUESTION_TYPES.MTF,
    stem: 'Regarding the proximal convoluted tubule:',
    imageUrl: '',
    options: [
      { id: 'a', text: 'It reabsorbs approximately 65% of filtered sodium' },
      { id: 'b', text: 'Glucose reabsorption here is saturable' },
      { id: 'c', text: 'It is the primary site of action of loop diuretics' },
      { id: 'd', text: 'Bicarbonate reabsorption involves carbonic anhydrase' },
      { id: 'e', text: 'It is impermeable to water' },
    ],
    correctAnswer: { a: true, b: true, c: false, d: true, e: false },
    explanation: 'Loop diuretics act on the thick ascending limb; the PCT is freely permeable to water.',
  },
};

/** Attaches the derived total so no fixture has to carry it by hand. */
function withTotal(exam) {
  return { ...exam, totalMarks: computeTotalMarks(exam) };
}

let MOCK_EXAMS = [
  { id: 'ex-1', title: 'FCPS Part-1 — Weekly SBA Exam 14', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', type: QUESTION_TYPES.SBA, scheduledAt: '2026-09-15T14:00:00.000Z', durationMinutes: 60, questionCount: 50, marksPerQuestion: 1, deductionPercent: 25, status: 'upcoming', questions: [SEED_QUESTIONS.sba1, SEED_QUESTIONS.sba2] },
  { id: 'ex-2', title: 'FCPS Part-1 — SBA Practice Set 05', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', type: QUESTION_TYPES.SBA, scheduledAt: '2026-09-10T10:00:00.000Z', durationMinutes: 45, questionCount: 25, marksPerQuestion: 1, deductionPercent: 25, status: 'running', questions: [] },
  { id: 'ex-3', title: 'FCPS Part-1 — Weekly SBA Exam 13', courseId: 'c-2', courseName: 'FCPS Part-2 Surgery — Clinical Intensive', type: QUESTION_TYPES.SBA, scheduledAt: '2026-09-06T14:00:00.000Z', durationMinutes: 60, questionCount: 50, marksPerQuestion: 1, deductionPercent: 25, status: 'published', questions: [] },
  { id: 'ex-4', title: 'FCPS Part-1 — MTF Practice Set 08', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', type: QUESTION_TYPES.MTF, scheduledAt: '2026-09-13T10:00:00.000Z', durationMinutes: 45, questionCount: 25, marksPerQuestion: 1, deductionPercent: 25, status: 'running', questions: [SEED_QUESTIONS.mtf1] },
  { id: 'ex-5', title: 'FCPS Part-1 — Weekly MCQ Exam 12', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', type: QUESTION_TYPES.MTF, scheduledAt: '2026-09-20T14:00:00.000Z', durationMinutes: 60, questionCount: 50, marksPerQuestion: 1, deductionPercent: 25, status: 'upcoming', questions: [] },
  { id: 'ex-6', title: 'Renal System — True/False Assessment', courseId: 'c-3', courseName: 'BCS (Health) Cadre — Full Preparation', type: QUESTION_TYPES.MTF, scheduledAt: '2026-09-01T10:00:00.000Z', durationMinutes: 30, questionCount: 20, marksPerQuestion: 1, deductionPercent: 25, status: 'published', questions: [] },
  { id: 'ex-7', title: 'BCS Health — Model Test 13', courseId: 'c-3', courseName: 'BCS (Health) Cadre — Full Preparation', type: QUESTION_TYPES.SBA, scheduledAt: '2026-08-17T15:30:00.000Z', durationMinutes: 90, questionCount: 100, marksPerQuestion: 1, deductionPercent: 0, status: 'published', questions: [] },
].map(withTotal);

function findExam(id) {
  const exam = MOCK_EXAMS.find((e) => e.id === id);
  if (!exam) {
    throw { status: 404, code: 'EXAM_NOT_FOUND', message: 'This exam could not be found.' };
  }
  return exam;
}

/** @param {{ courseId?: string, type?: string }} [filters] */
export async function fetchAdminExams({ courseId, type } = {}) {
  await sleep(400);
  let exams = [...MOCK_EXAMS];
  if (courseId) exams = exams.filter((e) => e.courseId === courseId);
  if (type && type !== 'ALL') exams = exams.filter((e) => e.type === type);
  return exams;
}

/** @param {string} id */
export async function fetchAdminExam(id) {
  await sleep(300);
  return { ...findExam(id), questions: [...findExam(id).questions] };
}

export async function createExam(exam) {
  await sleep(500);
  const course = MOCK_COURSES.find((c) => c.id === exam.courseId);
  const newExam = withTotal({
    questions: [],
    marksPerQuestion: 1,
    deductionPercent: 25,
    ...exam,
    courseName: course?.title ?? exam.courseName,
    id: `ex-${Date.now()}`,
  });
  MOCK_EXAMS = [newExam, ...MOCK_EXAMS];
  return newExam;
}

/** `totalMarks` in `updates` is ignored — it is always recomputed. */
export async function updateExam({ id, ...updates }) {
  await sleep(400);
  MOCK_EXAMS = MOCK_EXAMS.map((e) => (e.id === id ? withTotal({ ...e, ...updates }) : e));
  return findExam(id);
}

export async function deleteExam(id) {
  await sleep(300);
  MOCK_EXAMS = MOCK_EXAMS.filter((e) => e.id !== id);
  return { ok: true };
}

// ─── Questions CRUD (nested under an exam) ─────────────────────────────────

function replaceQuestions(examId, questions) {
  MOCK_EXAMS = MOCK_EXAMS.map((e) => (e.id === examId ? { ...e, questions } : e));
  return questions;
}

/** @param {{ examId: string, question?: Partial<import('@/types').Question>, afterId?: string }} args */
export async function createQuestion({ examId, question, afterId }) {
  await sleep(300);
  const exam = findExam(examId);
  const created = { ...blankQuestion(exam.type), ...question };
  const list = [...exam.questions];
  const at = afterId ? list.findIndex((q) => q.id === afterId) + 1 : list.length;
  list.splice(at || list.length, 0, created);
  replaceQuestions(examId, list);
  return created;
}

/** @param {{ examId: string, questionId: string } & Partial<import('@/types').Question>} args */
export async function updateQuestion({ examId, questionId, ...updates }) {
  await sleep(250);
  const exam = findExam(examId);
  const list = exam.questions.map((q) => (q.id === questionId ? { ...q, ...updates, id: q.id } : q));
  replaceQuestions(examId, list);
  return list.find((q) => q.id === questionId);
}

/** Copies a question and slots the copy directly after the original. */
export async function duplicateQuestion({ examId, questionId }) {
  await sleep(300);
  const exam = findExam(examId);
  const source = exam.questions.find((q) => q.id === questionId);
  if (!source) throw { status: 404, code: 'QUESTION_NOT_FOUND' };
  const copy = {
    ...source,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    options: source.options.map((o) => ({ ...o })),
    correctAnswer: source.correctAnswer ? { ...source.correctAnswer } : undefined,
  };
  const list = [...exam.questions];
  list.splice(list.indexOf(source) + 1, 0, copy);
  replaceQuestions(examId, list);
  return copy;
}

export async function deleteQuestion({ examId, questionId }) {
  await sleep(250);
  const exam = findExam(examId);
  replaceQuestions(examId, exam.questions.filter((q) => q.id !== questionId));
  return { ok: true };
}

/** @param {{ examId: string, questionIds: string[] }} args  Full order, first to last. */
export async function reorderQuestions({ examId, questionIds }) {
  await sleep(250);
  const exam = findExam(examId);
  const byId = new Map(exam.questions.map((q) => [q.id, q]));
  const ordered = questionIds.map((id) => byId.get(id)).filter(Boolean);
  replaceQuestions(examId, ordered);
  return ordered;
}

// ─── Schedules CRUD ────────────────────────────────────────────────────────
// `exam` / `solveClass` / `lecture` are the printed labels the public routine
// shows; `examId` / `solveClassVideoId` / `lectureVideoId` are what the admin
// picker actually stores (null = "No exam" / "No class").

let MOCK_SCHEDULES = [
  { id: 's-1', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', date: '2026-06-20', time: '14:30', dateTime: '20 Jun 2026, Saturday\n02:30 PM', examId: null, exam: 'NO EXAM', solveClassVideoId: null, solveClass: 'NO CLASS', lectureVideoId: 'v-1', lecture: 'Orientation Program For FCPS Mid-Term Surgery Regular Batch-2 December\'26' },
  { id: 's-2', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', date: '2026-06-20', time: '14:30', dateTime: '20 Jun 2026, Saturday\n02:30 PM', examId: null, exam: 'NO EXAM', solveClassVideoId: null, solveClass: 'NO CLASS', lectureVideoId: 'v-5', lecture: "Renal System Live class Dec'26" },
  { id: 's-3', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', date: '2026-06-27', time: '14:30', dateTime: '27 Jun 2026, Saturday\n02:30 PM', examId: 'ex-4', exam: 'FCPS Part-1 — MTF Practice Set 08', solveClassVideoId: 'v-5', solveClass: "Renal System Live class Dec'26", lectureVideoId: 'v-6', lecture: "Body fluid, Electrolytes, Acid Base Balance Live class Dec'26" },
  { id: 's-4', courseId: 'c-2', courseName: 'FCPS Part-2 Surgery — Clinical Intensive', date: '2026-07-02', time: '16:00', dateTime: '02 Jul 2026, Thursday\n04:00 PM', examId: null, exam: 'NO EXAM', solveClassVideoId: null, solveClass: 'NO CLASS', lectureVideoId: 'v-4', lecture: 'FCPS Mid-Term Surgery Regular Batch December\'26, Lecture: Basic Principle of Surgery-1 (Chapter-1, 2, 3)' },
  { id: 's-5', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', date: '2026-07-04', time: '14:30', dateTime: '04 Jul 2026, Saturday\n02:30 PM', examId: 'ex-2', exam: 'FCPS Part-1 — SBA Practice Set 05', solveClassVideoId: 'v-6', solveClass: "Body fluid, Electrolytes, Acid Base Balance Live class Dec'26", lectureVideoId: 'v-8', lecture: "Cell Injury & Adaptation Live class Dec'26" },
  { id: 's-6', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', date: '2026-07-07', time: '14:30', dateTime: '07 Jul 2026, Tuesday\n02:30 PM', examId: 'ex-1', exam: 'FCPS Part-1 — Weekly SBA Exam 14', solveClassVideoId: null, solveClass: 'NO CLASS', lectureVideoId: null, lecture: 'NO CLASS' },
  { id: 's-8', courseId: 'c-3', courseName: 'BCS (Health) Cadre — Full Preparation', date: '2026-07-18', time: '14:30', dateTime: '18 Jul 2026, Saturday\n02:30 PM', examId: 'ex-7', exam: 'BCS Health — Model Test 13', solveClassVideoId: 'v-7', solveClass: "Respiratory & General Physiology Live class Dec'26", lectureVideoId: 'v-7', lecture: "Respiratory & General Physiology Live class Dec'26" },
];

/** @param {{ courseId?: string }} [filters] */
export async function fetchAdminSchedules({ courseId } = {}) {
  await sleep(400);
  const rows = courseId ? MOCK_SCHEDULES.filter((s) => s.courseId === courseId) : [...MOCK_SCHEDULES];
  return rows.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

export async function createScheduleEntry(entry) {
  await sleep(500);
  const course = MOCK_COURSES.find((c) => c.id === entry.courseId);
  const newEntry = { ...entry, courseName: course?.title ?? entry.courseName, id: `s-${Date.now()}` };
  MOCK_SCHEDULES = [newEntry, ...MOCK_SCHEDULES];
  return newEntry;
}

export async function updateScheduleEntry({ id, ...updates }) {
  await sleep(400);
  MOCK_SCHEDULES = MOCK_SCHEDULES.map((s) => (s.id === id ? { ...s, ...updates } : s));
  return MOCK_SCHEDULES.find((s) => s.id === id);
}

export async function deleteScheduleEntry(id) {
  await sleep(300);
  MOCK_SCHEDULES = MOCK_SCHEDULES.filter((s) => s.id !== id);
  return { ok: true };
}
