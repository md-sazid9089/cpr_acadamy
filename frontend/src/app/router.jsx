import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';

import PublicLayout from '@/components/layout/PublicLayout.jsx';
import DashboardLayout from '@/components/layout/DashboardLayout.jsx';
import ProtectedRoute from '@/features/auth/ProtectedRoute.jsx';
// Straight from the module, not the barrel: importing from '@/components/ui'
// pulls every primitive it re-exports into whichever chunk does the importing,
// and this file is the entry chunk.
import { PageSpinner } from '@/components/ui/Spinner.jsx';
import { ROLES } from '@/constants';

// Marketing pages stay in the entry chunk: they are what a first-time visitor
// lands on, so splitting them would only add a round trip before first paint.
import Home from '@/features/marketing/Home.jsx';
import FAQ from '@/features/marketing/FAQ.jsx';
import Gallery from '@/features/marketing/Gallery.jsx';
import About from '@/features/marketing/About.jsx';
import NotFound from '@/features/marketing/NotFound.jsx';

// Courses & Batches
import CourseList from '@/features/courses/CourseList.jsx';
import CourseDetail from '@/features/courses/CourseDetail.jsx';
import CourseSchedule from '@/features/courses/CourseSchedule.jsx';
import Batches from '@/features/courses/Batches.jsx';

// Contact is the one marketing page carrying a validated form, so it is the
// only thing that pulled zod and react-hook-form — about 85 KB — into the entry
// chunk that every visitor downloads. Split out, that cost falls on the people
// who actually open it.
const Contact = lazy(() => import('@/features/marketing/Contact.jsx'));

// Everything below is behind a click — auth, the dashboards, the player — so it
// is code-split and fetched only when the route is actually visited.
const Login = lazy(() => import('@/features/auth/Login.jsx'));
const Register = lazy(() => import('@/features/auth/Register.jsx'));
const VerifyOtp = lazy(() => import('@/features/auth/VerifyOtp.jsx'));
const PendingApproval = lazy(() => import('@/features/auth/PendingApproval.jsx'));
const ForgotPassword = lazy(() => import('@/features/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('@/features/auth/ResetPassword.jsx'));

// Student dashboard
const Overview = lazy(() => import('@/features/student-dashboard/Overview.jsx'));
const MyCourses = lazy(() => import('@/features/student-dashboard/MyCourses.jsx'));
const Progress = lazy(() => import('@/features/student-dashboard/Progress.jsx'));
const UpcomingExams = lazy(() => import('@/features/student-dashboard/UpcomingExams.jsx'));
const Notices = lazy(() => import('@/features/student-dashboard/Notices.jsx'));
const PaymentHistory = lazy(() => import('@/features/student-dashboard/PaymentHistory.jsx'));
const Subscriptions = lazy(() => import('@/features/student-dashboard/Subscriptions.jsx'));
const SubscriptionDetail = lazy(() => import('@/features/student-dashboard/SubscriptionDetail.jsx'));
const AddSubscription = lazy(() => import('@/features/student-dashboard/AddSubscription.jsx'));
const MyAccount = lazy(() => import('@/features/student-dashboard/MyAccount.jsx'));
const Complaints = lazy(() => import('@/features/student-dashboard/Complaints.jsx'));
const ComplaintDetail = lazy(() => import('@/features/student-dashboard/ComplaintDetail.jsx'));

// Course hub & player
const CourseHub = lazy(() => import('@/features/course-hub/CourseHub.jsx'));
const CoursePlayer = lazy(() => import('@/pages/CoursePlayer.jsx'));

// Exams, payments
const ExamRunner = lazy(() => import('@/features/exams/ExamRunner.jsx'));
const ExamResult = lazy(() => import('@/features/exams/ExamResult.jsx'));
const ExamPositions = lazy(() => import('@/features/exams/ExamPositions.jsx'));
const Checkout = lazy(() => import('@/features/payments/Checkout.jsx'));
const Invoice = lazy(() => import('@/features/payments/Invoice.jsx'));

// Admin
const AdminOverview = lazy(() => import('@/features/admin/AdminOverview.jsx'));
const AdminStudents = lazy(() => import('@/features/admin/AdminStudents.jsx'));
const AdminStudentDetail = lazy(() => import('@/features/admin/AdminStudentDetail.jsx'));
const AdminCourses = lazy(() => import('@/features/admin/AdminCourses.jsx'));
const AdminRevenue = lazy(() => import('@/features/admin/AdminRevenue.jsx'));
const AdminReports = lazy(() => import('@/features/admin/AdminReports.jsx'));
const AdminComplaints = lazy(() => import('@/features/admin/AdminComplaints.jsx'));
const AdminNotices = lazy(() => import('@/features/admin/AdminNotices.jsx'));
// One course, built from tabs. Videos, exams and the routine hang off the course
// so the admin never picks "which course?" from a dropdown.
const CourseShell = lazy(() => import('@/features/admin/courses/CourseShell.jsx'));
const CourseDetailTab = lazy(() => import('@/features/admin/courses/CourseDetailTab.jsx'));
const CourseVideosTab = lazy(() => import('@/features/admin/courses/CourseVideosTab.jsx'));
const CourseExamsTab = lazy(() => import('@/features/admin/courses/CourseExamsTab.jsx'));
const ExamBuilder = lazy(() => import('@/features/admin/courses/ExamBuilder.jsx'));
const CourseScheduleTab = lazy(() => import('@/features/admin/courses/CourseScheduleTab.jsx'));

/**
 * Wraps a lazily-imported page in its own Suspense boundary so only the routed
 * page falls back to the spinner — the surrounding layout stays on screen.
 */
function suspend(element) {
  return <Suspense fallback={<PageSpinner />}>{element}</Suspense>;
}

/** Former module-based lesson list; classes now live on the course hub. */
function LearnRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/dashboard/course/${slug}`} replace />;
}

/**
 * Route table.
 *
 * Public pages render inside PublicLayout (announcement strip, navbar, footer,
 * chat bubble). /dashboard/* and /admin/* sit behind ProtectedRoute, which also
 * enforces the admin-approval gate before either shell mounts.
 */
const router = createBrowserRouter([
  ...(import.meta.env.DEV ? [{
    path: '/demo/exam-positions',
    element: <DashboardLayout variant={ROLES.STUDENT} />,
    children: [{ index: true, element: suspend(<ExamPositions demo />) }],
  }] : []),
  {
    element: <PublicLayout />,
    errorElement: <NotFound />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/courses', element: <CourseList /> },
      { path: '/courses/:category', element: <CourseList /> },
      { path: '/courses/:category/:slug', element: <CourseDetail /> },
      { path: '/courses/:category/:slug/schedule', element: <CourseSchedule /> },
      { path: '/schedule', element: <CourseSchedule /> },
      { path: '/batches', element: <Batches /> },
      { path: '/faq', element: <FAQ /> },
      { path: '/gallery', element: <Gallery /> },
      { path: '/about', element: <About /> },
      { path: '/contact', element: suspend(<Contact />) },

      { path: '/login', element: suspend(<Login />) },
      { path: '/register', element: suspend(<Register />) },
      { path: '/verify-otp', element: suspend(<VerifyOtp />) },
      { path: '/pending-approval', element: suspend(<PendingApproval />) },
      { path: '/forgot-password', element: suspend(<ForgotPassword />) },
      { path: '/reset-password', element: suspend(<ResetPassword />) },

      { path: '*', element: <NotFound /> },
    ],
  },

  // Full-bleed course player: the public chrome would only compete with the
  // lesson, so it sits outside PublicLayout with its own auth guard.
  {
    path: '/learn/:courseSlug/:lessonId',
    element: <ProtectedRoute role={ROLES.STUDENT}>{suspend(<CoursePlayer />)}</ProtectedRoute>,
    errorElement: <NotFound />,
  },

  {
    path: '/dashboard',
    element: (
      <ProtectedRoute role={ROLES.STUDENT}>
        <DashboardLayout variant={ROLES.STUDENT} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: suspend(<Overview />) },
      { path: 'courses', element: suspend(<MyCourses />) },
      { path: 'progress', element: suspend(<Progress />) },
      { path: 'course/:slug', element: suspend(<CourseHub />) },
      { path: 'exams', element: suspend(<UpcomingExams />) },
      { path: 'exam-positions', element: suspend(<ExamPositions />) },
      { path: 'exams/:examId', element: suspend(<ExamRunner />) },
      { path: 'exams/:examId/result', element: suspend(<ExamResult />) },
      { path: 'learn/:slug', element: <LearnRedirect /> },
      { path: 'notice', element: suspend(<Notices />) },
      { path: 'payments', element: suspend(<PaymentHistory />) },
      { path: 'account', element: suspend(<MyAccount />) },
      { path: 'complaints', element: suspend(<Complaints />) },
      { path: 'complaints/:complaintId', element: suspend(<ComplaintDetail />) },
      { path: 'subscriptions', element: suspend(<Subscriptions />) },
      { path: 'subscriptions/:batchId', element: suspend(<SubscriptionDetail />) },
      { path: 'subscriptions/:batchId/add', element: suspend(<AddSubscription />) },
      { path: 'checkout/:slug', element: suspend(<Checkout />) },
      { path: 'invoices/:invoiceId', element: suspend(<Invoice />) },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },

  {
    path: '/admin',
    element: (
      <ProtectedRoute role={ROLES.ADMIN}>
        <DashboardLayout variant={ROLES.ADMIN} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: suspend(<AdminOverview />) },
      { path: 'students', element: suspend(<AdminStudents />) },
      { path: 'students/:studentId', element: suspend(<AdminStudentDetail />) },
      { path: 'complaints', element: suspend(<AdminComplaints />) },
      { path: 'notices', element: suspend(<AdminNotices />) },
      { path: 'courses', element: suspend(<AdminCourses />) },
      {
        path: 'courses/:id',
        element: suspend(<CourseShell />),
        children: [
          { index: true, element: <Navigate to="detail" replace /> },
          { path: 'detail', element: suspend(<CourseDetailTab />) },
          { path: 'videos', element: suspend(<CourseVideosTab />) },
          { path: 'exams', element: suspend(<CourseExamsTab />) },
          { path: 'exams/:examId', element: suspend(<ExamBuilder />) },
          { path: 'schedule', element: suspend(<CourseScheduleTab />) },
          { path: '*', element: <Navigate to="detail" replace /> },
        ],
      },
      // Former top-level pages; anything bookmarked lands on the course list.
      { path: 'videos', element: <Navigate to="/admin/courses" replace /> },
      { path: 'exams', element: <Navigate to="/admin/courses" replace /> },
      { path: 'schedules', element: <Navigate to="/admin/courses" replace /> },
      { path: 'revenue', element: suspend(<AdminRevenue />) },
      { path: 'reports', element: suspend(<AdminReports />) },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
]);

export default router;
