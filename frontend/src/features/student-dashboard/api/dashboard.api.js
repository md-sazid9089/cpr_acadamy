import { sleep } from '@/lib/utils';
// import apiClient from '@/lib/api-client';

/**
 * Student dashboard data, mocked.
 * TODO: GET /me/enrollments, /me/progress, /me/exams, /me/payments.
 */

export async function fetchMyCourses() {
  await sleep(400);
  return [
    {
      // Enrolment backing the course player at /learn/:courseSlug/:lessonId.
      // The slug matches src/features/player/mock/outline.js; without it the
      // player's active-enrolment guard would bounce every visit.
      id: 'e-0',
      courseId: 'c-0',
      slug: 'fcps-p1-january-2026',
      title: 'FCPS Part-1 Foundation Batch — January 2026',
      category: 'FCPS',
      status: 'active',
      progress: 44,
      completedLessons: 14,
      lessonCount: 32,
      nextLesson: { id: 'l10', title: '1-10 Hand — Muscles & Nerve Supply' },
      expiresOn: '2026-12-31T00:00:00.000Z',
    },
    {
      id: 'e-1',
      courseId: 'c-1',
      slug: 'fcps-part-1-medicine-january-batch',
      title: 'FCPS Part-1 Medicine — January Batch',
      category: 'FCPS',
      status: 'active',
      progress: 62,
      completedLessons: 114,
      lessonCount: 184,
      // Ids must exist in the player outline (src/features/player/mock/outline.js)
      // — "Continue course" navigates straight to /learn/:slug/:lessonId.
      nextLesson: { id: 'l17', title: '2-7 Muscle Contraction — Sliding Filament' },
      expiresOn: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 'e-2',
      courseId: 'c-3',
      slug: 'bcs-health-cadre-full-preparation',
      title: 'BCS (Health) Cadre — Full Preparation',
      category: 'BCS',
      status: 'active',
      progress: 28,
      completedLessons: 59,
      lessonCount: 210,
      nextLesson: { id: 'l19', title: '3-1 Carbohydrate Metabolism — Overview' },
      expiresOn: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'e-3',
      courseId: 'c-4',
      slug: 'mbbs-3rd-professional-medicine-final-revision',
      title: 'MBBS 3rd Professional — Final Revision',
      category: 'MBBS',
      status: 'pending_payment',
      progress: 0,
      completedLessons: 0,
      lessonCount: 128,
      nextLesson: null,
      expiresOn: null,
    },
  ];
}

export async function fetchProgressSummary() {
  await sleep(350);
  return {
    overallProgress: 45,
    lessonsCompleted: 173,
    lessonsTotal: 394,
    studyHours: 128,
    examsTaken: 24,
    averageScore: 71.5,
    bestRank: 12,
    weakTopics: [
      { topic: 'Acid–base balance', accuracy: 42 },
      { topic: 'Pharmacokinetics', accuracy: 51 },
      { topic: 'Immunology basics', accuracy: 58 },
    ],
    strongTopics: [
      { topic: 'Cardiac physiology', accuracy: 92 },
      { topic: 'Respiratory system', accuracy: 88 },
    ],
    weeklyActivity: [
      { day: 'Sat', minutes: 95 },
      { day: 'Sun', minutes: 60 },
      { day: 'Mon', minutes: 120 },
      { day: 'Tue', minutes: 45 },
      { day: 'Wed', minutes: 80 },
      { day: 'Thu', minutes: 30 },
      { day: 'Fri', minutes: 140 },
    ],
  };
}

export async function fetchUpcomingExams() {
  await sleep(350);
  return [
    {
      id: 'ex-1',
      title: 'FCPS Part-1 — Weekly SBA Exam 14',
      courseTitle: 'FCPS Part-1 Medicine',
      type: 'live',
      status: 'upcoming',
      scheduledAt: '2026-08-15T14:00:00.000Z',
      durationMinutes: 60,
      questionCount: 50,
      totalMarks: 50,
    },
    {
      id: 'ex-2',
      title: 'BCS Health — Model Test 13',
      courseTitle: 'BCS (Health) Cadre',
      type: 'mock',
      status: 'upcoming',
      scheduledAt: '2026-08-17T15:30:00.000Z',
      durationMinutes: 90,
      questionCount: 100,
      totalMarks: 100,
    },
    {
      id: 'ex-3',
      title: 'FCPS Part-1 — MTF Practice Set 08',
      courseTitle: 'FCPS Part-1 Medicine',
      type: 'practice',
      status: 'running',
      scheduledAt: '2026-08-13T10:00:00.000Z',
      durationMinutes: 45,
      questionCount: 25,
      totalMarks: 125,
    },
  ];
}

export async function fetchPaymentHistory() {
  await sleep(350);
  return [
    {
      id: 'p-1',
      invoiceNo: 'CPR-2025-001842',
      courseTitle: 'FCPS Part-1 Medicine — January Batch',
      amount: 13500,
      status: 'paid',
      method: 'bkash',
      transactionId: 'BKH8ZQ11X4',
      paidAt: '2025-12-28T09:12:00.000Z',
    },
    {
      id: 'p-2',
      invoiceNo: 'CPR-2025-002310',
      courseTitle: 'BCS (Health) Cadre — Full Preparation',
      amount: 8900,
      status: 'paid',
      method: 'nagad',
      transactionId: 'NGD5TR88K2',
      paidAt: '2025-09-30T17:40:00.000Z',
    },
    {
      id: 'p-3',
      invoiceNo: 'CPR-2026-000117',
      courseTitle: 'MBBS 3rd Professional — Final Revision',
      amount: 5900,
      status: 'pending',
      method: 'card',
      transactionId: null,
      paidAt: '2026-08-10T11:05:00.000Z',
    },
  ];
}

/**
 * Batches the student is enrolled in that can carry subscriptions.
 * TODO: GET /me/subscriptions/batches
 */
export async function fetchSubscriptionBatches() {
  await sleep(350);
  return [
    {
      id: 'sb-1',
      slug: 'fcps-part-1-medicine-january-batch',
      title: 'FCPS Part-1 Medicine — January Batch',
      regNo: '25004035',
    },
    {
      id: 'sb-2',
      slug: 'bcs-health-cadre-full-preparation',
      title: 'BCS (Health) Cadre — Full Preparation',
      regNo: '25004036',
    },
  ];
}

/**
 * Subscriptions held against one batch, already split by state so the tab bar
 * is a pure render. `previous` covers both expired and cancelled.
 *
 * TODO: GET /me/subscriptions?batchId=
 */
export async function fetchSubscriptions(batchId) {
  await sleep(350);

  const BY_BATCH = {
    'sb-1': {
      active: [
        {
          id: 'sub-1',
          name: 'Question Bank Access',
          description: 'Full BCPS past-paper bank with item analysis.',
          amount: 2500,
          startsOn: '2026-01-05T00:00:00.000Z',
          endsOn: '2026-12-03T00:00:00.000Z',
        },
        {
          id: 'sub-2',
          name: 'Recorded Lecture Archive',
          description: 'Replay every class of this batch until the exam.',
          amount: 1800,
          startsOn: '2026-01-05T00:00:00.000Z',
          endsOn: '2026-12-03T00:00:00.000Z',
        },
      ],
      unpaid: [
        {
          id: 'sub-3',
          name: 'Mock Exam Series',
          description: '24 full-length mocks with national ranking.',
          amount: 3000,
          dueOn: '2026-09-15T00:00:00.000Z',
        },
      ],
      previous: [
        {
          id: 'sub-4',
          name: 'Foundation Note Bundle (PDF)',
          description: 'Chapter-wise notes for the foundation phase.',
          amount: 1200,
          startsOn: '2025-07-01T00:00:00.000Z',
          endsOn: '2025-12-31T00:00:00.000Z',
        },
      ],
    },
    // Deliberately empty so the "No active subscription found" state is
    // reachable without editing this file.
    'sb-2': { active: [], unpaid: [], previous: [] },
  };

  return BY_BATCH[batchId] ?? { active: [], unpaid: [], previous: [] };
}

/**
 * Subscription packages a student can still buy for a batch.
 * TODO: GET /subscription-plans?batchId=
 */
export async function fetchSubscriptionPlans(batchId) {
  await sleep(300);
  return [
    {
      id: 'plan-1',
      name: 'Question Bank Access',
      durationLabel: 'Until exam date',
      amount: 2500,
      features: ['Full BCPS past-paper bank', 'Item analysis on every attempt', 'Weak-area report'],
    },
    {
      id: 'plan-2',
      name: 'Mock Exam Series',
      durationLabel: '24 exams',
      amount: 3000,
      features: ['Full-length mocks in BCPS pattern', 'National merit position', 'Discussion class after each exam'],
    },
    {
      id: 'plan-3',
      name: 'Recorded Lecture Archive',
      durationLabel: '6 months',
      amount: 1800,
      features: ['Every class of this batch', 'Download for offline viewing', 'Speed control and bookmarks'],
    },
  ];
}

/**
 * The signed-in student's account record.
 * TODO: GET /me/profile
 */
let ACCOUNT_PROFILE = {
  photoUrl: null,
  isVerified: true,
  basic: {
    name: 'Dr. Rahim Uddin',
    fatherName: 'Md Hossainul Uddin',
    bmdcNo: 'A-12345',
    medicalSession: '2011-2012',
    dateOfBirth: '1993-04-20',
    gender: '',
    bloodGroup: '',
  },
  contact: {
    mobile: '01711111111',
    email: 'rahim.uddin@example.com',
    medicalCollege: 'Dhaka Medical College, Dhaka',
    facebookId: 'Rahim Uddin',
  },
  address: {
    division: 'Chattogram',
    district: 'Chattogram',
    upazila: '',
    presentAddress: 'CMCH',
  },
};

export async function fetchAccountProfile() {
  await sleep(350);
  return structuredClone(ACCOUNT_PROFILE);
}

/**
 * Patch one section of the profile.
 * TODO: PATCH /me/profile — send only the changed section.
 *
 * @param {{ section: 'basic' | 'contact' | 'address', values: Record<string, string> }} payload
 */
export async function updateAccountProfile({ section, values }) {
  await sleep(500);
  ACCOUNT_PROFILE = {
    ...ACCOUNT_PROFILE,
    [section]: { ...ACCOUNT_PROFILE[section], ...values },
  };
  return structuredClone(ACCOUNT_PROFILE);
}

/**
 * Devices bound to this account. Single-device login means exactly one entry
 * may be verified at a time; `current` is whatever browser is asking.
 *
 * TODO: GET /me/devices — the backend identifies devices by X-Device-Id.
 */
export async function fetchDevices() {
  await sleep(350);
  return {
    verified: [
      {
        id: 'dev-1',
        label: 'Samsung Galaxy A52s 5G',
        platform: 'Android',
        browser: 'Android Browser',
        type: 'mobile',
      },
    ],
    current: {
      id: 'dev-2',
      label: 'Windows 10',
      platform: 'Windows',
      browser: 'Chrome 151.0',
      type: 'desktop',
      isVerified: false,
    },
  };
}

/**
 * Ask an administrator to move the verified device to this browser.
 * TODO: POST /me/devices/verify-request { reason }
 */
export async function requestDeviceVerification({ reason }) {
  await sleep(600);
  return { ok: true, status: 'pending_review', reason };
}

/**
 * TODO: POST /me/password { currentPassword, newPassword }
 */
export async function changePassword() {
  await sleep(600);
  return { ok: true };
}

/**
 * Support complaints ("Complain Box").
 *
 * A complaint is a thread: the student opens it, the academy replies, and it is
 * closed once resolved. `status` drives the whole UI — 'solved' locks the
 * thread and shows the closing banner.
 *
 * TODO: GET /me/complaints, GET /me/complaints/:id, POST /me/complaints,
 *       POST /me/complaints/:id/replies
 */
export const COMPLAINT_TOPICS = Object.freeze([
  'Lecture Sheet / Books',
  'Class & Schedule',
  'Exam & Result',
  'Payment & Invoice',
  'Device / Login Problem',
  'Other',
]);

let COMPLAINTS = [
  {
    id: 'cmp-1',
    relatedTo: 'Lecture Sheet / Books',
    batchTitle: 'FCPS Part-1 Medicine — January Batch',
    status: 'solved',
    createdAt: '2026-08-25T15:14:00.000Z',
    messages: [
      {
        id: 'm-1',
        from: 'student',
        body: 'Lecture sheet and accessories have not reached me yet.',
        sentAt: '2026-08-25T15:14:00.000Z',
      },
      {
        id: 'm-2',
        from: 'academy',
        body: 'Dear Doctor, your matter has been informed to the concerned department. The department will contact you. Thank you.',
        sentAt: '2026-08-25T15:20:00.000Z',
      },
      {
        id: 'm-3',
        from: 'academy',
        body: 'Dear Doctor, your problem has been solved. Thank you.',
        sentAt: '2026-08-25T15:44:00.000Z',
      },
    ],
  },
  {
    id: 'cmp-2',
    relatedTo: 'Exam & Result',
    batchTitle: 'FCPS Part-1 Medicine — January Batch',
    status: 'answered',
    createdAt: '2026-08-20T09:02:00.000Z',
    messages: [
      {
        id: 'm-4',
        from: 'student',
        body: 'My weekly exam 07 result is not showing on the dashboard.',
        sentAt: '2026-08-20T09:02:00.000Z',
      },
      {
        id: 'm-5',
        from: 'academy',
        body: 'Dear Doctor, the result is being rechecked and will be published within 24 hours.',
        sentAt: '2026-08-20T11:30:00.000Z',
      },
    ],
  },
  {
    id: 'cmp-3',
    relatedTo: 'Payment & Invoice',
    batchTitle: 'BCS (Health) Cadre — Full Preparation',
    status: 'open',
    createdAt: '2026-08-18T18:40:00.000Z',
    messages: [
      {
        id: 'm-6',
        from: 'student',
        body: 'I paid via bKash but the invoice still shows pending.',
        sentAt: '2026-08-18T18:40:00.000Z',
      },
    ],
  },
];

export async function fetchComplaints() {
  await sleep(350);
  return structuredClone(COMPLAINTS);
}

export async function fetchComplaint(id) {
  await sleep(300);
  const complaint = COMPLAINTS.find((item) => item.id === id);
  if (!complaint) {
    throw { status: 404, code: 'COMPLAINT_NOT_FOUND', message: 'This complaint could not be found.' };
  }
  return structuredClone(complaint);
}

/** @param {{ relatedTo: string, batchTitle: string, body: string }} payload */
export async function createComplaint({ relatedTo, batchTitle, body }) {
  await sleep(600);
  const complaint = {
    id: `cmp-${Date.now()}`,
    relatedTo,
    batchTitle,
    status: 'open',
    createdAt: new Date().toISOString(),
    messages: [
      { id: `m-${Date.now()}`, from: 'student', body, sentAt: new Date().toISOString() },
    ],
  };
  COMPLAINTS = [complaint, ...COMPLAINTS];
  return structuredClone(complaint);
}

/** @param {{ id: string, body: string }} payload */
export async function replyToComplaint({ id, body }) {
  await sleep(500);
  COMPLAINTS = COMPLAINTS.map((complaint) =>
    complaint.id === id
      ? {
          ...complaint,
          status: 'open',
          messages: [
            ...complaint.messages,
            { id: `m-${Date.now()}`, from: 'student', body, sentAt: new Date().toISOString() },
          ],
        }
      : complaint,
  );
  return structuredClone(COMPLAINTS.find((complaint) => complaint.id === id));
}
