import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

test('catalog publication, admin permissions, and enrollment-protected lessons', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const pending = await context.user('student', '01812345678', 'awaiting_approval');
    const input = { slug: 'medicine-foundation', title: 'Medicine Foundation', category: 'FCPS', price: 1000 };
    assert.equal((await student.request('POST', '/admin/courses', input)).statusCode, 403);
    assert.equal((await pending.request('GET', '/admin/courses')).statusCode, 403);
    let response = await admin.request('POST', '/admin/courses', input);
    assert.equal(response.statusCode, 200, response.body);
    const course = response.json();
    assert.equal((await student.request('GET', `/courses/${course.slug}`)).statusCode, 404);
    response = await admin.request('PATCH', `/admin/courses/${course.id}`, { isPublished: true, discountPrice: 800 });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal((await student.request('GET', '/courses')).json()[0].price, 1000);
    response = await admin.request('POST', '/admin/videos', { courseId: course.id, title: 'Orientation', src: 'https://media.example.test/video.mp4', scheduledAt: '2025-01-01T00:00:00Z', status: 'published' });
    assert.equal(response.statusCode, 200, response.body);
    const lesson = response.json();
    assert.equal((await student.request('GET', `/courses/${course.slug}/videos`)).statusCode, 403);
    assert.equal((await student.request('GET', `/courses/${course.slug}`)).body.includes('video.mp4'), false);
    await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [student.id, course.id]);
    response = await student.request('GET', `/courses/${course.slug}/videos`);
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json()[0].videos[0].src, lesson.src);
    assert.equal((await student.request('POST', `/lessons/${lesson.id}/complete`)).statusCode, 200);
    await context.database.query("UPDATE enrollments SET starts_at=now()-interval '2 days',expires_at=now()-interval '1 day' WHERE user_id=$1", [student.id]);
    assert.equal((await student.request('GET', `/courses/${course.slug}/videos`)).statusCode, 403);
  } finally { await context.close(); }
});

test('chapters group a course\'s lessons for admins and students', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const course = (await admin.request('POST', '/admin/courses', { slug: 'airway-management', title: 'Airway Management', category: 'FCPS', price: 500 })).json();
    await admin.request('PATCH', `/admin/courses/${course.id}`, { isPublished: true });
    await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [student.id, course.id]);

    let response = await admin.request('POST', '/admin/chapters', { courseId: course.id, title: 'Basic Airway' });
    assert.equal(response.statusCode, 200, response.body);
    const chapter = response.json();
    assert.equal(chapter.title, 'Basic Airway');

    // A lesson may not point at another course's chapter.
    const otherCourse = (await admin.request('POST', '/admin/courses', { slug: 'other-course', title: 'Other', category: 'FCPS', price: 100 })).json();
    const otherChapter = (await admin.request('POST', '/admin/chapters', { courseId: otherCourse.id, title: 'Foreign' })).json();
    assert.equal((await admin.request('POST', '/admin/videos', { courseId: course.id, title: 'Mismatched', scheduledAt: '2025-01-01T00:00:00Z', chapterId: otherChapter.id })).statusCode, 400);

    response = await admin.request('POST', '/admin/videos', { courseId: course.id, title: 'Bag-valve-mask', src: 'https://media.example.test/bvm.mp4', scheduledAt: '2025-01-01T00:00:00Z', status: 'published', chapterId: chapter.id });
    assert.equal(response.statusCode, 200, response.body);
    await admin.request('POST', '/admin/videos', { courseId: course.id, title: 'Unsorted clip', src: 'https://media.example.test/misc.mp4', scheduledAt: '2025-01-02T00:00:00Z', status: 'published' });

    const groups = (await student.request('GET', `/courses/${course.slug}/videos`)).json();
    assert.equal(groups.length, 2);
    assert.equal(groups[0].chapterTitle, 'Basic Airway');
    assert.equal(groups[0].videos[0].title, 'Bag-valve-mask');
    assert.equal(groups[1].chapterTitle, 'Uncategorized');
    assert.equal(groups[1].videos[0].title, 'Unsorted clip');

    await admin.request('DELETE', `/admin/chapters/${chapter.id}`);
    const afterDelete = (await student.request('GET', `/courses/${course.slug}/videos`)).json();
    assert.equal(afterDelete.length, 1);
    assert.equal(afterDelete[0].chapterTitle, 'Uncategorized');
  } finally { await context.close(); }
});