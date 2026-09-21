import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { signContentToken } from '../src/security.js';
import { one } from '../src/db.js';

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
    const video = response.json()[0].videos[0];
    // A directly-hosted file's permanent URL is never sent to the client — only a YouTube link would be.
    assert.equal(video.src, '');
    assert.equal(video.hasVideo, true);
    assert.equal(video.videoIsFile, true);
    const contentUrl = await student.request('GET', `/lessons/${lesson.id}/content-url?kind=video`);
    assert.equal(contentUrl.statusCode, 200, contentUrl.body);
    assert.match(contentUrl.json().url, /^\/api\/content\/[^/]+\.[^/]+$/);
    assert.equal((await student.request('POST', `/lessons/${lesson.id}/complete`)).statusCode, 200);
    await context.database.query("UPDATE enrollments SET starts_at=now()-interval '2 days',expires_at=now()-interval '1 day' WHERE user_id=$1", [student.id]);
    assert.equal((await student.request('GET', `/courses/${course.slug}/videos`)).statusCode, 403);
    // Expired enrollment also stops new signed links from being minted, even though a link
    // handed out before expiry keeps working until its own (short) TTL runs out.
    assert.equal((await student.request('GET', `/lessons/${lesson.id}/content-url?kind=video`)).statusCode, 403);
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

test('signed content links: notes require the URL to be minted first, and the token cannot be reused after tampering or expiry', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const course = (await admin.request('POST', '/admin/courses', { slug: 'notes-course', title: 'Notes Course', category: 'FCPS', price: 200 })).json();
    await admin.request('PATCH', `/admin/courses/${course.id}`, { isPublished: true });
    await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [student.id, course.id]);

    const youTube = (await admin.request('POST', '/admin/videos', {
      courseId: course.id, title: 'Intro', src: 'https://youtu.be/dQw4w9WgXcQ', notesUrl: 'https://media.example.test/intro.pdf',
      scheduledAt: '2025-01-01T00:00:00Z', status: 'published',
    })).json();

    const groups = (await student.request('GET', `/courses/${course.slug}/videos`)).json();
    const video = groups[0].videos[0];
    // YouTube links are inherently public and needed by the embed, so they pass through untouched.
    assert.equal(video.src, 'https://youtu.be/dQw4w9WgXcQ');
    // The lecture-notes PDF is never inlined, regardless of the video's own hosting.
    assert.equal(video.notesUrl, '');
    assert.equal(video.hasNotes, true);

    // No signed link is issued for a YouTube-hosted video — the raw URL already serves that role.
    assert.equal((await student.request('GET', `/lessons/${youTube.id}/content-url?kind=video`)).statusCode, 400);

    const notesLink = await student.request('GET', `/lessons/${youTube.id}/content-url?kind=notes`);
    assert.equal(notesLink.statusCode, 200, notesLink.body);
    const token = notesLink.json().url.split('/content/')[1];

    // A missing kind fails validation, and a lesson with no notes 404s rather than issuing a link.
    assert.equal((await student.request('GET', `/lessons/${youTube.id}/content-url`)).statusCode, 400);
    const noNotes = (await admin.request('POST', '/admin/videos', { courseId: course.id, title: 'No notes', src: 'https://media.example.test/x.mp4', scheduledAt: '2025-01-01T00:00:00Z', status: 'published' })).json();
    assert.equal((await student.request('GET', `/lessons/${noNotes.id}/content-url?kind=notes`)).statusCode, 404);

    // A tampered or malformed token is rejected without ever reaching the database lookup for a real lesson.
    assert.equal((await student.request('GET', `/content/${token}x`)).statusCode, 403);
    assert.equal((await student.request('GET', '/content/garbage')).statusCode, 403);

    const expired = signContentToken({ lessonId: youTube.id, kind: 'notes' }, context.config.tokenSecret, -1);
    assert.equal((await student.request('GET', `/content/${expired}`)).statusCode, 403);
  } finally { await context.close(); }
});

test('personal lesson notes are private to the authenticated student and never trust a client-supplied user id', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const rival = await context.user('student', '01812345678');
    const outsider = await context.user('student', '01898765432');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'notes-course', title: 'Notes Course', category: 'FCPS', price: 500, isPublished: true })).json();
    for (const user of [student, rival]) await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [user.id, course.id]);
    const lesson = (await admin.request('POST', '/admin/videos', { courseId: course.id, title: 'Lesson', src: 'https://media.example.test/v.mp4', scheduledAt: '2025-01-01T00:00:00Z', status: 'published' })).json();

    assert.deepEqual((await student.request('GET', `/lessons/${lesson.id}/notes`)).json(), { content: '', updatedAt: null });
    assert.equal((await outsider.request('GET', `/lessons/${lesson.id}/notes`)).statusCode, 403);

    // The body schema has no user-id field at all, so a caller cannot even attempt to write someone else's note.
    const spoofed = await student.request('PUT', `/lessons/${lesson.id}/notes`, { content: 'Mine', userId: rival.id });
    assert.equal(spoofed.statusCode, 400);
    assert.equal(spoofed.json().code, 'VALIDATION_ERROR');

    let response = await student.request('PUT', `/lessons/${lesson.id}/notes`, { content: 'Remember the ABCDE approach.' });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().content, 'Remember the ABCDE approach.');
    assert.ok(response.json().updatedAt);

    assert.equal((await student.request('GET', `/lessons/${lesson.id}/notes`)).json().content, 'Remember the ABCDE approach.');
    // A different enrolled student sees their own (empty) note, not the first student's.
    assert.equal((await rival.request('GET', `/lessons/${lesson.id}/notes`)).json().content, '');

    // Writing again overwrites the same row rather than accumulating rows.
    response = await student.request('PUT', `/lessons/${lesson.id}/notes`, { content: 'Updated.' });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().content, 'Updated.');
    assert.equal((await one(context.database, 'SELECT count(*)::int AS count FROM lesson_notes WHERE user_id=$1 AND lesson_id=$2', [student.id, lesson.id])).count, 1);

    assert.equal((await outsider.request('PUT', `/lessons/${lesson.id}/notes`, { content: 'x' })).statusCode, 403);
  } finally { await context.close(); }
});