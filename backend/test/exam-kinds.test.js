import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

const questions = [{ id: 'q1', type: 'sba', stem: 'Pick one.', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: 'b', explanation: '', marks: 1 }];
const minutes = count => count * 60000;

test('practice and mock time each student from their own start, live runs one shared clock', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const first = await context.user('student', '01712345678');
    const second = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'exam-kinds', title: 'Kinds', category: 'FCPS', price: 100, isPublished: true })).json();
    for (const user of [first, second]) await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [user.id, course.id]);
    const create = async patch => {
      const response = await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'Kind', questionType: 'sba', durationMinutes: 30, isPublished: true, targetQuestionCount: 1, questions, ...patch });
      assert.equal(response.statusCode, 200, response.body);
      return response.json();
    };
    const opened = new Date(Date.now() - minutes(10));

    // Practice: open-ended, the timer starts when the student does.
    const practice = await create({ type: 'practice', scheduledAt: opened.toISOString(), closesAt: null });
    const own = (await first.request('POST', `/exams/${practice.id}/start`)).json();
    assert.ok(Math.abs(new Date(own.endsAt).getTime() - (Date.now() + minutes(30))) < 5000, 'practice ends a full duration after the student starts');

    // Mock: a window, but still a personal timer capped by the closing time.
    const mock = await create({ type: 'mock', scheduledAt: opened.toISOString(), closesAt: new Date(Date.now() + minutes(20)).toISOString() });
    const capped = (await first.request('POST', `/exams/${mock.id}/start`)).json();
    assert.equal(new Date(capped.endsAt).getTime(), new Date(mock.closesAt).getTime(), 'a mock paper is cut off by its closing time');

    // Live: everyone's paper ends at opening + duration, whenever they join.
    const live = await create({ type: 'live', scheduledAt: opened.toISOString(), closesAt: new Date(Date.now() + minutes(120)).toISOString() });
    const sharedEnd = opened.getTime() + minutes(30);
    assert.equal(new Date((await first.request('POST', `/exams/${live.id}/start`)).json().endsAt).getTime(), sharedEnd);
    assert.equal(new Date((await second.request('POST', `/exams/${live.id}/start`)).json().endsAt).getTime(), sharedEnd, 'a late joiner shares the same end');

    // Live: once the shared clock has run out nobody can join, even though the closing time is hours away.
    const over = await create({ type: 'live', scheduledAt: new Date(Date.now() - minutes(40)).toISOString(), closesAt: new Date(Date.now() + minutes(120)).toISOString() });
    const late = await first.request('POST', `/exams/${over.id}/start`);
    assert.equal(late.statusCode, 409);
    assert.equal(late.json().code, 'EXAM_CLOSED');
    assert.match(late.json().message, /live exam has already ended/);
    assert.equal((await first.request('GET', '/exams')).json().find(exam => exam.id === over.id).status, 'published', 'the list stops offering a live exam that has ended');
    assert.equal((await first.request('GET', '/exams')).json().find(exam => exam.id === live.id).status, 'running');
  } finally { await context.close(); }
});
