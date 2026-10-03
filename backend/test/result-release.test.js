import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

const questions = [{ id: 'q1', type: 'sba', stem: 'Pick one.', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: 'b', explanation: 'B is right.', marks: 1 }];

async function setup() {
  const context = await fixture();
  const admin = await context.user('admin', '01799999999');
  const student = await context.user('student', '01712345678');
  const peer = await context.user('student', '01812345678');
  const course = (await admin.request('POST', '/admin/courses', { slug: 'release-rules', title: 'Release', category: 'FCPS', price: 100, isPublished: true })).json();
  for (const user of [student, peer]) await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [user.id, course.id]);
  const create = async patch => {
    const response = await admin.request('POST', '/admin/exams', {
      courseId: course.id, title: 'Paper', type: 'live', questionType: 'sba', durationMinutes: 30, isPublished: true, targetQuestionCount: 1, questions,
      // Opened ten minutes ago: a live paper (30 minutes on one shared clock) is still running.
      scheduledAt: new Date(Date.now() - 600000).toISOString(), closesAt: new Date(Date.now() + 3600000).toISOString(), ...patch,
    });
    assert.equal(response.statusCode, 200, response.body);
    return response.json();
  };
  const sit = async (user, exam) => {
    assert.equal((await user.request('POST', `/exams/${exam.id}/start`)).statusCode, 200);
    return user.request('POST', `/exams/${exam.id}/submit`, { answers: { q1: 'b' }, version: 0 });
  };
  return { context, admin, student, peer, course, create, sit };
}

test('without a result time, results appear when the exam closes', async () => {
  const { context, student, create, sit } = await setup();
  try {
    const exam = await create({});
    assert.equal(exam.resultsAt, null, 'the admin left the result time blank');
    assert.equal(exam.resultsReleaseAt, exam.closesAt, 'blank means "when the exam closes"');
    const submitted = (await sit(student, exam)).json();
    assert.equal(submitted.resultsAvailable, false);
    assert.equal(submitted.score, undefined, 'no score in the submit response before release');
    assert.equal((await student.request('GET', `/exams/${exam.id}/result`)).json().code, 'RESULTS_NOT_RELEASED');
    assert.equal((await student.request('GET', `/exams/${exam.id}/positions`)).json().code, 'RESULTS_NOT_RELEASED');
    await context.database.query("UPDATE exams SET closes_at=now()-interval '1 second' WHERE id=$1", [exam.id]);
    const result = await student.request('GET', `/exams/${exam.id}/result`);
    assert.equal(result.statusCode, 200);
    assert.equal(result.json().score, 1);
    assert.equal((await student.request('GET', `/exams/${exam.id}/positions`)).statusCode, 200);
  } finally { await context.close(); }
});

test('an explicit result time overrides the closing time', async () => {
  const { context, student, create, sit } = await setup();
  try {
    const exam = await create({ resultsAt: new Date(Date.now() + 7200000).toISOString() });
    assert.equal(exam.resultsReleaseAt, exam.resultsAt);
    await sit(student, exam);
    await context.database.query("UPDATE exams SET closes_at=now()-interval '1 second' WHERE id=$1", [exam.id]);
    assert.equal((await student.request('GET', `/exams/${exam.id}/result`)).json().code, 'RESULTS_NOT_RELEASED', 'closed, but the admin chose a later release');
    await context.database.query("UPDATE exams SET results_at=now()-interval '1 second' WHERE id=$1", [exam.id]);
    assert.equal((await student.request('GET', `/exams/${exam.id}/result`)).statusCode, 200);
  } finally { await context.close(); }
});

test('results cannot be scheduled before the exam closes, and untimed papers still release on submit', async () => {
  const { context, admin, student, create, sit, course } = await setup();
  try {
    const early = await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'Early', type: 'mock', durationMinutes: 30, scheduledAt: '2025-01-01T00:00:00Z',
      closesAt: '2025-01-02T00:00:00Z', resultsAt: '2025-01-01T12:00:00Z', targetQuestionCount: 1, questions });
    assert.equal(early.statusCode, 400);
    assert.equal(early.json().code, 'INVALID_RESULTS_RELEASE');
    // With no closing time (a practice paper) results still cannot predate the start.
    const beforeStart = await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'Before start', type: 'practice', durationMinutes: 30, scheduledAt: '2025-01-02T00:00:00Z',
      closesAt: null, resultsAt: '2025-01-01T00:00:00Z', targetQuestionCount: 1, questions });
    assert.equal(beforeStart.statusCode, 400);
    assert.equal(beforeStart.json().code, 'INVALID_RESULTS_RELEASE');
    assert.match(beforeStart.json().message, /before the exam starts/);
    const atStart = await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'At start', type: 'practice', durationMinutes: 30, scheduledAt: '2025-01-02T00:00:00Z',
      closesAt: null, resultsAt: '2025-01-02T00:00:00Z', targetQuestionCount: 1, questions });
    assert.equal(atStart.statusCode, 200, atStart.body);
    const practice = await create({ type: 'practice', closesAt: null });
    assert.equal(practice.resultsReleaseAt, null);
    const submitted = (await sit(student, practice)).json();
    assert.equal(submitted.resultsAvailable, true);
    assert.equal(submitted.score, 1);
  } finally { await context.close(); }
});

test('the course leaderboard hides scores until the exam results are released', async () => {
  const { context, admin, student, peer, course, create, sit } = await setup();
  try {
    const exam = await create({});
    await sit(student, exam);
    const hidden = (await peer.request('GET', `/courses/${course.slug}/leaderboard`)).json();
    assert.equal(hidden.participants, 0, 'an embargoed exam contributes no standings');
    assert.deepEqual(hidden.items, []);
    const own = (await student.request('GET', `/courses/${course.slug}/leaderboard`)).json();
    assert.equal(own.me, null, 'not even the student who sat it sees a score early');
    const staff = (await admin.request('GET', `/admin/courses/${course.id}/leaderboard`)).json();
    assert.equal(staff.participants, 1, 'admins still see the live standings');
    await context.database.query("UPDATE exams SET closes_at=now()-interval '1 second' WHERE id=$1", [exam.id]);
    const released = (await peer.request('GET', `/courses/${course.slug}/leaderboard`)).json();
    assert.equal(released.participants, 1);
    assert.equal(released.items[0].score, 1);
  } finally { await context.close(); }
});
