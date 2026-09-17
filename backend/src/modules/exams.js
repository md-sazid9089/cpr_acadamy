import { z } from 'zod';
import { one } from '../db.js';
import { audit, ensure, uuid, text, pageQuery } from '../http.js';
import { requireCourseAccess, webUrl } from './courses.js';

const identifier = z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/).refine(value => !['__proto__', 'constructor', 'prototype'].includes(value));
const answer = z.union([identifier, z.record(identifier, z.boolean()), z.null()]);
const answerSheet = z.record(identifier, answer).refine(value => Object.keys(value).length <= 500, 'Too many answers');
// Drafts may be saved half-written; `isQuestionComplete` gates publication.
const questionSchema = z.object({
  id: identifier, type: z.enum(['sba', 'mtf']), stem: z.string().trim().max(10000).default(''), imageUrl: z.union([webUrl, z.literal('')]).default(''),
  options: z.array(z.object({ id: identifier, text: z.string().trim().max(2000).default('') }).strict()).min(2).max(10),
  correctAnswer: z.union([identifier, z.record(identifier, z.boolean())]).nullable().default(null),
  explanation: z.string().max(10000).default(''), marks: z.number().positive().max(100).default(1),
}).strict().superRefine((question, context) => {
  const ids = question.options.map(option => option.id);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', message: 'Option IDs must be unique', path: ['options'] });
  if (question.correctAnswer === null) return;
  const valid = question.type === 'sba'
    ? typeof question.correctAnswer === 'string' && ids.includes(question.correctAnswer)
    : typeof question.correctAnswer === 'object' && Object.keys(question.correctAnswer).every(id => ids.includes(id));
  if (!valid) context.addIssue({ code: 'custom', message: 'The answer key must reference this question\'s options', path: ['correctAnswer'] });
});

export function isQuestionComplete(question) {
  if (!question.stem || question.options.some(option => !option.text)) return false;
  if (question.type === 'sba') return typeof question.correctAnswer === 'string';
  return typeof question.correctAnswer === 'object' && question.correctAnswer !== null && question.options.every(option => typeof question.correctAnswer[option.id] === 'boolean');
}

const examFields = z.object({
  courseId: uuid, title: text, type: z.enum(['live', 'mock', 'practice']).default('practice'),
  questionType: z.enum(['sba', 'mtf', 'mixed']).default('sba'),
  durationMinutes: z.number().int().min(1).max(600), negativeMarking: z.number().min(0).max(1000).multipleOf(0.001).default(0),
  passMark: z.number().min(0).max(100).multipleOf(0.001).default(70),
  targetQuestionCount: z.number().int().min(0).max(500).default(0), marksPerQuestion: z.number().min(0).max(100).multipleOf(0.001).default(1),
  scheduledAt: z.string().datetime({ offset: true }), closesAt: z.string().datetime({ offset: true }).nullable().default(null),
  resultsAt: z.string().datetime({ offset: true }).nullable().default(null), isPublished: z.boolean().default(false),
  questions: z.array(questionSchema).max(500).default([]),
}).strict();

function totalMarks(questions) {
  return Math.round(questions.reduce((total, question) => total + question.marks * (question.type === 'mtf' ? question.options.length : 1), 0) * 1000) / 1000;
}

export function validatePublication(input) {
  if (!input.isPublished) return;
  ensure(input.questions.length === input.targetQuestionCount, 400, 'QUESTION_COUNT_MISMATCH', 'The paper must contain exactly the target number of questions.');
}

export function validateAnswers(questions, answers) {
  const lookup = new Map(questions.map(question => [question.id, question]));
  for (const [questionId, value] of Object.entries(answers)) {
    const question = lookup.get(questionId);
    ensure(question, 400, 'INVALID_ANSWER', 'Answer references an unknown question.');
    if (value === null) continue;
    const ids = question.options.map(option => option.id);
    const valid = question.type === 'sba' ? typeof value === 'string' && ids.includes(value)
      : typeof value === 'object' && Object.entries(value).every(([id, selected]) => ids.includes(id) && typeof selected === 'boolean');
    ensure(valid, 400, 'INVALID_ANSWER', 'Answer does not match the question options.');
  }
}

export function gradePaper(paper, answers) {
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  for (const question of paper.questions) {
    const response = answers[question.id];
    const units = question.type === 'sba' ? [[response, question.correctAnswer]] : question.options.map(option => [response?.[option.id], question.correctAnswer[option.id]]);
    for (const [selected, correct] of units) {
      if (selected === undefined || selected === null) skippedCount += 1;
      else if (selected === correct) { correctCount += 1; score += question.marks; }
      else { wrongCount += 1; score -= question.marks * (paper.negativeMarking ?? 0) / 100; }
    }
  }
  score = Math.max(0, Math.round(score * 1000) / 1000);
  const maximum = totalMarks(paper.questions);
  const passMark = paper.passMark ?? 70;
  return { score, totalMarks: maximum, correctCount, wrongCount, skippedCount, passMark, passed: maximum > 0 && score * 100 >= maximum * passMark };
}

function examDto(row) {
  const now = Date.now();
  const status = !row.is_published ? 'draft' : row.submitted_at ? 'submitted' : new Date(row.scheduled_at).getTime() > now ? 'upcoming'
    : row.closes_at && new Date(row.closes_at).getTime() <= now ? 'published' : 'running';
  return { id: row.id, courseId: row.course_id, courseTitle: row.course_title, courseName: row.course_title,
    title: row.title, type: row.type, questionType: row.question_type, status, isPublished: row.is_published,
    durationMinutes: row.duration_minutes, negativeMarking: Number(row.negative_marking), passMark: Number(row.pass_mark),
    marksPerQuestion: Number(row.marks_per_question ?? 1), targetQuestionCount: row.target_question_count ?? 0,
    scheduledAt: row.scheduled_at, closesAt: row.closes_at, resultsAt: row.results_at,
    questionCount: row.questions.length, completeQuestionCount: row.questions.filter(isQuestionComplete).length, totalMarks: totalMarks(row.questions) };
}

function publicPaper(attempt, exam) {
  return { ...examDto(exam), endsAt: attempt.ends_at, answers: attempt.answers,
    durationMinutes: attempt.paper.durationMinutes, negativeMarking: attempt.paper.negativeMarking, passMark: attempt.paper.passMark,
    totalMarks: totalMarks(attempt.paper.questions),
    questions: attempt.paper.questions.map(question => ({ id: question.id, type: question.type, stem: question.stem, imageUrl: question.imageUrl ?? '', options: question.options, marks: question.marks })) };
}

async function finalize(transaction, attempt) {
  if (attempt.submitted_at) return attempt;
  return one(transaction, 'UPDATE exam_attempts SET submitted_at=now(),result=$2 WHERE id=$1 RETURNING *', [attempt.id, JSON.stringify(gradePaper(attempt.paper, attempt.answers))]);
}

async function examPositions(transaction, exam, userId, limit = 10, offset = 0) {
  const standings = await one(transaction, `WITH participants AS (
    SELECT a.user_id,a.result,a.submitted_at,u.full_name FROM exam_attempts a JOIN users u ON u.id=a.user_id
    WHERE a.exam_id=$1 AND u.role='student'
  ), ranked AS (
    SELECT user_id,full_name,result,
      rank() OVER (ORDER BY (result->>'score')::numeric DESC)::int AS rank,
      count(*) OVER (PARTITION BY (result->>'score')::numeric)::int AS tied_count
    FROM participants WHERE submitted_at IS NOT NULL AND result IS NOT NULL
  ), entries AS (
    SELECT user_id,rank,jsonb_build_object(
      'userId', user_id, 'rank',rank,'name',full_name,'score',(result->>'score')::numeric,
      'totalMarks',(result->>'totalMarks')::numeric,'passed',(result->>'passed')::boolean,
      'tied',tied_count>1,'isMe',user_id=$2::uuid
    ) AS entry FROM ranked
  ), page AS (
    SELECT * FROM entries ORDER BY rank,user_id LIMIT $3 OFFSET $4
  )
  SELECT (SELECT count(*)::int FROM ranked) AS participants,
    (SELECT count(*)::int FROM participants WHERE submitted_at IS NULL) AS pending,
    (SELECT max((result->>'score')::numeric) FROM ranked) AS highest_score,
    (SELECT round(avg((result->>'score')::numeric),3) FROM ranked) AS average_score,
    (SELECT entry FROM entries WHERE user_id=$2::uuid) AS me,
    COALESCE((SELECT jsonb_agg(entry ORDER BY rank,user_id) FROM page),'[]'::jsonb) AS items`,
  [exam.id, userId, limit, offset]);
  return { exam: examDto(exam), participants: standings.participants, pending: standings.pending,
    highestScore: standings.highest_score === null ? null : Number(standings.highest_score),
    averageScore: standings.average_score === null ? null : Number(standings.average_score),
    me: standings.me, items: standings.items, limit, offset,
    provisional: !exam.closes_at || new Date(exam.closes_at).getTime() > Date.now() || standings.pending > 0 };
}

export function examRoutes(route, database) {
  async function list(request, courseId) {
    return (await database.query(`SELECT x.*,c.title AS course_title,a.submitted_at FROM exams x JOIN courses c ON c.id=x.course_id
      LEFT JOIN exam_attempts a ON a.exam_id=x.id AND a.user_id=$1
      WHERE x.is_published AND ($2::uuid IS NULL OR x.course_id=$2) AND
      ($3::boolean OR EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id=$1 AND e.course_id=x.course_id AND e.status='active' AND e.expires_at>now()))
      ORDER BY x.scheduled_at DESC,x.id LIMIT $4 OFFSET $5`, [request.auth.user_id, courseId || null, request.auth.role === 'admin', request.query.limit || 50, request.query.offset || 0])).rows.map(examDto);
  }
  route('GET', '/exams', { auth: 'active', query: pageQuery }, request => list(request));
  route('GET', '/me/exams', { auth: 'active', query: pageQuery }, request => list(request));
  route('GET', '/courses/:slug/exams', { auth: 'active', query: pageQuery }, async request => {
    const course = await one(database, 'SELECT id FROM courses WHERE slug=$1', [request.params.slug]);
    ensure(course, 404, 'COURSE_NOT_FOUND', 'This course could not be found.');
    await requireCourseAccess(database, request.auth, course.id);
    const exams = await list(request, course.id);
    return { sba: exams.filter(exam => exam.questionType !== 'mtf'), mcq: exams.filter(exam => exam.questionType === 'mtf') };
  });

  async function loadExam(transaction, request) {
    const exam = await one(transaction, 'SELECT * FROM exams WHERE id=$1 AND is_published FOR SHARE', [request.params.id]);
    ensure(exam, 404, 'EXAM_NOT_FOUND', 'Exam not found.');
    await requireCourseAccess(transaction, request.auth, exam.course_id);
    return exam;
  }
  route('POST', '/exams/:id/start', { auth: 'active' }, async request => database.transaction(async transaction => {
    await transaction.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [request.auth.user_id]);
    const exam = await loadExam(transaction, request);
    const existing = await one(transaction, 'SELECT * FROM exam_attempts WHERE user_id=$1 AND exam_id=$2 FOR UPDATE', [request.auth.user_id, exam.id]);
    if (existing) {
      ensure(!existing.submitted_at, 409, 'ALREADY_SUBMITTED', 'This exam has already been submitted.');
      return publicPaper(existing, exam);
    }
    ensure(new Date(exam.scheduled_at).getTime() <= Date.now(), 409, 'EXAM_NOT_STARTED', 'This exam has not started.');
    ensure(!exam.closes_at || new Date(exam.closes_at).getTime() > Date.now(), 409, 'EXAM_CLOSED', 'This exam is closed.');
    const deadline = new Date(Math.min(Date.now() + exam.duration_minutes * 60000, exam.closes_at ? new Date(exam.closes_at).getTime() : Infinity));
    const paper = { questions: exam.questions, negativeMarking: Number(exam.negative_marking), passMark: Number(exam.pass_mark), durationMinutes: exam.duration_minutes };
    const attempt = await one(transaction, 'INSERT INTO exam_attempts(user_id,exam_id,paper,ends_at) VALUES ($1,$2,$3,$4) RETURNING *', [request.auth.user_id, exam.id, JSON.stringify(paper), deadline]);
    return publicPaper(attempt, exam);
  }));
  route('GET', '/exams/:id', { auth: 'active' }, async request => database.transaction(async transaction => {
    const exam = await loadExam(transaction, request);
    const attempt = await one(transaction, 'SELECT * FROM exam_attempts WHERE user_id=$1 AND exam_id=$2', [request.auth.user_id, exam.id]);
    ensure(attempt, 409, 'ATTEMPT_REQUIRED', 'Start the exam before requesting the paper.');
    return publicPaper(attempt, exam);
  }));
  route('POST', '/exams/:id/answers', { auth: 'active', body: z.object({ questionId: identifier, answer }).strict() }, async request => {
    const result = await database.transaction(async transaction => {
      const exam = await loadExam(transaction, request);
      const attempt = await one(transaction, 'SELECT * FROM exam_attempts WHERE user_id=$1 AND exam_id=$2 FOR UPDATE', [request.auth.user_id, exam.id]);
      ensure(attempt, 409, 'ATTEMPT_REQUIRED', 'Start the exam before saving answers.');
      ensure(!attempt.submitted_at, 409, 'ALREADY_SUBMITTED', 'This exam has already been submitted.');
      if (new Date(attempt.ends_at).getTime() <= Date.now()) { await finalize(transaction, attempt); return false; }
      const update = { [request.body.questionId]: request.body.answer };
      validateAnswers(attempt.paper.questions, update);
      await transaction.query('UPDATE exam_attempts SET answers=answers || $2::jsonb WHERE id=$1', [attempt.id, JSON.stringify(update)]);
      return true;
    });
    ensure(result, 409, 'EXAM_DEADLINE_PASSED', 'The deadline has passed. Saved answers were submitted.');
    return { ok: true };
  });
  route('POST', '/exams/:id/submit', { auth: 'active', body: z.object({ answers: answerSheet.default({}) }).strict() }, async request => database.transaction(async transaction => {
    const exam = await loadExam(transaction, request);
    let attempt = await one(transaction, 'SELECT * FROM exam_attempts WHERE user_id=$1 AND exam_id=$2 FOR UPDATE', [request.auth.user_id, exam.id]);
    ensure(attempt, 409, 'ATTEMPT_REQUIRED', 'Start the exam before submitting.');
    if (!attempt.submitted_at && new Date(attempt.ends_at).getTime() > Date.now()) {
      validateAnswers(attempt.paper.questions, request.body.answers);
      attempt = await one(transaction, 'UPDATE exam_attempts SET answers=answers || $2::jsonb WHERE id=$1 RETURNING *', [attempt.id, JSON.stringify(request.body.answers)]);
    }
    attempt = await finalize(transaction, attempt);
    const released = !exam.results_at || new Date(exam.results_at).getTime() <= Date.now();
    return { examId: exam.id, submittedAt: attempt.submitted_at, resultsAvailable: released, ...(released ? attempt.result : {}) };
  }));
  route('GET', '/exams/:id/result', { auth: 'active' }, async request => database.transaction(async transaction => {
    const exam = await loadExam(transaction, request);
    let attempt = await one(transaction, 'SELECT * FROM exam_attempts WHERE user_id=$1 AND exam_id=$2 FOR UPDATE', [request.auth.user_id, exam.id]);
    ensure(attempt, 404, 'RESULT_NOT_FOUND', 'No attempt was found.');
    if (!attempt.submitted_at && new Date(attempt.ends_at).getTime() <= Date.now()) attempt = await finalize(transaction, attempt);
    ensure(attempt.submitted_at, 409, 'NOT_SUBMITTED', 'Submit this exam before viewing the result.');
    ensure(!exam.results_at || new Date(exam.results_at).getTime() <= Date.now(), 403, 'RESULTS_NOT_RELEASED', 'Results have not been released yet.');
    const positions = await examPositions(transaction, exam, request.auth.user_id, 1);
    return { examId: exam.id, ...attempt.result, rank: positions.me?.rank ?? null, participants: positions.participants,
      tied: positions.me?.tied ?? false, provisional: positions.provisional, submittedAt: attempt.submitted_at,
      review: attempt.paper.questions.map(question => ({ ...question, yourAnswer: attempt.answers[question.id] ?? null })) };
  }));

  route('GET', '/exams/:id/positions', { auth: 'active', query: pageQuery }, async request => database.transaction(async transaction => {
    const exam = await loadExam(transaction, request);
    ensure(!exam.results_at || new Date(exam.results_at).getTime() <= Date.now(), 403, 'RESULTS_NOT_RELEASED', 'Results have not been released yet.');
    return examPositions(transaction, exam, request.auth.user_id, request.query.limit, request.query.offset);
  }));

  route('GET', '/admin/exams', { auth: 'admin', query: pageQuery.extend({ courseId: uuid.optional(), type: z.enum(['sba', 'mtf', 'mixed', 'ALL']).optional() }) }, async request => (await database.query(`SELECT x.*,c.title AS course_title FROM exams x JOIN courses c ON c.id=x.course_id
    WHERE ($1::uuid IS NULL OR x.course_id=$1) AND ($2::text IS NULL OR $2='ALL' OR x.question_type=$2) ORDER BY x.scheduled_at DESC,x.id LIMIT $3 OFFSET $4`, [request.query.courseId || null, request.query.type || null, request.query.limit, request.query.offset])).rows.map(examDto));
  route('GET', '/admin/exams/:id', { auth: 'admin' }, async request => {
    const exam = await one(database, 'SELECT x.*,c.title AS course_title,(SELECT count(*)::int FROM exam_attempts a WHERE a.exam_id=x.id) AS attempt_count FROM exams x JOIN courses c ON c.id=x.course_id WHERE x.id=$1', [request.params.id]);
    ensure(exam, 404, 'NOT_FOUND', 'Exam not found.');
    return { ...examDto(exam), questions: exam.questions, attemptCount: exam.attempt_count };
  });

  route('GET', '/admin/exams/:id/positions', { auth: 'admin', query: pageQuery }, async request => database.transaction(async transaction => {
    const exam = await one(transaction, 'SELECT * FROM exams WHERE id=$1', [request.params.id]);
    ensure(exam, 404, 'NOT_FOUND', 'Exam not found.');
    return examPositions(transaction, exam, request.auth.user_id, request.query.limit, request.query.offset);
  }));

  route('PATCH', '/admin/exams/:id/attempts/:userId', { auth: 'admin', body: z.object({ score: z.number().min(0) }).strict() }, async request => database.transaction(async transaction => {
    const attempt = await one(transaction, 'SELECT * FROM exam_attempts WHERE exam_id=$1 AND user_id=$2 FOR UPDATE', [request.params.id, request.params.userId]);
    ensure(attempt && attempt.submitted_at, 404, 'NOT_FOUND', 'Completed attempt not found.');
    const newResult = { ...attempt.result, score: request.body.score, isEdited: true };
    await transaction.query('UPDATE exam_attempts SET result=$1::jsonb WHERE id=$2', [JSON.stringify(newResult), attempt.id]);
    return { ok: true };
  }));
  async function saveExam(request, creating) {
    return database.transaction(async transaction => {
      const existing = creating ? null : await one(transaction, 'SELECT * FROM exams WHERE id=$1 FOR UPDATE', [request.params.id]);
      if (!creating) {
        ensure(existing, 404, 'NOT_FOUND', 'Exam not found.');
        ensure(!await one(transaction, 'SELECT id FROM exam_attempts WHERE exam_id=$1 LIMIT 1', [existing.id]), 409, 'EXAM_LOCKED', 'An exam with attempts is immutable. Create a new exam.');
      }
      const previous = existing ? { courseId: existing.course_id, title: existing.title, type: existing.type, questionType: existing.question_type,
        durationMinutes: existing.duration_minutes, negativeMarking: Number(existing.negative_marking), passMark: Number(existing.pass_mark),
        targetQuestionCount: existing.target_question_count, marksPerQuestion: Number(existing.marks_per_question),
        scheduledAt: new Date(existing.scheduled_at).toISOString(), closesAt: existing.closes_at ? new Date(existing.closes_at).toISOString() : null,
        resultsAt: existing.results_at ? new Date(existing.results_at).toISOString() : null, isPublished: existing.is_published, questions: existing.questions } : {};
      const input = examFields.parse({ ...previous, ...request.body });
      ensure(new Set(input.questions.map(question => question.id)).size === input.questions.length, 400, 'DUPLICATE_QUESTION', 'Question IDs must be unique.');
      ensure(!input.isPublished || input.questions.length > 0, 400, 'EMPTY_EXAM', 'A published exam requires questions.');
      ensure(!input.isPublished || input.questions.every(isQuestionComplete), 400, 'INCOMPLETE_QUESTIONS', 'Every question needs a stem, all option texts and an answer key before the exam is published.');
      ensure(input.questionType === 'mixed' || input.questions.every(question => question.type === input.questionType), 400, 'QUESTION_TYPE_MISMATCH', 'Questions must match the exam question type.');
      validatePublication(input);
      ensure(!input.closesAt || new Date(input.closesAt) > new Date(input.scheduledAt), 400, 'INVALID_SCHEDULE', 'Closing time must follow the start.');
      ensure(input.type === 'practice' || (input.closesAt && input.resultsAt && new Date(input.resultsAt) >= new Date(input.closesAt)), 400, 'INVALID_RESULTS_RELEASE', 'Timed exams require a closing time and results released no earlier than closing.');
      const values = [input.courseId, input.title, input.type, input.questionType, input.durationMinutes, input.negativeMarking, input.scheduledAt, input.closesAt, input.resultsAt, input.isPublished, JSON.stringify(input.questions), input.targetQuestionCount, input.marksPerQuestion, input.passMark];
      const columns = ['course_id', 'title', 'type', 'question_type', 'duration_minutes', 'negative_marking', 'scheduled_at', 'closes_at', 'results_at', 'is_published', 'questions', 'target_question_count', 'marks_per_question', 'pass_mark'];
      const exam = creating
        ? await one(transaction, `INSERT INTO exams(${columns.join(',')}) VALUES (${values.map((value, index) => `$${index + 1}`).join(',')}) RETURNING *`, values)
        : await one(transaction, `UPDATE exams SET ${columns.map((column, index) => `${column}=$${index + 1}`).join(',')} WHERE id=$${values.length + 1} RETURNING *`, [...values, existing.id]);
      await audit(transaction, request.auth.user_id, `exam.${creating ? 'created' : 'updated'}`, exam.id);
      return { ...examDto(exam), questions: exam.questions };
    });
  }
  route('POST', '/admin/exams', { auth: 'admin', body: examFields }, request => saveExam(request, true));
  route('PATCH', '/admin/exams/:id', { auth: 'admin', body: examFields.partial() }, request => saveExam(request, false));
  route('DELETE', '/admin/exams/:id', { auth: 'admin' }, async request => database.transaction(async transaction => {
    const exam = await one(transaction, 'SELECT id FROM exams WHERE id=$1 FOR UPDATE', [request.params.id]);
    ensure(exam, 404, 'NOT_FOUND', 'Exam not found.');
    ensure(!await one(transaction, 'SELECT id FROM exam_attempts WHERE exam_id=$1 LIMIT 1', [exam.id]), 409, 'EXAM_LOCKED', 'Exams with attempts cannot be deleted.');
    await transaction.query('DELETE FROM exams WHERE id=$1', [exam.id]);
    await audit(transaction, request.auth.user_id, 'exam.deleted', exam.id);
    return { ok: true };
  }));
}

export async function finalizeExpiredAttempts(database) {
  return database.transaction(async transaction => {
    const attempts = (await transaction.query('SELECT * FROM exam_attempts WHERE submitted_at IS NULL AND ends_at<=now() ORDER BY ends_at LIMIT 100 FOR UPDATE SKIP LOCKED')).rows;
    for (const attempt of attempts) await finalize(transaction, attempt);
    return attempts.length;
  });
}