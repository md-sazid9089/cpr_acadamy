import { createBrowserRouter, Navigate } from 'react-router-dom';

import PublicLayout from '@/components/layout/PublicLayout.jsx';
import DashboardLayout from '@/components/layout/DashboardLayout.jsx';
import ProtectedRoute from '@/features/auth/ProtectedRoute.jsx';
import { ROLES } from '@/constants';

// Marketing
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

// Auth
import Login from '@/features/auth/Login.jsx';
import Register from '@/features/auth/Register.jsx';
import VerifyOtp from '@/features/auth/VerifyOtp.jsx';
import PendingApproval from '@/features/auth/PendingApproval.jsx';
import ForgotPassword from '@/features/auth/ForgotPassword.jsx';
import ResetPassword from '@/features/auth/ResetPassword.jsx';

// Student dashboard
import Overview from '@/features/student-dashboard/Overview.jsx';
import MyCourses from '@/features/student-dashboard/MyCourses.jsx';
import Progress from '@/features/student-dashboard/Progress.jsx';
import UpcomingExams from '@/features/student-dashboard/UpcomingExams.jsx';
import PaymentHistory from '@/features/student-dashboard/PaymentHistory.jsx';
import Subscriptions from '@/features/student-dashboard/Subscriptions.jsx';
import SubscriptionDetail from '@/features/student-dashboard/SubscriptionDetail.jsx';
import AddSubscription from '@/features/student-dashboard/AddSubscription.jsx';
import MyAccount from '@/features/student-dashboard/MyAccount.jsx';
import Complaints from '@/features/student-dashboard/Complaints.jsx';
import ComplaintDetail from '@/features/student-dashboard/ComplaintDetail.jsx';

// Course player
import CoursePlayer from '@/pages/CoursePlayer.jsx';

// Learning, exams, payments
import LessonPlayer from '@/features/learning/LessonPlayer.jsx';
import ExamRunner from '@/features/exams/ExamRunner.jsx';
import ExamResult from '@/features/exams/ExamResult.jsx';
import Checkout from '@/features/payments/Checkout.jsx';
import Invoice from '@/features/payments/Invoice.jsx';

// Admin
import AdminOverview from '@/features/admin/AdminOverview.jsx';
import AdminStudents from '@/features/admin/AdminStudents.jsx';
import AdminCourses from '@/features/admin/AdminCourses.jsx';
import AdminReports from '@/features/admin/AdminReports.jsx';

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

      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/verify-otp', element: <VerifyOtp /> },
      { path: '/pending-approval', element: <PendingApproval /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },

      { path: '*', element: <NotFound /> },
    ],
  },

  // Full-bleed course player: the public chrome would only compete with the
  // lesson, so it sits outside PublicLayout with its own auth guard.
  {
    path: '/learn/:courseSlug/:lessonId',
    element: (
      <ProtectedRoute role={ROLES.STUDENT}>
        <CoursePlayer />
      </ProtectedRoute>
    ),
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
      { index: true, element: <Overview /> },
      { path: 'courses', element: <MyCourses /> },
      { path: 'progress', element: <Progress /> },
      { path: 'exams', element: <UpcomingExams /> },
      { path: 'exams/:examId', element: <ExamRunner /> },
      { path: 'exams/:examId/result', element: <ExamResult /> },
      { path: 'learn/:slug', element: <LessonPlayer /> },
      { path: 'payments', element: <PaymentHistory /> },
      { path: 'account', element: <MyAccount /> },
      { path: 'complaints', element: <Complaints /> },
      { path: 'complaints/:complaintId', element: <ComplaintDetail /> },
      { path: 'subscriptions', element: <Subscriptions /> },
      { path: 'subscriptions/:batchId', element: <SubscriptionDetail /> },
      { path: 'subscriptions/:batchId/add', element: <AddSubscription /> },
      { path: 'checkout/:slug', element: <Checkout /> },
      { path: 'invoices/:invoiceId', element: <Invoice /> },
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
      { index: true, element: <AdminOverview /> },
      { path: 'students', element: <AdminStudents /> },
      { path: 'courses', element: <AdminCourses /> },
      { path: 'reports', element: <AdminReports /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
]);

export default router;
