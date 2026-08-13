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
      id: 'e-1',
      courseId: 'c-1',
      slug: 'fcps-part-1-medicine-january-batch',
      title: 'FCPS Part-1 Medicine — January Batch',
      category: 'FCPS',
      status: 'active',
      progress: 62,
      completedLessons: 114,
      lessonCount: 184,
      nextLesson: { id: 'l-115', title: 'Renal physiology — tubular transport' },
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
      nextLesson: { id: 'l-60', title: 'Bangladesh affairs — economy' },
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
