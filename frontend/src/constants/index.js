/**
 * Application-wide constants. Keep every magic string that crosses a module
 * boundary in here so the backend contract lives in one place.
 */

export const ROLES = Object.freeze({
  STUDENT: 'student',
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
});

export const COURSE_CATEGORIES = Object.freeze(['FCPS', 'BCS', 'MBBS']);

export const CATEGORY_LABELS = Object.freeze({
  FCPS: 'FCPS Part-1 & Part-2',
  BCS: 'BCS (Health) Preparation',
  MBBS: 'MBBS Professional',
});

/** Category slug as it appears in `/courses/:category`. */
export const CATEGORY_SLUGS = Object.freeze({
  FCPS: 'fcps',
  BCS: 'bcs',
  MBBS: 'mbbs',
});

export const EXAM_TYPES = Object.freeze({
  LIVE: 'live',
  MOCK: 'mock',
  PRACTICE: 'practice',
});

export const QUESTION_TYPES = Object.freeze({
  /** Single Best Answer — one correct option out of five. */
  SBA: 'sba',
  /** Multiple True/False — five independent true-or-false stems. */
  MTF: 'mtf',
});

export const EXAM_STATUS = Object.freeze({
  UPCOMING: 'upcoming',
  RUNNING: 'running',
  SUBMITTED: 'submitted',
  MISSED: 'missed',
  PUBLISHED: 'published',
});

export const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  PENDING_PAYMENT: 'pending_payment',
  EXPIRED: 'expired',
});

export const PAYMENT_STATUS = Object.freeze({
  PAID: 'paid',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

export const PAYMENT_METHODS = Object.freeze([
  { id: 'bkash', label: 'bKash' },
  { id: 'nagad', label: 'Nagad' },
  { id: 'rocket', label: 'Rocket' },
  { id: 'card', label: 'Card / Bank' },
]);

/** Lifecycle of a signup, mobile-first with an admin gate at the end. */
export const ACCOUNT_STATUS = Object.freeze({
  OTP_PENDING: 'otp_pending',
  AWAITING_APPROVAL: 'awaiting_approval',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
});

export const STORAGE_KEYS = Object.freeze({
  AUTH: 'cpr-auth',
  THEME: 'cpr-theme',
  DEVICE_ID: 'cpr-device-id',
});

/** Custom DOM event the api-client dispatches when the backend kills a session. */
export const FORCED_LOGOUT_EVENT = 'cpr:forced-logout';

export const FORCED_LOGOUT_REASONS = Object.freeze({
  ANOTHER_DEVICE: 'another_device',
  TOKEN_EXPIRED: 'token_expired',
  ACCOUNT_SUSPENDED: 'account_suspended',
});

export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 60;

export const CONTACT = Object.freeze({
  phone: '+880 1700-000000',
  whatsapp: import.meta.env?.VITE_WHATSAPP_NUMBER ?? '8801700000000',
  email: 'support@cprmedicalacademy.com',
  address: 'House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh',
  hours: 'Saturday – Thursday, 10:00 AM – 8:00 PM',
});
