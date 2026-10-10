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

test('after students start, an admin can still move the closing and result times later, but nothing else', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const early = await context.user('student', '01712345678');
    const late = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'reschedule', title: 'Reschedule', category: 'FCPS', price: 100, isPublished: true })).json();
    for (const user of [early, late]) await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [user.id, course.id]);
    const iso = offset => new Date(Date.now() + offset).toISOString();
    const create = async patch => {
      const response = await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'Weekly mock', questionType: 'sba', durationMinutes: 30, isPublished: true, targetQuestionCount: 1, questions, ...patch });
      assert.equal(response.statusCode, 200, response.body);
      return response.json();
    };

    // One student sits a mock; it then closes before the rest of the batch could take it. Results are due tomorrow.
    const mock = await create({ type: 'mock', scheduledAt: iso(-minutes(60)), closesAt: iso(minutes(20)), resultsAt: iso(minutes(24 * 60)) });
    assert.equal((await early.request('POST', `/exams/${mock.id}/start`)).statusCode, 200);
    assert.equal((await early.request('POST', `/exams/${mock.id}/submit`, { answers: { q1: 'b' } })).statusCode, 200);
    await context.database.query("UPDATE exams SET closes_at=now()-interval '5 minutes' WHERE id=$1", [mock.id]);
    assert.equal((await late.request('POST', `/exams/${mock.id}/start`)).json().code, 'EXAM_CLOSED');

    // The paper and its marking stay frozen.
    for (const patch of [{ title: 'Renamed' }, { durationMinutes: 60 }, { questions: [] }, { closesAt: iso(minutes(120)), passMark: 50 }]) {
      const refused = await admin.request('PATCH', `/admin/exams/${mock.id}`, patch);
      assert.equal(refused.statusCode, 409, JSON.stringify(patch));
      assert.equal(refused.json().code, 'EXAM_LOCKED');
    }
    let response = await admin.request('PATCH', `/admin/exams/${mock.id}`, { closesAt: iso(-minutes(10)) });
    assert.equal(response.json().code, 'CLOSING_TIME_EARLIER', 'the closing time cannot move earlier');
    response = await admin.request('PATCH', `/admin/exams/${mock.id}`, { closesAt: iso(-minutes(1)) });
    assert.equal(response.json().code, 'CLOSING_TIME_PAST', 'a reopened exam needs a closing time in the future');
    response = await admin.request('PATCH', `/admin/exams/${mock.id}`, { closesAt: iso(minutes(120)), resultsAt: iso(minutes(60)) });
    assert.equal(response.json().code, 'INVALID_RESULTS_RELEASE', 'results still cannot come out before the exam closes');

    // Reopen it for two hours and publish results an hour after that.
    response = await admin.request('PATCH', `/admin/exams/${mock.id}`, { closesAt: iso(minutes(120)), resultsAt: iso(minutes(180)) });
    assert.equal(response.statusCode, 200, response.body);
    assert.ok(Math.abs(new Date(response.json().closesAt).getTime() - (Date.now() + minutes(120))) < 5000);
    const audit = await context.database.query("SELECT details FROM audit_log WHERE action='exam.rescheduled' AND entity_id=$1", [mock.id]);
    assert.equal(audit.rows.length, 1);
    const stored = await context.database.query('SELECT questions,duration_minutes,title FROM exams WHERE id=$1', [mock.id]);
    assert.equal(stored.rows[0].title, 'Weekly mock');
    assert.equal(stored.rows[0].questions.length, 1, 'the paper is untouched');

    // The student who missed it can now sit it, with a full timer; the early student's result stays embargoed.
    response = await late.request('POST', `/exams/${mock.id}/start`);
    assert.equal(response.statusCode, 200, response.body);
    assert.ok(Math.abs(new Date(response.json().endsAt).getTime() - (Date.now() + minutes(30))) < 5000);
    assert.equal((await early.request('GET', `/exams/${mock.id}/result`)).json().code, 'RESULTS_NOT_RELEASED');
    assert.equal((await admin.request('PATCH', `/admin/exams/${mock.id}`, { closesAt: iso(minutes(30)) })).json().code, 'CLOSING_TIME_EARLIER');

    // Once results are out, nothing moves: the answers may already be circulating.
    await context.database.query("UPDATE exams SET closes_at=now()-interval '2 minutes', results_at=now()-interval '1 minute' WHERE id=$1", [mock.id]);
    response = await admin.request('PATCH', `/admin/exams/${mock.id}`, { closesAt: iso(minutes(240)), resultsAt: iso(minutes(300)) });
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'RESULTS_ALREADY_RELEASED');

    // A live exam keeps its shared clock; its result time can still move.
    const live = await create({ type: 'live', scheduledAt: iso(-minutes(5)), closesAt: iso(minutes(60)), resultsAt: iso(minutes(90)) });
    assert.equal((await early.request('POST', `/exams/${live.id}/start`)).statusCode, 200);
    assert.equal((await admin.request('PATCH', `/admin/exams/${live.id}`, { closesAt: iso(minutes(120)) })).json().code, 'LIVE_SCHEDULE_LOCKED');
    assert.equal((await admin.request('PATCH', `/admin/exams/${live.id}`, { resultsAt: iso(minutes(150)) })).statusCode, 200);

    // An exam nobody has started is still fully editable.
    const fresh = await create({ type: 'mock', scheduledAt: iso(-minutes(5)), closesAt: iso(minutes(60)) });
    assert.equal((await admin.request('PATCH', `/admin/exams/${fresh.id}`, { title: 'Renamed freely', closesAt: iso(minutes(30)) })).statusCode, 200);
  } finally { await context.close(); }
});

test('marks are set once per question type and written onto every question of that type', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user('student', '01712345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'type-marks', title: 'Type marks', category: 'FCPS', price: 100, isPublished: true })).json();
    await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [student.id, course.id]);
    const options = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, text: id.toUpperCase() }));
    const sba = (id, marks) => ({ id, type: 'sba', stem: 'Pick one.', options, correctAnswer: 'b', explanation: '', marks });
    const mtf = (id, marks) => ({ id, type: 'mtf', stem: 'True or false?', options, correctAnswer: { a: true, b: false, c: true, d: false, e: true }, explanation: '', marks });

    // The questions arrive with assorted marks; the exam's per-type values win.
    let response = await admin.request('POST', '/admin/exams', {
      courseId: course.id, title: 'Mixed', type: 'practice', questionType: 'mixed', durationMinutes: 30, scheduledAt: new Date(Date.now() - 60000).toISOString(),
      targetQuestionCount: 4, sbaMarks: 3, mtfMarks: 0.5, questions: [sba('s1', 1), sba('s2', 7), mtf('m1', 0.2), mtf('m2', 0.9)],
    });
    assert.equal(response.statusCode, 200, response.body);
    let exam = response.json();
    assert.deepEqual([exam.sbaMarks, exam.mtfMarks], [3, 0.5]);
    assert.deepEqual(exam.questions.map(question => question.marks), [3, 3, 0.5, 0.5]);
    assert.equal(exam.totalMarks, 3 * 2 + 0.5 * 5 * 2);

    // Changing one type's marks rewrites every question of that type, and only that type.
    response = await admin.request('PATCH', `/admin/exams/${exam.id}`, { sbaMarks: 4 });
    assert.equal(response.statusCode, 200, response.body);
    exam = response.json();
    assert.deepEqual(exam.questions.map(question => question.marks), [4, 4, 0.5, 0.5]);
    assert.equal(exam.totalMarks, 4 * 2 + 0.5 * 5 * 2);

    // A question added later takes its type's marks, whatever the client put on it.
    response = await admin.request('PATCH', `/admin/exams/${exam.id}`, { targetQuestionCount: 5, questions: [...exam.questions, sba('s3', 9)] });
    assert.deepEqual(response.json().questions.map(question => question.marks), [4, 4, 0.5, 0.5, 4]);

    // A single-type paper mirrors its marks into marksPerQuestion.
    const single = (await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'SBA only', questionType: 'sba', durationMinutes: 30, scheduledAt: new Date(Date.now() - 60000).toISOString(), targetQuestionCount: 1, sbaMarks: 2.5, questions: [sba('only', 1)] })).json();
    assert.deepEqual([single.sbaMarks, single.marksPerQuestion, single.questions[0].marks], [2.5, 2.5, 2.5]);

    // Grading reads those marks, and once a student starts, the marks are frozen with the paper.
    response = await admin.request('PATCH', `/admin/exams/${exam.id}`, { isPublished: true });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal((await student.request('POST', `/exams/${exam.id}/start`)).statusCode, 200);
    response = await student.request('POST', `/exams/${exam.id}/submit`, { answers: { s1: 'b', s2: 'c', m1: { a: true, b: false, c: true, d: false, e: true } } });
    assert.equal(response.json().score, 4 + 0.5 * 5, 'a right SBA earns its type marks, a right MCQ earns its statements');
    response = await admin.request('PATCH', `/admin/exams/${exam.id}`, { sbaMarks: 1 });
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'EXAM_LOCKED');
  } finally { await context.close(); }
});
