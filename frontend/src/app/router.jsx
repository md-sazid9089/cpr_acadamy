import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import PublicLayout from '@/components/layout/PublicLayout.jsx';
import DashboardLayout from '@/components/layout/DashboardLayout.jsx';
import ProtectedRoute from '@/features/auth/ProtectedRoute.jsx';
import { PageSpinner } from '@/components/ui';
import { ROLES } from '@/constants';

// Marketing pages stay in the entry chunk: they are what a first-time visitor
// lands on, so splitting them would only add a round trip before first paint.
import Home from '@/features/marketing/Home.jsx';
import FAQ from '@/features/marketing/FAQ.jsx';
import Contact from '@/features/marketing/Contact.jsx';
import ClassRoutine from '@/features/marketing/ClassRoutine.jsx';
import Gallery from '@/features/marketing/Gallery.jsx';
import About from '@/features/marketing/About.jsx';
import NotFound from '@/features/marketing/NotFound.jsx';

// Courses & Batches
import CourseList from '@/features/courses/CourseList.jsx';
import CourseDetail from '@/features/courses/CourseDetail.jsx';
import CourseSchedule from '@/features/courses/CourseSchedule.jsx';
import Batches from '@/features/courses/Batches.jsx';

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
const PaymentHistory = lazy(() => import('@/features/student-dashboard/PaymentHistory.jsx'));
const Subscriptions = lazy(() => import('@/features/student-dashboard/Subscriptions.jsx'));
const SubscriptionDetail = lazy(() => import('@/features/student-dashboard/SubscriptionDetail.jsx'));
const AddSubscription = lazy(() => import('@/features/student-dashboard/AddSubscription.jsx'));
const MyAccount = lazy(() => import('@/features/student-dashboard/MyAccount.jsx'));
const Complaints = lazy(() => import('@/features/student-dashboard/Complaints.jsx'));
const ComplaintDetail = lazy(() => import('@/features/student-dashboard/ComplaintDetail.jsx'));

// Course player
const CoursePlayer = lazy(() => import('@/pages/CoursePlayer.jsx'));

// Learning, exams, payments
const LessonPlayer = lazy(() => import('@/features/learning/LessonPlayer.jsx'));
const ExamRunner = lazy(() => import('@/features/exams/ExamRunner.jsx'));
const ExamResult = lazy(() => import('@/features/exams/ExamResult.jsx'));
const Checkout = lazy(() => import('@/features/payments/Checkout.jsx'));
const Invoice = lazy(() => import('@/features/payments/Invoice.jsx'));

// Admin
const AdminOverview = lazy(() => import('@/features/admin/AdminOverview.jsx'));
const AdminStudents = lazy(() => import('@/features/admin/AdminStudents.jsx'));
const AdminCourses = lazy(() => import('@/features/admin/AdminCourses.jsx'));
const AdminReports = lazy(() => import('@/features/admin/AdminReports.jsx'));

/**
 * Wraps a lazily-imported page in its own Suspense boundary so only the routed
 * page falls back to the spinner — the surrounding layout stays on screen.
 */
function suspend(element) {
  return <Suspense fallback={<PageSpinner />}>{element}</Suspense>;
}

/**
 * Route table.
 *
 * Public pages render inside PublicLayout (announcement strip, navbar, footer,
 * chat bubble). /dashboard/* and /admin/* sit behind ProtectedRoute, which also
 * enforces the admin-approval gate before either shell mounts.
 */
export const router = createBrowserRouter([
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
      { path: '/class', element: <ClassRoutine /> },
      { path: '/faq', element: <FAQ /> },
      { path: '/gallery', element: <Gallery /> },
      { path: '/about', element: <About /> },
      { path: '/contact', element: <Contact /> },

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
      { path: 'exams', element: suspend(<UpcomingExams />) },
      { path: 'exams/:examId', element: suspend(<ExamRunner />) },
      { path: 'exams/:examId/result', element: suspend(<ExamResult />) },
      { path: 'learn/:slug', element: suspend(<LessonPlayer />) },
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
      { path: 'courses', element: suspend(<AdminCourses />) },
      { path: 'reports', element: suspend(<AdminReports />) },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
]);

export default router;
