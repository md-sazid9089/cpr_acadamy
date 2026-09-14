import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

test('instructor reviews enforce enrollment, isolate courses, validate ratings, and support ownership-safe updates and deletion', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const other = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'review-course', title: 'Review course', category: 'FCPS', price: 1000, isPublished: true })).json();
    const second = (await admin.request('POST', '/admin/courses', { slug: 'other-course', title: 'Other course', category: 'FCPS', price: 1000, isPublished: true })).json();
    const path = `/courses/${course.slug}/review`;
    const publicReviews = () => context.app.inject({ method: 'GET', url: `/api${path}s?limit=1&offset=0` });
    const input = { rating: 5, feedback: 'Clear explanations and useful clinical examples.' };
    assert.deepEqual((await publicReviews()).json(), { total: 0, average: 0, reviews: [] });
    assert.equal((await context.app.inject({ method: 'POST', url: `/api${path}`, payload: input })).statusCode, 401);
    assert.equal((await student.request('POST', path, input)).statusCode, 403);
    assert.equal((await admin.request('POST', path, input)).statusCode, 403);
    assert.equal((await student.request('GET', path)).json().canReview, false);
    await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$3,'active',now(),now()+interval '30 days'),($2,$3,'active',now(),now()+interval '30 days')", [student.id, other.id, course.id]);
    assert.equal((await student.request('GET', path)).json().canReview, true);
    for (const invalid of [{ rating: 0 }, { rating: 6 }, { rating: 2.5 }, { feedback: '  ' }, { feedback: 'a'.repeat(2001) }, { userId: other.id }]) {
      assert.equal((await student.request('POST', path, { ...input, ...invalid })).statusCode, 400);
    }
    const created = await student.request('POST', path, input);
    assert.equal(created.statusCode, 200, created.body);
    assert.equal((await student.request('POST', path, { ...input, rating: 4 })).json().id, created.json().id);
    assert.equal((await student.request('GET', path)).json().review.rating, 4);
    await other.request('POST', path, { ...input, rating: 2 });
    const result = (await publicReviews()).json();
    assert.equal(result.total, 2);
    assert.equal(result.average, 3);
    assert.equal(result.reviews.length, 1);
    assert.equal(result.reviews[0].studentName, 'Test User');
    assert.equal('user_id' in result.reviews[0], false);
    assert.equal((await student.request('GET', `/courses/${second.slug}/reviews`)).json().total, 0);
    assert.equal((await student.request('POST', `/courses/${second.slug}/review`, input)).statusCode, 403);
    await other.request('DELETE', path);
    assert.equal((await publicReviews()).json().total, 1);
    assert.equal((await student.request('GET', path)).json().review.id, created.json().id);
    await context.database.query("UPDATE enrollments SET starts_at=now()-interval '2 days',expires_at=now()-interval '1 day' WHERE user_id=$1", [student.id]);
    assert.equal((await student.request('POST', path, input)).statusCode, 403);
    assert.equal((await student.request('DELETE', path)).statusCode, 200);
    assert.equal((await publicReviews()).json().total, 0);
    await admin.request('PATCH', `/admin/courses/${course.id}`, { isPublished: false });
    assert.equal((await publicReviews()).statusCode, 404);
    assert.equal((await student.request('POST', path, input)).statusCode, 404);
  } finally { await context.close(); }
});