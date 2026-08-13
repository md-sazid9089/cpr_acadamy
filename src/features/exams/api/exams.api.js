import { QUESTION_TYPES } from '@/constants';
import { sleep } from '@/lib/utils';
// import apiClient from '@/lib/api-client';

/**
 * Exam delivery, mocked.
 * TODO: GET /exams/:id (paper without answer keys), POST /exams/:id/answers
 * (autosave), POST /exams/:id/submit, GET /exams/:id/result.
 * The countdown must ultimately be authoritative server-side — the client timer
 * is a display of the deadline the API returns, not the source of truth.
 */

const MOCK_QUESTIONS = [
  {
    id: 'q-1',
    type: QUESTION_TYPES.SBA,
    stem: 'A 58-year-old man presents with crushing central chest pain for two hours. ECG shows ST elevation in leads II, III and aVF. Which coronary artery is most likely occluded?',
    options: [
      { id: 'a', text: 'Left anterior descending artery' },
      { id: 'b', text: 'Right coronary artery' },
      { id: 'c', text: 'Left circumflex artery' },
      { id: 'd', text: 'Left main coronary artery' },
      { id: 'e', text: 'Posterior descending artery' },
    ],
  },
  {
    id: 'q-2',
    type: QUESTION_TYPES.MTF,
    stem: 'Regarding the proximal convoluted tubule:',
    options: [
      { id: 'a', text: 'It reabsorbs approximately 65% of filtered sodium' },
      { id: 'b', text: 'Glucose reabsorption here is saturable' },
      { id: 'c', text: 'It is the primary site of action of loop diuretics' },
      { id: 'd', text: 'Bicarbonate reabsorption involves carbonic anhydrase' },
      { id: 'e', text: 'It is impermeable to water' },
    ],
  },
  {
    id: 'q-3',
    type: QUESTION_TYPES.SBA,
    stem: 'Which of the following is the most appropriate first-line treatment for a stable patient with newly diagnosed atrial fibrillation and a CHA₂DS₂-VASc score of 4?',
    options: [
      { id: 'a', text: 'Aspirin 75 mg daily' },
      { id: 'b', text: 'Direct oral anticoagulant' },
      { id: 'c', text: 'Immediate electrical cardioversion' },
      { id: 'd', text: 'Clopidogrel alone' },
      { id: 'e', text: 'No antithrombotic therapy' },
    ],
  },
];

export async function fetchExamPaper(examId) {
  await sleep(500);
  return {
    id: examId,
    title: 'FCPS Part-1 — MTF Practice Set 08',
    type: 'practice',
    durationMinutes: 45,
    totalMarks: 125,
    negativeMarking: 0.25,
    // Absolute deadline from the server; the client timer counts down to this.
    endsAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    questions: MOCK_QUESTIONS,
  };
}

/** Autosave a single answer. Fire-and-forget from the UI. */
export async function saveAnswer({ examId, questionId, answer }) {
  await sleep(150);
  return { ok: true, examId, questionId, answer };
}

/** @param {{ examId: string, answers: import('@/types').AnswerSheet }} payload */
export async function submitExam({ examId, answers }) {
  await sleep(800);

  // Scoring happens server-side in production; these numbers are illustrative.
  const answered = Object.keys(answers).length;
  return {
    examId,
    score: 96,
    totalMarks: 125,
    correctCount: 21,
    wrongCount: 4,
    skippedCount: Math.max(0, MOCK_QUESTIONS.length - answered),
    rank: 18,
    participants: 412,
    submittedAt: new Date().toISOString(),
  };
}

export async function fetchExamResult(examId) {
  await sleep(400);
  return {
    examId,
    score: 96,
    totalMarks: 125,
    correctCount: 21,
    wrongCount: 4,
    skippedCount: 0,
    rank: 18,
    participants: 412,
    submittedAt: new Date().toISOString(),
    review: MOCK_QUESTIONS.map((question, index) => ({
      ...question,
      correctAnswer: question.type === QUESTION_TYPES.SBA ? 'b' : { a: true, b: true, c: false, d: true, e: false },
      yourAnswer: index === 1 ? { a: true, b: true, c: true, d: true, e: false } : 'b',
      explanation:
        'Inferior ST elevation (II, III, aVF) localises to the right coronary artery in around 80% of people, where it supplies the inferior wall via the posterior descending artery.',
    })),
  };
}

export async function fetchExamList() {
  await sleep(350);
  return [
    { id: 'ex-1', title: 'FCPS Part-1 — Weekly SBA Exam 14', type: 'live', status: 'upcoming', scheduledAt: '2026-08-15T14:00:00.000Z', durationMinutes: 60, questionCount: 50, totalMarks: 50 },
    { id: 'ex-3', title: 'FCPS Part-1 — MTF Practice Set 08', type: 'practice', status: 'running', scheduledAt: '2026-08-13T10:00:00.000Z', durationMinutes: 45, questionCount: 25, totalMarks: 125 },
    { id: 'ex-9', title: 'FCPS Part-1 — Weekly SBA Exam 13', type: 'mock', status: 'published', scheduledAt: '2026-08-06T14:00:00.000Z', durationMinutes: 60, questionCount: 50, totalMarks: 50 },
  ];
}
