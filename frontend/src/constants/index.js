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

/**
 * Medical colleges of Bangladesh, for the registration form's institution picker.
 * Government list is well-established; the private list covers the major,
 * long-running colleges. Neither is exhaustive — the form always offers an
 * "Other" option so a student whose college is missing can type it in.
 */
export const GOVERNMENT_MEDICAL_COLLEGES_BD = Object.freeze([
  'Armed Forces Medical College, Dhaka',
  'Chandpur Medical College',
  'Chittagong Medical College',
  'Comilla Medical College',
  "Cox's Bazar Medical College",
  'Dhaka Medical College',
  'Dinajpur Medical College',
  'Faridpur Medical College',
  'Feni Medical College',
  'Jashore Medical College',
  'Jhenaidah Medical College',
  'Khulna Medical College',
  'Kushtia Medical College',
  'Magura Medical College',
  'Manikganj Medical College',
  'Mugda Medical College, Dhaka',
  'Mymensingh Medical College',
  'Naogaon Medical College',
  'Netrokona Medical College',
  'Nilphamari Medical College',
  'Noakhali Medical College',
  'Pabna Medical College',
  'Patuakhali Medical College',
  'Rajshahi Medical College',
  'Rangamati Medical College',
  'Rangpur Medical College',
  'Satkhira Medical College',
  'Shaheed M Monsur Ali Medical College, Sirajganj',
  'Shaheed Suhrawardy Medical College, Dhaka',
  'Shaheed Tajuddin Ahmad Medical College, Gazipur',
  'Shaheed Ziaur Rahman Medical College, Bogura',
  'Sheikh Hasina Medical College, Jamalpur',
  'Sheikh Hasina Medical College, Tangail',
  'Sheikh Sayera Khatun Medical College, Gopalganj',
  'Sher-e-Bangla Medical College, Barisal',
  'Sir Salimullah Medical College, Dhaka',
  'Sylhet MAG Osmani Medical College',
]);

export const PRIVATE_MEDICAL_COLLEGES_BD = Object.freeze([
  'Ad-din Women’s Medical College, Dhaka',
  'Anwer Khan Modern Medical College, Dhaka',
  'Ashiyan Medical College, Dhaka',
  'Bangladesh Medical College, Dhaka',
  'Bikrampur Bhuiyan Medical College, Munshiganj',
  'Central Medical College, Cumilla',
  'City Medical College, Gazipur',
  'Community Based Medical College, Bangladesh, Mymensingh',
  'Delta Medical College, Dhaka',
  'Dhaka National Medical College',
  'Diabetic Association Medical College, Faridpur',
  'Eastern Medical College, Cumilla',
  'Enam Medical College, Savar',
  'Gonoshasthaya Samaj Vittik Medical College, Savar',
  'Green Life Medical College, Dhaka',
  'Holy Family Red Crescent Medical College, Dhaka',
  'Ibn Sina Medical College, Dhaka',
  'Ibrahim Medical College, Dhaka',
  'International Medical College, Gazipur',
  'Jalalabad Ragib-Rabeya Medical College, Sylhet',
  'Khwaja Yunus Ali Medical College, Sirajganj',
  'Marks Medical College, Dhaka',
  'North East Medical College, Sylhet',
  'Northern Private Medical College, Rangpur',
  'Popular Medical College, Dhaka',
  'Prime Medical College, Rangpur',
  'Rangpur Community Medical College',
  'Shahabuddin Medical College, Dhaka',
  'Sylhet Women’s Medical College',
  'TMSS Medical College, Bogura',
  'Universal Medical College, Dhaka',
  'Uttara Adhunik Medical College, Dhaka',
  'Z.H. Sikder Women’s Medical College, Dhaka',
]);

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

/** Days a batch can meet on. `short` is the form the public course page prints. */
export const CLASS_DAYS = Object.freeze([
  { id: 'sat', label: 'Saturday', short: 'SAT' },
  { id: 'sun', label: 'Sunday', short: 'SUN' },
  { id: 'mon', label: 'Monday', short: 'MON' },
  { id: 'tue', label: 'Tuesday', short: 'TUE' },
  { id: 'wed', label: 'Wednesday', short: 'WED' },
  { id: 'thu', label: 'Thursday', short: 'THU' },
  { id: 'fri', label: 'Friday', short: 'FRI' },
]);

export const COURSE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
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
  /** Student pays the academy directly; an administrator reconciles it. */
  { id: 'manual', label: 'Manual transfer' },
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
