import assert from 'node:assert/strict';
import test from 'node:test';
import { gradePaper } from '../src/modules/exams.js';

const sba = (id, marks = 1) => ({ id, type: 'sba', marks, correctAnswer: 'a', options: [] });
const mtf = (id, marks = 0.2) => ({
  id, type: 'mtf', marks,
  options: ['s1', 's2', 's3', 's4', 's5'].map(optionId => ({ id: optionId })),
  correctAnswer: { s1: true, s2: true, s3: true, s4: true, s5: true },
});
const paper = (questions, groupPenalty, negativeMarking = 0) => ({ questions, negativeMarking, passMark: 50, groupPenalty });
const tenSba = Array.from({ length: 10 }, (_, index) => sba(`q${index}`));
/** Answers the first `right` questions correctly, the next `wrong` wrongly, and leaves the rest blank. */
const answer = (right, wrong) => Object.fromEntries(tenSba.slice(0, right + wrong).map((question, index) => [question.id, index < right ? 'a' : 'b']));

test('every full group of wrong SBA answers cuts a share of the total marks', () => {
  const rule = { sba: { size: 5, penalty: 5 } }; // 5% of 10 marks = 0.5 per group
  assert.deepEqual(
    [[5, 4], [5, 5], [1, 9], [0, 10]].map(([right, wrong]) => gradePaper(paper(tenSba, rule), answer(right, wrong)).score),
    [5, 4.5, 0.5, 0],
  );
  assert.equal(gradePaper(paper(tenSba, rule), answer(5, 5)).groupPenalty, 0.5);
  // Ten wrong is two groups (1 mark), but the score still never goes below 0.
  assert.equal(gradePaper(paper(tenSba, rule), answer(0, 10)).groupPenalty, 1);
});

test('blank answers never count towards a group', () => {
  const result = gradePaper(paper(tenSba, { sba: { size: 5, penalty: 5 } }), answer(5, 0));
  assert.equal(result.score, 5);
  assert.equal(result.groupPenalty, undefined);
});

test('the group rule is added on top of the per-answer penalty', () => {
  // 5 wrong at 25% each = 1.25, plus one group of 5 at 5% of 10 marks = 0.5.
  assert.equal(gradePaper(paper(tenSba, { sba: { size: 5, penalty: 5 } }, 25), answer(5, 5)).score, 3.25);
});

test('SBA and MCQ keep separate counts, and MCQ counts each wrong statement', () => {
  const questions = [sba('a1'), sba('a2'), sba('a3'), sba('a4'), mtf('m1')]; // 4 + 1 = 5 marks
  const answers = { a1: 'b', a2: 'b', a3: 'b', a4: 'a', m1: { s1: false, s2: false, s3: false, s4: false, s5: true } };
  // SBA: 3 wrong, rule every 4 -> no group. MCQ: 4 wrong statements, rule every 4 -> one group of 10% of 5 = 0.5.
  const result = gradePaper(paper(questions, { sba: { size: 4, penalty: 10 }, mtf: { size: 4, penalty: 10 } }), answers);
  assert.equal(result.groupPenalty, 0.5);
  assert.equal(result.score, 1 + 0.2 - 0.5);
});

test('a rule that is off, or a paper copied before the feature existed, cuts nothing', () => {
  assert.equal(gradePaper(paper(tenSba, { sba: { size: 0, penalty: 0 } }), answer(5, 5)).score, 5);
  assert.equal(gradePaper(paper(tenSba, undefined), answer(5, 5)).score, 5);
});

test('end to end: an admin saves a group rule, it freezes with the paper, and results apply it', async () => {
  const { fixture } = await import('../test-support/fixture.js');
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const guesser = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'group-course', title: 'Group Course', category: 'FCPS', price: 1000, isPublished: true })).json();
    for (const user of [student, guesser]) {
      await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [user.id, course.id]);
    }
    const questions = Array.from({ length: 10 }, (_, index) => ({
      id: `g${index}`, type: 'sba', stem: `Question ${index + 1}`,
      options: ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, text: id.toUpperCase() })),
      correctAnswer: 'a', explanation: 'A is right.', marks: 1,
    }));
    const base = { courseId: course.id, title: 'Group Paper', type: 'practice', questionType: 'sba', durationMinutes: 10, scheduledAt: '2025-01-01T00:00:00Z', isPublished: true, questions, targetQuestionCount: 10, sbaMarks: 1 };

    // A rule needs both numbers.
    let response = await admin.request('POST', '/admin/exams', { ...base, sbaGroupSize: 5, sbaGroupPenalty: 0 });
    assert.equal(response.statusCode, 400, response.body);
    assert.equal(response.json().code, 'INVALID_GROUP_PENALTY');
    response = await admin.request('POST', '/admin/exams', { ...base, sbaGroupSize: 0, sbaGroupPenalty: 5 });
    assert.equal(response.json().code, 'INVALID_GROUP_PENALTY');
    response = await admin.request('POST', '/admin/exams', { ...base, sbaGroupSize: 5, sbaGroupPenalty: 101 });
    assert.equal(response.statusCode, 400, response.body);

    response = await admin.request('POST', '/admin/exams', { ...base, sbaGroupSize: 5, sbaGroupPenalty: 5 });
    assert.equal(response.statusCode, 200, response.body);
    const exam = response.json();
    assert.equal(exam.totalMarks, 10);
    assert.deepEqual([exam.sbaGroupSize, exam.sbaGroupPenalty, exam.mtfGroupSize, exam.mtfGroupPenalty], [5, 5, 0, 0]);
    // Saving an unrelated field keeps the rule.
    response = await admin.request('PATCH', `/admin/exams/${exam.id}`, { title: 'Group Paper 1' });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().sbaGroupSize, 5);

    // Once a student starts, the rule is frozen with the rest of the marking.
    assert.equal((await student.request('POST', `/exams/${exam.id}/start`)).statusCode, 200);
    response = await admin.request('PATCH', `/admin/exams/${exam.id}`, { sbaGroupSize: 2 });
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'EXAM_LOCKED');

    // 5 right, 5 wrong: 5 earned, one group of 5 cuts 5% of 10 = 0.5.
    const sheet = Object.fromEntries(questions.map((question, index) => [question.id, index < 5 ? 'a' : 'b']));
    response = await student.request('POST', `/exams/${exam.id}/submit`, { answers: sheet });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().score, 4.5);
    response = await student.request('GET', `/exams/${exam.id}/result`);
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().score, 4.5);
    assert.equal(response.json().groupPenalty, 0.5);
    assert.equal(response.json().wrongCount, 5);

    // All 10 wrong: two groups, but the score stays at 0.
    assert.equal((await guesser.request('POST', `/exams/${exam.id}/start`)).statusCode, 200);
    response = await guesser.request('POST', `/exams/${exam.id}/submit`, { answers: Object.fromEntries(questions.map(question => [question.id, 'b'])) });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().score, 0);
  } finally { await context.close(); }
});
