import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { gradePaper } from '../src/modules/exams.js';

const questions = [
  { id: 'question-one', type: 'sba', stem: 'Choose one.', options: [{ id: 'first', text: 'First' }, { id: 'second', text: 'Second' }], correctAnswer: 'second', explanation: 'The second option is correct.', marks: 1 },
  { id: 'question-two', type: 'mtf', stem: 'Evaluate each.', options: [{ id: 'first', text: 'First' }, { id: 'second', text: 'Second' }], correctAnswer: { first: true, second: false }, explanation: 'True then false.', marks: 1 },
];

test('SBA and MTF grading counts false as an answer and floors total scores at zero', () => {
  assert.deepEqual(gradePaper({ questions, negativeMarking: 0.25 }, { 'question-one': 'second', 'question-two': { first: false, second: false } }), { score: 1.75, totalMarks: 3, correctCount: 2, wrongCount: 1, skippedCount: 0 });
  assert.equal(gradePaper({ questions, negativeMarking: 0.25 }, { 'question-one': 'first' }).score, 0);
});

test('exam attempts hide keys, preserve deadlines, freeze papers, and reject late answers', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const outsider = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'exam-course', title: 'Exam Course', category: 'FCPS', price: 1000, isPublished: true })).json();
    await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [student.id, course.id]);
    let response = await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'Practice Paper', type: 'practice', questionType: 'mixed', durationMinutes: 10, scheduledAt: '2025-01-01T00:00:00Z', isPublished: true, questions });
    assert.equal(response.statusCode, 200, response.body);
    const exam = response.json();
    assert.equal((await outsider.request('POST', `/exams/${exam.id}/start`)).statusCode, 403);
    response = await student.request('POST', `/exams/${exam.id}/start`);
    assert.equal(response.statusCode, 200, response.body);
    const paper = response.json();
    assert.equal(response.body.includes('correctAnswer'), false);
    assert.equal(response.body.includes('explanation'), false);
    assert.equal((await student.request('POST', `/exams/${exam.id}/start`)).json().endsAt, paper.endsAt);
    assert.equal((await admin.request('PATCH', `/admin/exams/${exam.id}`, { title: 'Edited Paper' })).statusCode, 409);
    assert.equal((await student.request('POST', `/exams/${exam.id}/answers`, { questionId: 'unknown', answer: 'second' })).statusCode, 400);
    assert.equal((await student.request('POST', `/exams/${exam.id}/answers`, { questionId: 'question-one', answer: 'second' })).statusCode, 200);
    await context.database.query("UPDATE exam_attempts SET ends_at=now()-interval '1 second' WHERE exam_id=$1", [exam.id]);
    response = await student.request('POST', `/exams/${exam.id}/submit`, { answers: { 'question-two': { first: true, second: false } } });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().score, 1);
    response = await student.request('GET', `/exams/${exam.id}/result`);
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().review[1].yourAnswer, null);
    assert.equal(response.json().rank, 1);
    assert.equal((await student.request('POST', `/exams/${exam.id}/submit`, { answers: {} })).json().score, 1);
    assert.equal((await outsider.request('GET', `/exams/${exam.id}/result`)).statusCode, 403);
  } finally { await context.close(); }
});