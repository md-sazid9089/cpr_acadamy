import { QUESTION_TYPES } from '@/constants';

/**
 * Marking arithmetic shared by the exam builder's summary line and the
 * derived `totalMarks`. The student runner does not import this — scoring is
 * authoritative server-side; these mirror the contract so the admin sees the
 * same numbers the backend will produce.
 */

/** Number of independently-scored items in one question. */
export function stemsPerQuestion(type) {
  return type === QUESTION_TYPES.MTF ? 5 : 1;
}

/** Marks lost per wrong answer: deductionPercent / 100 × marksPerQuestion. */
export function deductionPerWrong({ marksPerQuestion = 1, deductionPercent = 0 }) {
  return round((Number(deductionPercent) / 100) * Number(marksPerQuestion));
}

/** Full marks available for one question (an MTF question is five stems). */
export function marksPerQuestionTotal({ type, marksPerQuestion = 1 }) {
  return round(Number(marksPerQuestion) * stemsPerQuestion(type));
}

/** Always derived, never typed: questionCount × marks × stems. */
export function computeTotalMarks({ type, questionCount = 0, marksPerQuestion = 1 }) {
  return round(Number(questionCount) * marksPerQuestionTotal({ type, marksPerQuestion }));
}

/**
 * Scores one answered question.
 *
 * POLICY (confirm with the client before changing):
 *  - A blank SBA, or a blank MTF stem, scores 0 — it is never treated as wrong.
 *  - An MTF question is floored at zero: its five stems can cancel each other
 *    out but cannot drag the question below 0.
 *  - A wrong SBA is the one place a negative value is returned, because the
 *    deduction has nothing on the same question to offset. `scoreExam` floors
 *    the paper total at zero so no student ends below 0 overall.
 *
 * @param {import('@/types').Question} question
 * @param {string | Record<string, boolean> | undefined} answer
 * @param {{ marksPerQuestion?: number, deductionPercent?: number }} exam
 */
export function scoreQuestion(question, answer, exam) {
  const marks = Number(exam.marksPerQuestion ?? 1);
  const deduction = deductionPerWrong(exam);

  if (question.type === QUESTION_TYPES.SBA) {
    if (!answer) return 0;
    return answer === question.correctOptionId ? marks : -deduction;
  }

  let total = 0;
  for (const option of question.options) {
    const picked = answer?.[option.id];
    if (picked === undefined) continue;
    total += picked === question.correctAnswer?.[option.id] ? marks : -deduction;
  }
  return Math.max(0, round(total));
}

/**
 * @param {import('@/types').Question[]} questions
 * @param {import('@/types').AnswerSheet} answers
 * @param {{ marksPerQuestion?: number, deductionPercent?: number }} exam
 */
export function scoreExam(questions, answers, exam) {
  const total = questions.reduce((sum, question) => sum + scoreQuestion(question, answers[question.id], exam), 0);
  return Math.max(0, round(total));
}

/** Two decimal places is enough for quarter-mark deductions. */
function round(value) {
  return Math.round(value * 100) / 100;
}
