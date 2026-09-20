import { one } from '../db.js';
import { audit, ensure } from '../http.js';

function totalMarks(questions) {
  return Math.round(questions.reduce((total, question) => total + question.marks * (question.type === 'mtf' ? question.options.length : 1), 0) * 1000) / 1000;
}

/**
 * Applies a score-only override. Answer-derived counts remain historical facts;
 * only values that are deterministically derived from the final score change.
 */
export async function reviseAttemptScore(transaction, { attempt, examId, adminId, score, revisionReason }) {
  ensure(attempt?.submitted_at && attempt.result, 404, 'RESULT_NOT_FOUND', 'Completed exam result not found.');
  const maximum = totalMarks(attempt.paper.questions);
  ensure(Number.isFinite(maximum) && maximum > 0, 409, 'INVALID_RESULT_STATE', 'This result has no valid total marks.');
  ensure(score <= maximum, 400, 'SCORE_OUT_OF_RANGE', `Score must be between 0 and ${maximum}.`);

  const passMark = Number(attempt.result.passMark ?? attempt.paper.passMark ?? 70);
  const percentage = Math.round(score / maximum * 100000) / 1000;
  const previous = attempt.result;
  const revisedAt = new Date().toISOString();
  const result = {
    ...previous,
    score,
    totalMarks: maximum,
    percentage,
    passed: score * 100 >= maximum * passMark,
    isEdited: true,
    resultRevision: { revisedAt, kind: 'score_override' },
  };
  const saved = await one(transaction, 'UPDATE exam_attempts SET result=$1::jsonb,version=version+1 WHERE id=$2 RETURNING result', [JSON.stringify(result), attempt.id]);
  await audit(transaction, adminId, 'exam.result_revised', attempt.id, {
    examId,
    userId: attempt.user_id,
    kind: 'score_override',
    revisionReason,
    previousResult: previous,
    revisedResult: result,
  });
  return saved.result;
}
