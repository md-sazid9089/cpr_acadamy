import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { finalizeExpiredAttempts } from '../src/modules/exams.js';

test('exam positions share ties, paginate globally, protect results, and exclude unfinished and admin attempts', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const students = [];
    for (const mobile of ['01712345678', '01812345678', '01912345678', '01612345678', '01512345678']) {
      students.push(await context.user('student', mobile));
    }
    const outsider = await context.user('student', '01312345678');
    const course = (await admin.request('POST', '/admin/courses', {
      slug: 'position-course', title: 'Position Course', category: 'FCPS', price: 1000, isPublished: true,
    })).json();
    for (const student of students) {
      await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [student.id, course.id]);
    }
    const response = await admin.request('POST', '/admin/exams', {
      courseId: course.id, title: 'Position Paper', type: 'practice', questionType: 'sba',
      durationMinutes: 10, scheduledAt: '2025-01-01T00:00:00Z', isPublished: true, targetQuestionCount: 3,
      questions: ['first', 'second', 'third'].map(id => ({
        id, type: 'sba', stem: 'Choose the correct answer.', marks: 0.5,
        options: [{ id: 'yes', text: 'Correct' }, { id: 'no', text: 'Incorrect' }], correctAnswer: 'yes',
      })),
    });
    assert.equal(response.statusCode, 200, response.body);
    const exam = response.json();
    const path = `/exams/${exam.id}/positions`;
    const empty = (await students[0].request('GET', path)).json();
    assert.equal(empty.participants, 0);
    assert.equal(empty.me, null);
    assert.equal(empty.averageScore, null);
    assert.deepEqual(empty.items, []);
    const answers = [
      { first: 'yes', second: 'yes', third: 'yes' },
      { first: 'yes', second: 'yes' },
      { first: 'yes', third: 'yes' },
      {},
    ];
    for (const [index, student] of students.entries()) {
      assert.equal((await student.request('POST', `/exams/${exam.id}/start`)).statusCode, 200);
      if (index < answers.length) assert.equal((await student.request('POST', `/exams/${exam.id}/submit`, { answers: answers[index] })).statusCode, 200);
    }
    await admin.request('POST', `/exams/${exam.id}/start`);
    await admin.request('POST', `/exams/${exam.id}/submit`, { answers: answers[0] });
    const standingsResponse = await students[3].request('GET', `${path}?limit=2`);
    assert.equal(standingsResponse.statusCode, 200, standingsResponse.body);
    const standings = standingsResponse.json();
    assert.equal(standings.participants, 4);
    assert.equal(standings.pending, 1);
    assert.equal(standings.provisional, true);
    assert.equal(standings.highestScore, 1.5);
    assert.equal(standings.averageScore, 0.875);
    assert.equal(standings.me.rank, 4);
    assert.equal(standings.me.score, 0);
    assert.deepEqual(standings.items.map(entry => entry.rank), [1, 2]);
    assert.equal(standings.items[1].tied, true);
    assert.deepEqual(Object.keys(standings.items[0]).sort(), ['isMe', 'name', 'passed', 'rank', 'score', 'tied', 'totalMarks'].sort());
    const next = (await students[3].request('GET', `${path}?limit=2&offset=2`)).json();
    assert.deepEqual(next.items.map(entry => entry.rank), [2, 4]);
    assert.equal(next.items[1].isMe, true);
    const tiedResult = (await students[1].request('GET', `/exams/${exam.id}/result`)).json();
    assert.equal(tiedResult.rank, 2);
    assert.equal(tiedResult.tied, true);
    assert.equal(tiedResult.participants, 4);
    assert.equal(tiedResult.provisional, true);
    assert.equal((await students[4].request('GET', path)).json().me, null);
    const beyond = (await students[0].request('GET', `${path}?offset=100`)).json();
    assert.deepEqual(beyond.items, []);
    assert.equal(beyond.participants, 4);
    assert.equal(beyond.me.rank, 1);
    assert.equal((await students[0].request('GET', `${path}?limit=101`)).statusCode, 400);
    assert.equal((await students[0].request('GET', `${path}?offset=-1`)).statusCode, 400);
    assert.equal((await outsider.request('GET', path)).statusCode, 403);
    assert.equal((await context.app.inject({ method: 'GET', url: `/api${path}` })).statusCode, 401);

    await context.database.query("UPDATE exams SET results_at=now()+interval '1 hour' WHERE id=$1", [exam.id]);
    const unreleased = await students[0].request('GET', path);
    assert.equal(unreleased.statusCode, 403);
    assert.equal(unreleased.json().code, 'RESULTS_NOT_RELEASED');
    assert.equal((await students[0].request('GET', `/exams/${exam.id}/result`)).statusCode, 403);
    await context.database.query("UPDATE exams SET closes_at=now()-interval '1 minute',results_at=now()-interval '1 second' WHERE id=$1", [exam.id]);
    assert.equal((await students[0].request('GET', path)).json().provisional, true);
    await context.database.query("UPDATE exam_attempts SET ends_at=now()-interval '1 second' WHERE exam_id=$1 AND submitted_at IS NULL", [exam.id]);
    await finalizeExpiredAttempts(context.database);
    const final = (await students[4].request('GET', path)).json();
    assert.equal(final.provisional, false);
    assert.equal(final.participants, 5);
    assert.equal(final.pending, 0);
    assert.equal(final.me.rank, 4);
    assert.equal(final.me.tied, true);
    assert.deepEqual(final.items.map(entry => entry.rank), [1, 2, 2, 4, 4]);
    await context.database.query('UPDATE exams SET is_published=false WHERE id=$1', [exam.id]);
    assert.equal((await students[0].request('GET', path)).statusCode, 404);
  } finally { await context.close(); }
});