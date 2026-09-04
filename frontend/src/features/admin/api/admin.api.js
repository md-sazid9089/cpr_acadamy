import { ACCOUNT_STATUS, QUESTION_TYPES } from '@/constants';
import { sleep } from '@/lib/utils';
// import apiClient from '@/lib/api-client';

/**
 * Admin data, mocked.
 * TODO: GET /admin/stats, /admin/students, PATCH /admin/students/:id/status,
 * GET /admin/courses, GET /admin/reports,
 * GET/POST/PATCH/DELETE /admin/videos,
 * GET/POST/PATCH/DELETE /admin/exams,
 * GET/POST/PATCH/DELETE /admin/schedules.
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

export async function fetchStudents({ status } = {}) {
  await sleep(400);

  const students = [
    { id: 'u-11', fullName: 'Dr. Sadia Rahman', mobile: '01712345678', institution: 'Dhaka Medical College', interest: 'FCPS', status: ACCOUNT_STATUS.AWAITING_APPROVAL, createdAt: '2026-08-12T08:20:00.000Z' },
    { id: 'u-12', fullName: 'Dr. Imran Kabir', mobile: '01812345678', institution: 'Chittagong Medical College', interest: 'BCS', status: ACCOUNT_STATUS.AWAITING_APPROVAL, createdAt: '2026-08-12T11:05:00.000Z' },
    { id: 'u-13', fullName: 'Dr. Nusrat Jahan', mobile: '01912345678', institution: 'BSMMU', interest: 'FCPS', status: ACCOUNT_STATUS.ACTIVE, createdAt: '2026-06-01T09:00:00.000Z' },
    { id: 'u-14', fullName: 'Dr. Tanvir Ahmed', mobile: '01612345678', institution: 'Rajshahi Medical College', interest: 'MBBS', status: ACCOUNT_STATUS.ACTIVE, createdAt: '2026-05-18T14:30:00.000Z' },
    { id: 'u-15', fullName: 'Dr. Farhana Akter', mobile: '01512345678', institution: 'Sylhet MAG Osmani', interest: 'BCS', status: ACCOUNT_STATUS.SUSPENDED, createdAt: '2026-02-09T10:15:00.000Z' },
  ];

  return status && status !== 'ALL'
    ? students.filter((student) => student.status === status)
    : students;
}

/** @param {{ studentId: string, status: string }} args */
export async function updateStudentStatus({ studentId, status }) {
  await sleep(400);
  // TODO: PATCH /admin/students/:id/status — triggers the activation SMS.
  return { ok: true, studentId, status };
}

export async function fetchAdminCourses() {
  await sleep(400);
  return [
    { id: 'c-1', title: 'FCPS Part-1 Medicine — January Batch', category: 'FCPS', enrolled: 2140, price: 13500, isPublished: true, startsOn: '2026-01-05T00:00:00.000Z' },
    { id: 'c-2', title: 'FCPS Part-2 Surgery — Clinical Intensive', category: 'FCPS', enrolled: 640, price: 25000, isPublished: true, startsOn: '2026-02-01T00:00:00.000Z' },
    { id: 'c-3', title: 'BCS (Health) Cadre — Full Preparation', category: 'BCS', enrolled: 3820, price: 8900, isPublished: true, startsOn: '2025-10-05T00:00:00.000Z' },
    { id: 'c-4', title: 'MBBS 3rd Professional — Final Revision', category: 'MBBS', enrolled: 1560, price: 5900, isPublished: true, startsOn: '2025-11-15T00:00:00.000Z' },
    { id: 'c-7', title: 'FCPS Part-1 Paediatrics — Draft', category: 'FCPS', enrolled: 0, price: 12000, isPublished: false, startsOn: null },
  ];
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

let MOCK_VIDEOS = [
  { id: 'v-1', title: 'Orientation Program For FCPS Mid-Term Surgery Regular Batch-2 December\'26', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-07-25', scheduledTime: '04:00 PM', duration: '1h 12m', status: 'published' },
  { id: 'v-2', title: 'FCPS Mid-Term Surgery Regular Batch Dec\'26-Lecture How To Prepare For Mid-Term Surgery.', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-07-25', scheduledTime: '04:00 PM', duration: '58m', status: 'published' },
  { id: 'v-3', title: 'FCPS Mid-Term Surgery Long & Regular Batch December\'26, Lecture: Upper GIT', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-07-26', scheduledTime: '02:30 PM', duration: '1h 05m', status: 'published' },
  { id: 'v-4', title: 'FCPS Mid-Term Surgery Regular Batch December\'26, Lecture: Basic Principle of Surgery-1 (Chapter-1, 2, 3)', courseId: 'c-2', courseName: 'FCPS Part-2 Surgery — Clinical Intensive', scheduledDate: '2026-07-29', scheduledTime: '02:30 PM', duration: '1h 20m', status: 'published' },
  { id: 'v-5', title: 'Renal System Live class Dec\'26', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-08-02', scheduledTime: '02:30 PM', duration: '1h 15m', status: 'published' },
  { id: 'v-6', title: 'Body fluid, Electrolytes, Acid Base Balance Live class Dec\'26', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-08-02', scheduledTime: '02:30 PM', duration: '55m', status: 'draft' },
  { id: 'v-7', title: 'Respiratory & General Physiology Live class Dec\'26', courseId: 'c-3', courseName: 'BCS (Health) Cadre — Full Preparation', scheduledDate: '2026-08-09', scheduledTime: '02:30 PM', duration: '1h 10m', status: 'published' },
  { id: 'v-8', title: 'Cell Injury & Adaptation Live class Dec\'26', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', scheduledDate: '2026-08-16', scheduledTime: '02:30 PM', duration: '1h 05m', status: 'draft' },
];

export async function fetchAdminVideos({ status } = {}) {
  await sleep(400);
  if (status && status !== 'ALL') {
    return MOCK_VIDEOS.filter((v) => v.status === status);
  }
  return [...MOCK_VIDEOS];
}

export async function createVideo(video) {
  await sleep(500);
  const newVideo = { ...video, id: `v-${Date.now()}` };
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

let MOCK_EXAMS = [
  { id: 'ex-1', title: 'FCPS Part-1 — Weekly SBA Exam 14', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', type: QUESTION_TYPES.SBA, scheduledAt: '2026-09-15T14:00:00.000Z', durationMinutes: 60, questionCount: 50, totalMarks: 50, status: 'upcoming' },
  { id: 'ex-2', title: 'FCPS Part-1 — SBA Practice Set 05', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', type: QUESTION_TYPES.SBA, scheduledAt: '2026-09-10T10:00:00.000Z', durationMinutes: 45, questionCount: 25, totalMarks: 25, status: 'running' },
  { id: 'ex-3', title: 'FCPS Part-1 — Weekly SBA Exam 13', courseId: 'c-2', courseName: 'FCPS Part-2 Surgery — Clinical Intensive', type: QUESTION_TYPES.SBA, scheduledAt: '2026-09-06T14:00:00.000Z', durationMinutes: 60, questionCount: 50, totalMarks: 50, status: 'published' },
  { id: 'ex-4', title: 'FCPS Part-1 — MTF Practice Set 08', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', type: QUESTION_TYPES.MTF, scheduledAt: '2026-09-13T10:00:00.000Z', durationMinutes: 45, questionCount: 25, totalMarks: 125, status: 'running' },
  { id: 'ex-5', title: 'FCPS Part-1 — Weekly MCQ Exam 12', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', type: QUESTION_TYPES.MTF, scheduledAt: '2026-09-20T14:00:00.000Z', durationMinutes: 60, questionCount: 50, totalMarks: 250, status: 'upcoming' },
  { id: 'ex-6', title: 'Renal System — True/False Assessment', courseId: 'c-3', courseName: 'BCS (Health) Cadre — Full Preparation', type: QUESTION_TYPES.MTF, scheduledAt: '2026-09-01T10:00:00.000Z', durationMinutes: 30, questionCount: 20, totalMarks: 100, status: 'published' },
  { id: 'ex-7', title: 'BCS Health — Model Test 13', courseId: 'c-3', courseName: 'BCS (Health) Cadre — Full Preparation', type: QUESTION_TYPES.SBA, scheduledAt: '2026-08-17T15:30:00.000Z', durationMinutes: 90, questionCount: 100, totalMarks: 100, status: 'published' },
];

export async function fetchAdminExams({ type } = {}) {
  await sleep(400);
  if (type && type !== 'ALL') {
    return MOCK_EXAMS.filter((e) => e.type === type);
  }
  return [...MOCK_EXAMS];
}

export async function createExam(exam) {
  await sleep(500);
  const newExam = { ...exam, id: `ex-${Date.now()}` };
  MOCK_EXAMS = [newExam, ...MOCK_EXAMS];
  return newExam;
}

export async function updateExam({ id, ...updates }) {
  await sleep(400);
  MOCK_EXAMS = MOCK_EXAMS.map((e) => (e.id === id ? { ...e, ...updates } : e));
  return MOCK_EXAMS.find((e) => e.id === id);
}

export async function deleteExam(id) {
  await sleep(300);
  MOCK_EXAMS = MOCK_EXAMS.filter((e) => e.id !== id);
  return { ok: true };
}

// ─── Schedules CRUD ────────────────────────────────────────────────────────

let MOCK_SCHEDULES = [
  { id: 's-1', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', dateTime: '20 Jun 2026, Saturday\n02:30 PM', exam: 'NO EXAM', solveClass: 'NO CLASS', lecture: 'Orientation Program' },
  { id: 's-2', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', dateTime: '20 Jun 2026, Saturday\n02:30 PM', exam: 'NO EXAM', solveClass: 'NO CLASS', lecture: "Renal System Live class Dec'26" },
  { id: 's-3', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', dateTime: '27 Jun 2026, Saturday\n02:30 PM', exam: 'Renal System (Regular Exam)', solveClass: 'Renal System (Regular Solve Class)', lecture: "Body fluid, Electrolytes, Acid Base Balance Live class Dec'26" },
  { id: 's-4', courseId: 'c-2', courseName: 'FCPS Part-2 Surgery — Clinical Intensive', dateTime: '02 Jul 2026, Thursday\n04:00 PM', exam: 'NO EXAM', solveClass: 'NO CLASS', lecture: "Principle of Surgery-I: [Chapter 1-5] (Bailey & Love's Regular Online Live Lecture)" },
  { id: 's-5', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', dateTime: '04 Jul 2026, Saturday\n02:30 PM', exam: 'Body Fluid, Electrolytes, Acid Base Balance (Regular Exam)', solveClass: 'Body Fluid, Electrolytes, Acid Base Balance (Regular Solve Class)', lecture: "Respiratory & General Physiology Live class Dec'26" },
  { id: 's-6', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', dateTime: '07 Jul 2026, Tuesday\n02:30 PM', exam: 'NO EXAM', solveClass: 'NO CLASS', lecture: "Cell Injury & Adaptation Live class Dec'26 (2)" },
  { id: 's-7', courseId: 'c-1', courseName: 'FCPS Part-1 Medicine — January Batch', dateTime: '11 Jul 2026, Saturday\n02:30 PM', exam: 'Respiratory & General Physiology (Regular Exam)', solveClass: 'Respiratory & General Physiology (Regular Solve Class)', lecture: "Cardiovascular System & Shock Live class Dec'26" },
  { id: 's-8', courseId: 'c-3', courseName: 'BCS (Health) Cadre — Full Preparation', dateTime: '18 Jul 2026, Saturday\n02:30 PM', exam: 'Cardiovascular System (Regular Exam)', solveClass: 'Cardiovascular System (Regular Solve Class)', lecture: "Gastrointestinal System & Nutrition Live class Dec'26" },
];

export async function fetchAdminSchedules() {
  await sleep(400);
  return [...MOCK_SCHEDULES];
}

export async function createScheduleEntry(entry) {
  await sleep(500);
  const newEntry = { ...entry, id: `s-${Date.now()}` };
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

/** Course options for dropdown selectors in admin forms. */
export async function fetchCourseOptions() {
  await sleep(200);
  return [
    { id: 'c-1', title: 'FCPS Part-1 Medicine — January Batch' },
    { id: 'c-2', title: 'FCPS Part-2 Surgery — Clinical Intensive' },
    { id: 'c-3', title: 'BCS (Health) Cadre — Full Preparation' },
    { id: 'c-4', title: 'MBBS 3rd Professional — Final Revision' },
  ];
}
