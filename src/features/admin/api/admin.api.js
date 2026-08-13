import { ACCOUNT_STATUS } from '@/constants';
import { sleep } from '@/lib/utils';
// import apiClient from '@/lib/api-client';

/**
 * Admin data, mocked.
 * TODO: GET /admin/stats, /admin/students, PATCH /admin/students/:id/status,
 * GET /admin/courses, GET /admin/reports.
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
