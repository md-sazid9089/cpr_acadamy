/**
 * Mock course catalogue used until the backend lands.
 * TODO: delete this file once GET /courses is live; the shapes match
 * the `Course` typedef in src/types/index.js.
 *
 * `batchGroup` / `batchType` / `session` / `branch` are the facets the Batches
 * page filters on — their ids come from BATCH_GROUPS, BATCH_TYPES,
 * BATCH_SESSIONS and BATCH_BRANCHES in src/constants.
 */

/**
 * Default long-form description, stored per course so the admin can rewrite it.
 * Blank lines separate paragraphs on the public page.
 */
function defaultDescription({ category, lessonCount }) {
  return [
    `কাদের জন্য এই ব্যাচ: যারা আগামী ${category} পরীক্ষায় প্রথমবার অংশগ্রহণ করতে যাচ্ছেন অথবা পূর্ববর্তী পরীক্ষায় কাঙ্খিত ফলাফল অর্জন করতে পারেননি, তাদের জন্য সাজানো হয়েছে এই পূর্ণাঙ্গ প্রস্তুতি ব্যাচ।`,
    'CPR Medical Academy-র বিশেষজ্ঞ মেন্টর প্যানেল দ্বারা পরিচালিত এই ব্যাচে রয়েছে প্রতিটি বিষয়ের ওপর ইন্টারেক্টিভ লাইভ ক্লাস, বিগত বছরের প্রশ্নের পুঙ্খানুপুঙ্খ ব্যাখ্যা, অধ্যায়ভিত্তিক পরীক্ষা এবং ফাইনাল মডেল টেস্ট।',
    `${lessonCount} টি লাইভ ইন্টারেক্টিভ ক্লাস ও রেকর্ড ব্যাকআপ অ্যাক্সেস। অধ্যায়ভিত্তিক SBA এবং MTF প্রশ্ন সমাধান ও র্যাঙ্ক লিস্ট। বিশেষজ্ঞ চিকিৎসকদের তত্ত্বাবধানে নিয়মিত ডাউট সলভিং সেশন। মুদ্রিত এবং ডিজিটাল পিডিএফ লেকচার নোট বান্ডেল।`,
  ].join('\n\n');
}

/**
 * Fills the editable fields the admin Detail tab owns. Existing fixtures were
 * written before those fields existed, so they pick up sensible defaults here
 * — the same values the public page used to hardcode.
 *
 * @param {import('@/types').Course} course
 * @returns {import('@/types').Course}
 */
function withDefaults(course) {
  const isFriday = course.batchType === 'friday-mega';
  return {
    description: defaultDescription(course),
    classTime: course.branch === 'online' ? { start: '20:00', end: '22:00' } : { start: '14:30', end: '16:30' },
    classDays: isFriday ? ['fri'] : ['sat', 'tue', 'thu'],
    offer: course.discountPrice ? { label: 'Special Discount Offer', endsAt: course.startsOn ?? null } : null,
    status: 'published',
    ...course,
  };
}

/** @type {import('@/types').Course[]} */
const SEED_COURSES = [
  {
    id: 'c-1',
    slug: 'fcps-part-1-medicine-january-batch',
    title: 'FCPS Part-1 Medicine — January Batch',
    category: 'FCPS',
    batchGroup: 'fcps-p1-medicine',
    batchType: 'foundation-core',
    session: 'jan-26-p1',
    branch: 'offline',
    subtitle: 'Complete basic-science coverage with weekly item-analysis exams.',
    thumbnailUrl: '/assets/carousel/postera.jpeg',
    highlights: [
      '180+ recorded lectures by FCPS-qualified faculty',
      'Weekly SBA & MTF exams with detailed explanations',
      'Full BCPS past-paper bank (2010 – present)',
      'Live problem-solving class every Friday',
      'Printed + PDF lecture notes included',
    ],
    price: 18000,
    discountPrice: 13500,
    duration: '6 months',
    lessonCount: 184,
    enrolledCount: 2140,
    rating: 4.8,
    startsOn: '2026-01-05T00:00:00.000Z',
    isFeatured: true,
  },
  {
    id: 'c-2',
    slug: 'fcps-part-2-surgery-clinical-intensive',
    title: 'FCPS Part-2 Surgery — Clinical Intensive',
    category: 'FCPS',
    batchGroup: 'fcps-p1-surgery',
    batchType: 'clinical',
    session: 'jul-26-p1',
    branch: 'offline',
    subtitle: 'Ward-round style clinical training for the final professional stage.',
    thumbnailUrl: '/assets/carousel/posterb.jpeg',
    highlights: [
      'Long case & short case demonstration videos',
      'One-to-one mock viva with senior consultants',
      'Operative surgery and instrument sessions',
      'Structured OSCE practice with feedback',
    ],
    price: 25000,
    discountPrice: null,
    duration: '4 months',
    lessonCount: 96,
    enrolledCount: 640,
    rating: 4.9,
    startsOn: '2026-02-01T00:00:00.000Z',
    isFeatured: true,
  },
  {
    id: 'c-3',
    slug: 'bcs-health-cadre-full-preparation',
    title: 'BCS (Health) Cadre — Full Preparation',
    category: 'BCS',
    batchType: 'foundation',
    session: 'jul-26-p1',
    branch: 'offline',
    subtitle: 'Preliminary, written and viva in a single guided track.',
    thumbnailUrl: '/assets/carousel/posterc.jpeg',
    highlights: [
      'Complete preliminary syllabus in 90 days',
      'Bangla, English, GK & mathematics refreshers',
      '40 full-length model tests with national ranking',
      'Written-answer evaluation by examiners',
      'Viva grooming sessions before the board',
    ],
    price: 12000,
    discountPrice: 8900,
    duration: '5 months',
    lessonCount: 210,
    enrolledCount: 3820,
    rating: 4.7,
    startsOn: '2025-10-05T00:00:00.000Z',
    isFeatured: true,
  },
  {
    id: 'c-4',
    slug: 'mbbs-3rd-professional-medicine-final-revision',
    title: 'MBBS 3rd Professional — Final Revision',
    category: 'MBBS',
    batchType: 'exam',
    session: 'jan-26-p1',
    branch: 'offline',
    subtitle: 'High-yield revision built around the university question pattern.',
    thumbnailUrl: '/assets/carousel/posterd.jpeg',
    highlights: [
      'Chapter-wise high-yield note bundle',
      'Card & item exams every alternate day',
      'Formative + summative pattern mock exams',
      'Practical and OSPE preparation sessions',
    ],
    price: 7500,
    discountPrice: 5900,
    duration: '3 months',
    lessonCount: 128,
    enrolledCount: 1560,
    rating: 4.6,
    startsOn: '2025-11-15T00:00:00.000Z',
    isFeatured: true,
  },
  {
    id: 'c-5',
    slug: 'mbbs-1st-professional-anatomy-physiology',
    title: 'MBBS 1st Professional — Anatomy & Physiology',
    category: 'MBBS',
    batchType: 'foundation',
    session: 'dec-26-p1',
    branch: 'offline',
    subtitle: 'Foundation year support with dissection-hall oriented teaching.',
    thumbnailUrl: '/assets/carousel/postere.jpeg',
    highlights: [
      'Region-wise anatomy with cadaveric demonstration',
      'Physiology viva question bank',
      'Weekly card exams with model answers',
      'Doubt-clearing sessions twice a week',
    ],
    price: 9000,
    discountPrice: null,
    duration: '8 months',
    lessonCount: 240,
    enrolledCount: 980,
    rating: 4.5,
    startsOn: '2026-01-20T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-6',
    slug: 'fcps-part-1-gynae-obs-crash-course',
    title: 'FCPS Part-1 Gynae & Obs — Crash Course',
    category: 'FCPS',
    batchGroup: 'fcps-p1-obs-gynae',
    batchType: 'crash',
    session: 'jan-26-p1',
    branch: 'online',
    subtitle: 'Eight-week sprint for candidates sitting the next examination.',
    thumbnailUrl: null,
    highlights: [
      'Daily live classes for eight weeks',
      '3,000+ curated SBA and MTF items',
      'Exam-day strategy and time management drills',
      'Recorded backup of every live session',
    ],
    price: 11000,
    discountPrice: 8500,
    duration: '8 weeks',
    lessonCount: 64,
    enrolledCount: 720,
    rating: 4.7,
    startsOn: '2025-12-01T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-7',
    slug: 'fcps-part-1-medicine-online-live-batch',
    title: 'FCPS Part-1 Medicine — Online Live Batch',
    category: 'FCPS',
    batchGroup: 'fcps-p1-medicine',
    batchType: 'online-live',
    session: 'jul-26-p1',
    branch: 'online',
    subtitle: 'The full Medicine & Allied syllabus, taught live from Chattogram.',
    thumbnailUrl: null,
    highlights: [
      'Live classes six days a week on Zoom',
      'Recording available for 48 hours after each class',
      'Weekly SBA exam with rank list',
      'Dedicated Messenger group for doubt clearing',
    ],
    price: 15000,
    discountPrice: 11500,
    duration: '6 months',
    lessonCount: 168,
    enrolledCount: 1310,
    rating: 4.6,
    startsOn: '2026-07-01T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-8',
    slug: 'fcps-part-1-medicine-mock-plus-batch',
    title: 'FCPS Part-1 Medicine — Mock Plus Batch',
    category: 'FCPS',
    batchGroup: 'fcps-p1-medicine',
    batchType: 'mock-plus',
    session: 'jan-26-p1',
    branch: 'online',
    subtitle: 'Exam-only batch for candidates who have finished their reading.',
    thumbnailUrl: null,
    highlights: [
      '24 full-length mocks in BCPS pattern',
      'Item analysis after every exam',
      'National merit position with each result',
      'Final revision class before the exam date',
    ],
    price: 6000,
    discountPrice: 4500,
    duration: '10 weeks',
    lessonCount: 24,
    enrolledCount: 890,
    rating: 4.8,
    startsOn: '2025-10-20T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-9',
    slug: 'fcps-part-1-surgery-foundation-batch',
    title: 'FCPS Part-1 Surgery — Foundation Batch',
    category: 'FCPS',
    batchGroup: 'fcps-p1-surgery',
    batchType: 'foundation',
    session: 'jul-26-p1',
    branch: 'offline',
    subtitle: 'Anatomy-heavy foundation for first-time Surgery & Allied candidates.',
    thumbnailUrl: null,
    highlights: [
      'Applied anatomy taught region by region',
      'Surgical pathology and physiology integration',
      'Weekly written and MCQ assessment',
      'Printed note bundle for every chapter',
    ],
    price: 17000,
    discountPrice: 13000,
    duration: '6 months',
    lessonCount: 176,
    enrolledCount: 1020,
    rating: 4.7,
    startsOn: '2026-07-10T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-10',
    slug: 'fcps-part-1-surgery-friday-mega-batch',
    title: 'FCPS Part-1 Surgery — Friday Mega Batch',
    category: 'FCPS',
    batchGroup: 'fcps-p1-surgery',
    batchType: 'friday-mega',
    session: 'dec-26-p1',
    branch: 'offline',
    subtitle: 'One long Friday session a week — built for working residents.',
    thumbnailUrl: null,
    highlights: [
      'Six-hour intensive class every Friday',
      'Whole syllabus covered in 28 sittings',
      'Take-home item set after each class',
      'Attendance-linked make-up recordings',
    ],
    price: 14000,
    discountPrice: null,
    duration: '7 months',
    lessonCount: 28,
    enrolledCount: 460,
    rating: 4.5,
    startsOn: '2026-01-09T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-11',
    slug: 'fcps-part-1-paediatrics-exam-plus-batch',
    title: 'FCPS Part-1 Paediatrics — Exam Plus Batch',
    category: 'FCPS',
    batchGroup: 'fcps-p1-paediatrics',
    batchType: 'exam-plus',
    session: 'jan-26-p1',
    branch: 'online',
    subtitle: 'Guided exam batch with a short revision class before each paper.',
    thumbnailUrl: null,
    highlights: [
      'Chapter exams followed by discussion class',
      'Paediatrics-specific item bank',
      'Growth, development and neonatology drills',
      'Performance dashboard with weak-area report',
    ],
    price: 8000,
    discountPrice: 6500,
    duration: '12 weeks',
    lessonCount: 48,
    enrolledCount: 540,
    rating: 4.6,
    startsOn: '2025-11-01T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-12',
    slug: 'fcps-part-1-foundation-allied-subjects',
    title: 'FCPS Part-1 Foundation — Allied Subjects',
    category: 'FCPS',
    batchGroup: 'fcps-p1-foundation',
    batchType: 'foundation-core',
    session: 'jul-26-p1',
    branch: 'offline',
    subtitle: 'Radiology, Dermatology, Anaesthesia, ENT, EYE, Psychiatry and CM.',
    thumbnailUrl: null,
    highlights: [
      'Common basic-science core for all allied subjects',
      'Subject-specific applied sessions in the final month',
      'Combined item bank across the allied disciplines',
      'Monthly full-length assessment',
    ],
    price: 16000,
    discountPrice: 12500,
    duration: '6 months',
    lessonCount: 160,
    enrolledCount: 610,
    rating: 4.5,
    startsOn: '2026-07-05T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-13',
    slug: 'residency-admission-recovery-batch',
    title: 'Residency Admission — Recovery Batch',
    category: 'FCPS',
    batchGroup: 'residency',
    batchType: 'recovery',
    session: 'jan-26-p1',
    branch: 'online',
    subtitle: 'Second-attempt track for candidates who narrowly missed the cut.',
    thumbnailUrl: null,
    highlights: [
      'Gap analysis from your previous attempt',
      'Targeted classes on repeatedly missed topics',
      'Weekly mock in BSMMU pattern',
      'One-to-one mentor review every fortnight',
    ],
    price: 10000,
    discountPrice: 7500,
    duration: '14 weeks',
    lessonCount: 72,
    enrolledCount: 380,
    rating: 4.7,
    startsOn: '2025-12-15T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-14',
    slug: 'fcps-residency-combined-offline-batch',
    title: 'FCPS P-1 + Residency — Combined Offline Batch',
    category: 'FCPS',
    batchGroup: 'combined',
    batchType: 'foundation-core',
    session: 'jan-26-p1',
    branch: 'offline',
    subtitle: 'Structured classroom teaching for both exams — Chattogram campus.',
    thumbnailUrl: null,
    highlights: [
      'Single syllabus covering FCPS P-1 and Residency',
      'Medicine, Surgery, Paediatrics, Gynae & Radiology',
      'Classroom teaching at Moti Tower, Chawkbazar',
      'Separate mock series for each examination',
    ],
    price: 18000,
    discountPrice: 13500,
    duration: '6 months',
    lessonCount: 192,
    enrolledCount: 1180,
    rating: 4.8,
    startsOn: '2026-01-12T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-15',
    slug: 'bcs-written-viva-sba-batch',
    title: 'BCS Written & Viva — Intensive Batch',
    category: 'BCS',
    batchType: 'exam',
    session: 'dec-26-p1',
    branch: 'online',
    subtitle: 'For candidates who have already cleared the preliminary.',
    thumbnailUrl: null,
    highlights: [
      'Written-answer structure and presentation drills',
      'Subject-wise model answers with examiner notes',
      'Mock viva board with retired cadre officers',
      'Weekly evaluated written script',
    ],
    price: 9500,
    discountPrice: null,
    duration: '4 months',
    lessonCount: 88,
    enrolledCount: 640,
    rating: 4.6,
    startsOn: '2026-03-01T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-16',
    slug: 'mbbs-final-professional-sba-batch',
    title: 'MBBS Final Professional — SBA Batch',
    category: 'MBBS',
    batchType: 'sba',
    session: 'jul-26-p1',
    branch: 'online',
    subtitle: 'Single-best-answer drilling for the final professional written.',
    thumbnailUrl: null,
    highlights: [
      'Daily SBA set with timed submission',
      'Explanations written to university standard',
      'Subject rotation across Medicine, Surgery, Gynae',
      'Cumulative score tracked across the batch',
    ],
    price: 5500,
    discountPrice: 4200,
    duration: '10 weeks',
    lessonCount: 60,
    enrolledCount: 830,
    rating: 4.4,
    startsOn: '2026-04-05T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-17',
    slug: 'mphil-diploma-admission-foundation-batch',
    title: 'M.Phil & Diploma Admission — Foundation Batch',
    category: 'FCPS',
    batchGroup: 'mphil-diploma',
    batchType: 'foundation',
    session: 'jul-26-p1',
    branch: 'offline',
    subtitle: 'Basic-science preparation for M.Phil and Diploma entrance tests.',
    thumbnailUrl: null,
    highlights: [
      'Anatomy, physiology and biochemistry from the ground up',
      'Subject-specific applied sessions',
      'Weekly assessment in the admission-test pattern',
      'Printed note bundle for every chapter',
    ],
    price: 14000,
    discountPrice: 11000,
    duration: '5 months',
    lessonCount: 140,
    enrolledCount: 420,
    rating: 4.5,
    startsOn: '2026-07-15T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-18',
    slug: 'mph-admission-online-live-batch',
    title: 'MPH Admission — Online Live Batch',
    category: 'FCPS',
    batchGroup: 'mph',
    batchType: 'online-live',
    session: 'dec-26-p1',
    branch: 'online',
    subtitle: 'Public-health entrance preparation you can attend from anywhere.',
    thumbnailUrl: null,
    highlights: [
      'Community medicine and biostatistics core',
      'Epidemiology problem-solving sessions',
      'English and analytical ability drills',
      'Full-length mocks with rank list',
    ],
    price: 9000,
    discountPrice: 7000,
    duration: '4 months',
    lessonCount: 92,
    enrolledCount: 310,
    rating: 4.4,
    startsOn: '2026-02-10T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-19',
    slug: 'outlier-mrcp-part-1-exam-batch',
    title: 'Outlier — MRCP Part-1 Exam Batch',
    category: 'FCPS',
    batchGroup: 'outlier',
    batchType: 'exam-plus',
    session: 'jul-26-p1',
    branch: 'online',
    subtitle: 'For candidates sitting MRCP, CS, COG or CPCH examinations.',
    thumbnailUrl: null,
    highlights: [
      'Best-of-five items in the Royal College pattern',
      'Discussion class after every exam',
      'Guidance on exam registration and centres',
      'Recorded sessions available throughout the batch',
    ],
    price: 16000,
    discountPrice: null,
    duration: '5 months',
    lessonCount: 80,
    enrolledCount: 190,
    rating: 4.6,
    startsOn: '2026-03-15T00:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'c-20',
    slug: 'bmdc-licensing-exam-crash-batch',
    title: 'BMDC Licensing Exam — Crash Batch',
    category: 'MBBS',
    batchGroup: 'bmdc-licensing',
    batchType: 'crash',
    session: 'jan-26-p1',
    branch: 'online',
    subtitle: 'Short, focused preparation for the BM&DC registration examination.',
    thumbnailUrl: null,
    highlights: [
      'Whole syllabus in six weeks',
      'Past-paper discussion for every subject',
      'Two full-length mocks before the exam',
      'Medical ethics and law refresher',
    ],
    price: 6500,
    discountPrice: 4900,
    duration: '6 weeks',
    lessonCount: 42,
    enrolledCount: 260,
    rating: 4.5,
    startsOn: '2026-01-25T00:00:00.000Z',
    isFeatured: false,
  },
];

/**
 * The live catalogue. A mutable array on purpose: the admin mock API in
 * features/admin/api/admin.api.js edits it in place so changes made in the
 * admin panel show up on the public course page within the same session.
 *
 * Admin changes are also persisted to localStorage so they survive a reload
 * and are visible in a second tab — without that, "View public page" (which
 * opens a new tab) would show the seed data and the new course would seem to
 * have vanished. Untouched seed courses still come from this file.
 *
 * @type {import('@/types').Course[]}
 */
const STORAGE_KEY = 'cpr-mock-courses';
const SEED_IDS = new Set(SEED_COURSES.map((course) => course.id));

function loadStore() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return { created: parsed?.created ?? [], edits: parsed?.edits ?? {} };
  } catch {
    return { created: [], edits: {} };
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* Storage full or unavailable — the in-memory copy still works for this tab. */
  }
}

function buildCatalogue() {
  const { created, edits } = loadStore();
  const seeded = SEED_COURSES.map(withDefaults).map((course) => (edits[course.id] ? { ...course, ...edits[course.id] } : course));
  return [...created, ...seeded];
}

export const MOCK_COURSES = buildCatalogue();

/**
 * Record an admin create/edit so it outlives this tab. Called by the admin
 * mock API after every course mutation.
 * TODO: delete along with this file once the real API owns the data.
 *
 * @param {import('@/types').Course} course
 */
export function commitCourse(course) {
  const store = loadStore();
  if (SEED_IDS.has(course.id)) {
    store.edits[course.id] = course;
  } else {
    const index = store.created.findIndex((item) => item.id === course.id);
    if (index >= 0) store.created[index] = course;
    else store.created.unshift(course);
  }
  saveStore(store);
}

/** Curriculum shown on the course detail page. */
export const MOCK_CURRICULUM = [
  {
    id: 'm-1',
    title: 'Module 1 — Foundation & orientation',
    lessons: [
      { id: 'l-1', title: 'How to approach the syllabus', kind: 'video', durationMinutes: 42, isLocked: false },
      { id: 'l-2', title: 'Exam pattern and marking scheme', kind: 'video', durationMinutes: 28, isLocked: false },
      { id: 'l-3', title: 'Orientation handout', kind: 'pdf', durationMinutes: 10, isLocked: false },
    ],
  },
  {
    id: 'm-2',
    title: 'Module 2 — Core subject lectures',
    lessons: [
      { id: 'l-4', title: 'Cardiovascular system — part 1', kind: 'video', durationMinutes: 68, isLocked: true },
      { id: 'l-5', title: 'Cardiovascular system — part 2', kind: 'video', durationMinutes: 71, isLocked: true },
      { id: 'l-6', title: 'Respiratory system', kind: 'video', durationMinutes: 64, isLocked: true },
      { id: 'l-7', title: 'Lecture notes bundle', kind: 'pdf', durationMinutes: 0, isLocked: true },
    ],
  },
  {
    id: 'm-3',
    title: 'Module 3 — Assessment & revision',
    lessons: [
      { id: 'l-8', title: 'Weekly mock exam 01', kind: 'live', durationMinutes: 90, isLocked: true },
      { id: 'l-9', title: 'Item analysis discussion', kind: 'video', durationMinutes: 55, isLocked: true },
    ],
  },
];
