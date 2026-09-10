import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BRAND = 'CPR Medical Academy';

// First match wins, so deeper paths come before their parents.
const TITLES = [
  [/^\/courses\/[^/]+\/[^/]+\/schedule/, 'Batch Schedule'],
  [/^\/courses/, 'Courses'],
  [/^\/batches/, 'Batches'],
  [/^\/schedule/, 'Batch Schedule'],
  [/^\/class/, 'Class Routine'],
  [/^\/faq/, 'FAQ'],
  [/^\/gallery/, 'Gallery'],
  [/^\/about/, 'About Us'],
  [/^\/contact/, 'Contact Us'],
  [/^\/login/, 'Sign in'],
  [/^\/register/, 'Create your account'],
  [/^\/verify-otp/, 'Verify your mobile'],
  [/^\/pending-approval/, 'Awaiting approval'],
  [/^\/forgot-password/, 'Forgot password'],
  [/^\/reset-password/, 'Reset password'],
  [/^\/dashboard\/courses/, 'My Courses'],
  [/^\/dashboard\/progress/, 'My Progress'],
  [/^\/dashboard\/course\//, 'Course'],
  [/^\/dashboard\/exams\/[^/]+\/result/, 'Exam Result'],
  [/^\/dashboard\/exams\/[^/]+/, 'Exam'],
  [/^\/dashboard\/exams/, 'My Exams'],
  [/^\/dashboard\/notice/, 'Notice'],
  [/^\/dashboard\/payments/, 'Payment History'],
  [/^\/dashboard\/account/, 'My Account'],
  [/^\/dashboard\/complaints/, 'Complain Box'],
  [/^\/dashboard\/subscriptions/, 'Subscriptions'],
  [/^\/dashboard\/checkout/, 'Checkout'],
  [/^\/dashboard\/invoices/, 'Invoice'],
  [/^\/dashboard/, 'My Dashboard'],
  [/^\/admin\/students/, 'Students'],
  [/^\/admin\/courses/, 'Courses'],
  [/^\/admin\/revenue/, 'Revenue'],
  [/^\/admin\/reports/, 'Reports'],
  [/^\/admin\/complaints/, 'Complaints'],
  [/^\/admin\/notices/, 'Notices'],
  [/^\/admin/, 'Admin'],
  [/^\/learn\//, 'Lesson'],
];

/** Keeps the browser tab title in step with the current route. */
export default function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match = TITLES.find(([pattern]) => pattern.test(pathname));
    document.title = match ? `${match[1]} · ${BRAND}` : BRAND;
  }, [pathname]);
}
