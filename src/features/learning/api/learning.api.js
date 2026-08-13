import { sleep } from '@/lib/utils';
// import apiClient from '@/lib/api-client';

/**
 * Lesson delivery, mocked.
 * TODO: GET /courses/:slug/lessons, GET /lessons/:id (returns a short-lived
 * signed video URL), POST /lessons/:id/progress.
 */

export async function fetchCourseLessons(slug) {
  await sleep(400);
  return {
    courseSlug: slug,
    courseTitle: 'FCPS Part-1 Medicine — January Batch',
    modules: [
      {
        id: 'm-1',
        title: 'Module 1 — Cardiovascular system',
        lessons: [
          { id: 'l-1', title: 'Cardiac cycle and pressure curves', kind: 'video', durationMinutes: 52, isCompleted: true, isLocked: false },
          { id: 'l-2', title: 'ECG basics for the exam', kind: 'video', durationMinutes: 46, isCompleted: true, isLocked: false },
          { id: 'l-3', title: 'Cardiovascular lecture notes', kind: 'pdf', durationMinutes: 0, isCompleted: false, isLocked: false },
        ],
      },
      {
        id: 'm-2',
        title: 'Module 2 — Renal system',
        lessons: [
          { id: 'l-4', title: 'Renal physiology — tubular transport', kind: 'video', durationMinutes: 58, isCompleted: false, isLocked: false },
          { id: 'l-5', title: 'Acid–base balance', kind: 'video', durationMinutes: 63, isCompleted: false, isLocked: false },
          { id: 'l-6', title: 'Renal question bank (PDF)', kind: 'pdf', durationMinutes: 0, isCompleted: false, isLocked: true },
        ],
      },
    ],
  };
}

export async function fetchLesson(lessonId) {
  await sleep(300);
  return {
    id: lessonId,
    title: 'Renal physiology — tubular transport',
    kind: 'video',
    durationMinutes: 58,
    // TODO: the API should return a signed, short-lived URL per request.
    videoUrl: null,
    notes: `## Key points

- Proximal convoluted tubule reabsorbs roughly 65% of filtered sodium.
- Glucose reabsorption is saturable; the renal threshold sits near 180 mg/dL.
- Loop diuretics act on the NKCC2 co-transporter in the thick ascending limb.
- Aldosterone increases ENaC and Na⁺/K⁺-ATPase activity in the collecting duct.

## Commonly examined

1. Calculate free water clearance from the given values.
2. Distinguish type 1 from type 2 renal tubular acidosis.`,
    attachments: [
      { id: 'a-1', title: 'Tubular transport summary.pdf', pages: 14 },
      { id: 'a-2', title: 'Practice questions set 04.pdf', pages: 8 },
    ],
  };
}

export async function markLessonComplete(lessonId) {
  await sleep(250);
  // TODO: POST /lessons/:id/progress { completed: true }
  return { ok: true, lessonId };
}
