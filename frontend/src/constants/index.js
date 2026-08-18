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

/**
 * Batch groups — the second level under the three fixed categories, and the
 * cards a visitor picks from on the Batches landing page. `category` keeps each
 * group tied to one of COURSE_CATEGORIES so the existing /courses/:category
 * routing keeps working unchanged.
 *
 * TODO: source from GET /batch-groups once the backend exists. The list below
 * mirrors the tracks CPR currently runs — confirm with the client before launch.
 */
export const BATCH_GROUPS = Object.freeze([
  { id: 'fcps-p1-medicine', label: 'FCPS P-I Medicine', category: 'FCPS' },
  { id: 'fcps-p1-surgery', label: 'FCPS P-I Surgery', category: 'FCPS' },
  { id: 'fcps-p1-paediatrics', label: 'FCPS P-I Paediatrics', category: 'FCPS' },
  { id: 'fcps-p1-obs-gynae', label: 'FCPS P-I Obs & Gynae', category: 'FCPS' },
  {
    id: 'fcps-p1-foundation',
    label: 'FCPS P-I Foundation',
    note: '(Radiology, Dermatology, Anesthesia, EYE, ENT, PMR, Psychiatry, Radiotherapy, Patho, Micro, CM, Haemato)',
    category: 'FCPS',
  },
  { id: 'residency', label: 'Residency', category: 'FCPS' },
  { id: 'mphil-diploma', label: 'M.Phil & Diploma', category: 'FCPS' },
  { id: 'mph', label: 'MPH', category: 'FCPS' },
  { id: 'combined', label: 'Combined', category: 'FCPS' },
  {
    id: 'outlier',
    label: 'Outlier',
    note: '(MRCP, CS, COG, CPCH)',
    category: 'FCPS',
  },
  { id: 'bmdc-licensing', label: 'BMDC Licensing', category: 'MBBS' },
]);

/** Sidebar facet — the shape of a batch, independent of its subject. */
export const BATCH_TYPES = Object.freeze([
  { id: 'foundation-core', label: 'Foundation Core Batch' },
  { id: 'foundation', label: 'Foundation Batch' },
  { id: 'online-live', label: 'Online Live Batch' },
  { id: 'clinical', label: "Baily & Love's Pearl Batch/Clinical Batch" },
  { id: 'friday-mega', label: 'Friday Mega Batch' },
  { id: 'sba', label: 'SBA Batch' },
  { id: 'exam-plus', label: 'Exam Plus Batch' },
  { id: 'exam', label: 'Exam Batch' },
  { id: 'crash', label: 'Crash Batch' },
  { id: 'recovery', label: 'Recovery Batch' },
  { id: 'mock-plus', label: 'Mock Plus Batch' },
  { id: 'mock', label: 'Mock Batch' },
]);

/** Sidebar facet — which examination sitting the batch is aimed at. */
export const BATCH_SESSIONS = Object.freeze([
  { id: 'jan-26-p1', label: "Jan'26 P-1 Candidate" },
  { id: 'jul-26-p1', label: "Jul'26 P-1 Candidate" },
  { id: 'dec-26-p1', label: "Dec'26 P-1 Candidate" },
]);

/** Sidebar facet — delivery mode. */
export const BATCH_BRANCHES = Object.freeze([
  { id: 'online', label: 'Online' },
  { id: 'offline', label: 'Offline' },
]);

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
