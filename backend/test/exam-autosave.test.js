import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { one } from '../src/db.js';

const questions = ['q1', 'q2', 'q3'].map(id => ({ id, type: 'sba', stem: `Stem ${id}`, options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: 'a', explanation: '', marks: 1 }));

async function attempt() {
  const context = await fixture();
  const admin = await context.user('admin', '01799999999');
  const student = await context.user('student', '01712345678');
  const course = (await admin.request('POST', '/admin/courses', { slug: 'autosave', title: 'Autosave', category: 'FCPS', price: 100, isPublished: true })).json();
  await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [student.id, course.id]);
  const exam = (await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'Paper', type: 'practice', questionType: 'sba', durationMinutes: 30, scheduledAt: new Date(Date.now() - 3600000).toISOString(), isPublished: true, targetQuestionCount: 3, questions })).json();
  assert.equal((await student.request('POST', `/exams/${exam.id}/start`)).statusCode, 200);
  const save = (body, extra = {}) => student.request('POST', `/exams/${exam.id}/answers`, { ...body, ...extra });
  const submit = body => student.request('POST', `/exams/${exam.id}/submit`, body);
  const stored = async () => one(context.database, 'SELECT answers,version,submitted_at FROM exam_attempts WHERE exam_id=$1 AND user_id=$2', [exam.id, student.id]);
  return { context, exam, save, submit, stored };
}

test('a tab retrying a save whose response was lost is not locked out', async () => {
  const { context, save, submit, stored } = await attempt();
  try {
    const tab = { clientId: 'tab-one-client' };
    assert.equal((await save({ questionId: 'q1', answer: 'a', version: 0 }, tab)).json().version, 1, 'the server saved it, but suppose the client never saw this');
    const retry = await save({ questionId: 'q1', answer: 'a', version: 0 }, tab);
    assert.equal(retry.statusCode, 200, 'the same tab retries with its stale version');
    assert.equal(retry.json().version, 2, 'and learns the current version');
    assert.equal((await save({ questionId: 'q2', answer: 'b', version: retry.json().version }, tab)).statusCode, 200, 'later autosaves carry on');
    const finished = await submit({ answers: { q1: 'a', q2: 'b', q3: 'a' }, version: 0, clientId: 'tab-one-client' });
    assert.equal(finished.statusCode, 200, 'submit with a stale version from the same tab goes through');
    assert.deepEqual((await stored()).answers, { q1: 'a', q2: 'b', q3: 'a' });
  } finally { await context.close(); }
});

test('a second tab with a stale version is still rejected, and cannot overwrite newer answers when it submits', async () => {
  const { context, save, submit, stored } = await attempt();
  try {
    assert.equal((await save({ questionId: 'q1', answer: 'a', version: 0 }, { clientId: 'tab-one-client' })).statusCode, 200);
    const stale = await save({ questionId: 'q1', answer: 'b', version: 0 }, { clientId: 'tab-two-client' });
    assert.equal(stale.statusCode, 409);
    assert.equal(stale.json().code, 'ATTEMPT_VERSION_CONFLICT');
    assert.equal((await save({ questionId: 'q1', answer: 'b', version: 0 })).statusCode, 409, 'no client id: strict versioning as before');
    const finished = await submit({ answers: { q1: 'b', q2: 'b' }, version: 0, clientId: 'tab-two-client' });
    assert.equal(finished.statusCode, 200, 'the deadline is never blocked by a version mismatch');
    assert.deepEqual((await stored()).answers, { q1: 'a', q2: 'b' }, "tab two only filled the gap; tab one's saved answer wins");
  } finally { await context.close(); }
});

test('submit works without a version', async () => {
  const { context, submit, stored } = await attempt();
  try {
    assert.equal((await submit({ answers: { q1: 'a' } })).statusCode, 200);
    const row = await stored();
    assert.ok(row.submitted_at);
    assert.deepEqual(row.answers, { q1: 'a' });
  } finally { await context.close(); }
});

test('autosave keeps validating answers against the frozen paper once its shape is cached', async () => {
  const { context, exam, save } = await attempt();
  try {
    const tab = { clientId: 'tab-cache-client' };
    assert.equal((await save({ questionId: 'q1', answer: 'a', version: 0 }, tab)).statusCode, 200);
    for (const [body, expected] of [[{ questionId: 'q9', answer: 'a' }, 400], [{ questionId: 'q1', answer: 'zzz' }, 400], [{ questionId: 'q1', answer: { a: true } }, 400], [{ questionId: 'q2', answer: 'b' }, 200]]) {
      const response = await save({ ...body, version: 1 }, tab);
      assert.equal(response.statusCode, expected, JSON.stringify(body));
      if (expected === 200) assert.equal(response.json().version, 2);
    }
    const row = await one(context.database, 'SELECT answers FROM exam_attempts WHERE exam_id=$1', [exam.id]);
    assert.deepEqual(row.answers, { q1: 'a', q2: 'b' });
  } finally { await context.close(); }
});

test('exam lists report the same counts and marks as the full exam record', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user('student', '01712345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'list-parity', title: 'Parity', category: 'FCPS', price: 100, isPublished: true })).json();
    await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [student.id, course.id]);
    const mixed = [
      { id: 'm1', type: 'mtf', stem: 'Judge each.', options: ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, text: id })), correctAnswer: { a: true, b: false, c: true, d: false, e: true }, explanation: '', marks: 0.4 },
      { id: 's1', type: 'sba', stem: 'Pick one.', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: 'b', explanation: '', marks: 2 },
      { id: 's2', type: 'sba', stem: 'Pick again.', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: 'a', explanation: '', marks: 2 },
    ];
    const created = (await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'Parity paper', type: 'practice', questionType: 'mixed', durationMinutes: 30, scheduledAt: '2025-01-01T00:00:00Z', isPublished: true, targetQuestionCount: 3, questions: mixed })).json();
    const full = (await admin.request('GET', `/admin/exams/${created.id}`)).json();
    const listed = (await student.request('GET', '/exams')).json().find(entry => entry.id === created.id);
    assert.equal(listed.questionCount, 3);
    assert.equal(listed.totalMarks, 6, '5 true/false items at 0.4 plus two single-best-answers at 2');
    for (const field of ['questionCount', 'completeQuestionCount', 'totalMarks', 'title', 'status', 'durationMinutes', 'scheduledAt', 'courseTitle']) assert.equal(listed[field], full[field], field);
    const byCourse = (await student.request('GET', `/courses/${course.slug}/exams`)).json().find(entry => entry.id === created.id);
    assert.equal(byCourse.totalMarks, 6);
  } finally { await context.close(); }
});
