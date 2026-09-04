import { sleep } from '@/lib/utils';
import { QUESTION_TYPES } from '@/constants';

/**
 * Course Hub data layer, mocked.
 *
 * TODO: Replace with real API endpoints:
 *   GET /courses/:slug/videos   — videos grouped by release date
 *   GET /courses/:slug/exams    — SBA and MCQ exams for the course
 *   GET /courses/:slug/schedule — routine rows for the course
 */

// ─── At a Glance: Video lessons grouped by date ────────────────────────────

const MOCK_VIDEOS = {
  'fcps-p1-january-2026': [
    {
      date: '2026-07-25',
      time: '04:00 PM',
      videos: [
        {
          id: 'l1',
          title: 'Orientation Program For FCPS Mid-Term Surgery Regular Batch-2 December\'26',
          duration: '1h 12m',
        },
        {
          id: 'l2',
          title: 'FCPS Mid-Term Surgery Regular Batch Dec\'26-Lecture How To Prepare For Mid-Term Surgery.',
          duration: '58m',
        },
      ],
    },
    {
      date: '2026-07-26',
      time: '02:30 PM',
      videos: [
        {
          id: 'l4',
          title: 'FCPS Mid-Term Surgery Long & Regular Batch December\'26, Lecture: Upper GIT',
          duration: '1h 05m',
        },
      ],
    },
    {
      date: '2026-07-29',
      time: '02:30 PM',
      videos: [
        {
          id: 'l6',
          title: 'FCPS Mid-Term Surgery Regular Batch December\'26, Lecture: Basic Principle of Surgery-1 (Chapter-1, 2, 3)',
          duration: '1h 20m',
        },
      ],
    },
    {
      date: '2026-08-02',
      time: '02:30 PM',
      videos: [
        {
          id: 'l8',
          title: 'Renal System Live class Dec\'26',
          duration: '1h 15m',
        },
        {
          id: 'l10',
          title: 'Body fluid, Electrolytes, Acid Base Balance Live class Dec\'26',
          duration: '55m',
        },
      ],
    },
    {
      date: '2026-08-05',
      time: '04:00 PM',
      videos: [
        {
          id: 'l11',
          title: 'Principle of Surgery-I: [Chapter 1-5] (Bailey & Love\'s Regular Online Live Lecture)',
          duration: '1h 30m',
        },
      ],
    },
    {
      date: '2026-08-09',
      time: '02:30 PM',
      videos: [
        {
          id: 'l13',
          title: 'Respiratory & General Physiology Live class Dec\'26',
          duration: '1h 10m',
        },
      ],
    },
    {
      date: '2026-08-16',
      time: '02:30 PM',
      videos: [
        {
          id: 'l15',
          title: 'Cell Injury & Adaptation Live class Dec\'26',
          duration: '1h 05m',
        },
      ],
    },
    {
      date: '2026-08-23',
      time: '02:30 PM',
      videos: [
        {
          id: 'l17',
          title: 'Cardiovascular System & Shock Live class Dec\'26',
          duration: '1h 25m',
        },
      ],
    },
  ],
};

// ─── Exams: SBA and MCQ ────────────────────────────────────────────────────

const MOCK_EXAMS = {
  'fcps-p1-january-2026': {
    sba: [
      {
        id: 'ex-sba-1',
        title: 'FCPS Part-1 — Weekly SBA Exam 14',
        type: 'live',
        status: 'upcoming',
        scheduledAt: '2026-09-15T14:00:00.000Z',
        durationMinutes: 60,
        questionCount: 50,
        totalMarks: 50,
      },
      {
        id: 'ex-sba-2',
        title: 'FCPS Part-1 — SBA Practice Set 05',
        type: 'practice',
        status: 'running',
        scheduledAt: '2026-09-10T10:00:00.000Z',
        durationMinutes: 45,
        questionCount: 25,
        totalMarks: 25,
      },
      {
        id: 'ex-sba-3',
        title: 'FCPS Part-1 — Weekly SBA Exam 13',
        type: 'mock',
        status: 'published',
        scheduledAt: '2026-09-06T14:00:00.000Z',
        durationMinutes: 60,
        questionCount: 50,
        totalMarks: 50,
      },
    ],
    mcq: [
      {
        id: 'ex-mcq-1',
        title: 'FCPS Part-1 — MTF Practice Set 08',
        type: 'practice',
        status: 'running',
        scheduledAt: '2026-09-13T10:00:00.000Z',
        durationMinutes: 45,
        questionCount: 25,
        totalMarks: 125,
      },
      {
        id: 'ex-mcq-2',
        title: 'FCPS Part-1 — Weekly MCQ Exam 12',
        type: 'live',
        status: 'upcoming',
        scheduledAt: '2026-09-20T14:00:00.000Z',
        durationMinutes: 60,
        questionCount: 50,
        totalMarks: 250,
      },
      {
        id: 'ex-mcq-3',
        title: 'Renal System — True/False Assessment',
        type: 'mock',
        status: 'published',
        scheduledAt: '2026-09-01T10:00:00.000Z',
        durationMinutes: 30,
        questionCount: 20,
        totalMarks: 100,
      },
    ],
  },
};

// ─── Schedule: Routine rows ────────────────────────────────────────────────

const MOCK_SCHEDULE = {
  'fcps-p1-january-2026': [
    {
      id: 1,
      dateTime: '20 Jun 2026, Saturday\n02:30 PM',
      exam: 'NO EXAM',
      solveClass: 'NO CLASS',
      lecture: 'Orientation Program',
    },
    {
      id: 2,
      dateTime: '20 Jun 2026, Saturday\n02:30 PM',
      exam: 'NO EXAM',
      solveClass: 'NO CLASS',
      lecture: "Renal System Live class Dec'26",
    },
    {
      id: 3,
      dateTime: '27 Jun 2026, Saturday\n02:30 PM',
      exam: 'Renal System (Regular Exam)',
      solveClass: 'Renal System (Regular Solve Class)',
      lecture: "Body fluid, Electrolytes, Acid Base Balance Live class Dec'26",
    },
    {
      id: 4,
      dateTime: '02 Jul 2026, Thursday\n04:00 PM',
      exam: 'NO EXAM',
      solveClass: 'NO CLASS',
      lecture: "Principle of Surgery-I: [Chapter 1-5] (Bailey & Love's Regular Online Live Lecture)",
    },
    {
      id: 5,
      dateTime: '04 Jul 2026, Saturday\n02:30 PM',
      exam: 'Body Fluid, Electrolytes, Acid Base Balance (Regular Exam)',
      solveClass: 'Body Fluid, Electrolytes, Acid Base Balance (Regular Solve Class)',
      lecture: "Respiratory & General Physiology Live class Dec'26",
    },
    {
      id: 6,
      dateTime: '07 Jul 2026, Tuesday\n02:30 PM',
      exam: 'NO EXAM',
      solveClass: 'NO CLASS',
      lecture: "Cell Injury & Adaptation Live class Dec'26 (2)",
    },
    {
      id: 7,
      dateTime: '11 Jul 2026, Saturday\n02:30 PM',
      exam: 'Respiratory & General Physiology (Regular Exam)',
      solveClass: 'Respiratory & General Physiology (Regular Solve Class)',
      lecture: "Cardiovascular System & Shock Live class Dec'26",
    },
    {
      id: 8,
      dateTime: '18 Jul 2026, Saturday\n02:30 PM',
      exam: 'Cardiovascular System (Regular Exam)',
      solveClass: 'Cardiovascular System (Regular Solve Class)',
      lecture: "Gastrointestinal System & Nutrition Live class Dec'26",
    },
    {
      id: 9,
      dateTime: '31 Oct 2026, Saturday\n02:30 PM',
      exam: "Review Exam: Biostatistics & Pharmacology Dec'26",
      solveClass: "Review Exam: Biostatistics & Pharmacology Solve Class Dec'26",
      lecture: 'NO CLASS',
    },
    {
      id: 10,
      dateTime: '14 Nov 2026, Saturday\n11:00 AM',
      exam: "Pre Mock-1 (Anatomy) Surgery & Allied December'26",
      solveClass: "Pre Mock-1 Solve Class Dec'26",
      lecture: 'NO CLASS',
    },
    {
      id: 11,
      dateTime: '16 Nov 2026, Monday\n11:00 AM',
      exam: "Pre Mock-2 (Physiology, Biochemistry, Biostatistics, Pharmacology) Surgery & Allied December'26",
      solveClass: "Pre Mock-2 Solve Class Dec'26",
      lecture: 'NO CLASS',
    },
    {
      id: 12,
      dateTime: '18 Nov 2026, Wednesday\n11:00 AM',
      exam: "Pre Mock-3 (Pathology, Microbiology) Surgery & Allied December'26",
      solveClass: "Pre Mock-3 Solve Class Dec'26",
      lecture: 'NO CLASS',
    },
    {
      id: 13,
      dateTime: '21 Nov 2026, Saturday\n09:00 AM',
      exam: "Final Mock-1 (Surgery & Allied) December'26",
      solveClass: 'Mock-1 Paper-01 (Surgery & Allied) Solve Class Question MCQ (01-25) SBA (76-100)',
      lecture: 'NO CLASS',
    },
    {
      id: 14,
      dateTime: '25 Nov 2026, Wednesday\n09:00 AM',
      exam: "Final Mock-2 (Surgery & Allied) December'26",
      solveClass: 'Mock-2 Paper-01 (Surgery & Allied) Solve Class Question MCQ (01-25) SBA (76-100)',
      lecture: 'NO CLASS',
    },
  ],
};

// Use the same data for any slug not explicitly keyed — the mock backing
// a slug-less request just returns the default batch.
function resolve(map, slug) {
  return map[slug] ?? map['fcps-p1-january-2026'] ?? [];
}

/** Fetch video lessons grouped by release date for a course. */
export async function fetchCourseVideos(slug) {
  await sleep(400);
  return resolve(MOCK_VIDEOS, slug);
}

/** Fetch SBA and MCQ exams for a course. */
export async function fetchCourseExams(slug) {
  await sleep(350);
  const data = MOCK_EXAMS[slug] ?? MOCK_EXAMS['fcps-p1-january-2026'];
  return data ?? { sba: [], mcq: [] };
}

/** Fetch the batch schedule/routine for a course. */
export async function fetchCourseSchedule(slug) {
  await sleep(300);
  return resolve(MOCK_SCHEDULE, slug);
}
