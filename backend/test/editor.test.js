import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

test('editor drafts: incomplete questions save, publication requires complete papers, routine rows link to course content', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const course = (await admin.request('POST', '/admin/courses', {
      slug: 'editor-course', title: 'Editor Course', category: 'FCPS', price: 1000,
      classTime: { start: '20:00', end: '22:00' }, classDays: ['sat', 'tue'], offer: { label: 'Early bird', endsAt: null }, thumbnailUrl: '/assets/carousel/poster.jpeg',
    })).json();
    assert.equal(course.status, 'draft');
    assert.deepEqual(course.classDays, ['sat', 'tue']);
    assert.equal(course.offer.label, 'Early bird');

    // A half-written question is accepted while the exam is a draft.
    const draft = { id: 'q1', type: 'sba', stem: '', options: [{ id: 'a', text: '' }, { id: 'b', text: 'B' }], correctAnswer: null };
    let response = await admin.request('POST', '/admin/exams', { courseId: course.id, title: 'Draft Paper', durationMinutes: 30, scheduledAt: '2025-01-01T00:00:00Z', targetQuestionCount: 10, marksPerQuestion: 2, questions: [draft] });
    assert.equal(response.statusCode, 200, response.body);
    const exam = response.json();
    assert.equal(exam.questionCount, 1);
    assert.equal(exam.completeQuestionCount, 0);
    assert.equal(exam.targetQuestionCount, 10);
    assert.equal(exam.marksPerQuestion, 2);

    response = await admin.request('PATCH', `/admin/exams/${exam.id}`, { isPublished: true });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().code, 'INCOMPLETE_QUESTIONS');

    response = await admin.request('PATCH', `/admin/exams/${exam.id}`, { isPublished: true, questions: [{ ...draft, stem: 'Pick one', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: 'b', imageUrl: 'https://cdn.example.test/ecg.png' }] });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().code, 'QUESTION_COUNT_MISMATCH');
    response = await admin.request('PATCH', `/admin/exams/${exam.id}`, { isPublished: true, targetQuestionCount: 1, questions: [{ ...draft, stem: 'Pick one', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: 'b', imageUrl: 'https://cdn.example.test/ecg.png' }] });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().completeQuestionCount, 1);

    const video = (await admin.request('POST', '/admin/videos', { courseId: course.id, title: 'Lecture 1', src: 'https://media.example.test/v.mp4', notesUrl: 'https://media.example.test/notes.pdf', scheduledAt: '2026-07-25T08:30:00Z', durationMinutes: 80, status: 'published' })).json();
    assert.equal(video.duration, '1h 20m');
    assert.equal(video.scheduledTime, '02:30 PM');
    assert.equal(video.notesUrl, 'https://media.example.test/notes.pdf');

    const other = (await admin.request('POST', '/admin/courses', { slug: 'other-course', title: 'Other', category: 'BCS', price: 500 })).json();
    response = await admin.request('POST', '/admin/schedules', { courseId: other.id, scheduledAt: '2026-07-25T08:30:00Z', examId: exam.id });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().code, 'INVALID_REFERENCE');

    response = await admin.request('POST', '/admin/schedules', { courseId: course.id, scheduledAt: '2026-07-25T08:30:00Z', examId: exam.id, exam: 'Draft Paper', lectureVideoId: video.id, lecture: 'Lecture 1' });
    assert.equal(response.statusCode, 200, response.body);
    const row = response.json();
    assert.equal(row.date, '2026-07-25');
    assert.equal(row.time, '14:30');
    assert.equal(row.dateTime, '25 Jul 2026, Saturday\n02:30 PM');
    assert.equal(row.lectureVideoId, video.id);

    // Deleting a lesson nobody has completed removes it and clears the routine pointer.
    assert.equal((await admin.request('DELETE', `/admin/videos/${video.id}`)).statusCode, 200);
    assert.equal((await admin.request('GET', '/admin/videos', undefined)).json().length, 0);
    assert.equal((await admin.request('GET', '/admin/schedules')).json()[0].lectureVideoId, null);

    response = await admin.request('GET', '/courses', undefined);
    assert.equal(response.statusCode, 200);
    response = await context.app.inject({ method: 'GET', url: '/api/courses?batchTypes=foundation,crash&branches=online' });
    assert.equal(response.statusCode, 200, response.body);
  } finally { await context.close(); }
});

test('revenue summary, announcements feed, and student payment history for administrators', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const course = (await admin.request('POST', '/admin/courses', { slug: 'revenue-course', title: 'Revenue Course', category: 'FCPS', price: 1500, isPublished: true })).json();
    const payment = (await student.request('POST', '/payments/initiate', { courseSlug: course.slug, method: 'manual' }, { 'idempotency-key': 'purchase-0001' })).json();
    let response = await admin.request('GET', '/admin/revenue');
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().summary.pendingAmount, 1500);
    assert.equal(response.json().transactions[0].studentName, 'Test User');
    await admin.request('POST', `/admin/payments/${payment.id}/confirm`, { transactionId: 'TXN-1', amount: 1500, evidence: 'Matched against the merchant statement.' });
    response = await admin.request('GET', '/admin/revenue');
    assert.equal(response.json().summary.thisMonth, 1500);
    assert.equal(response.json().byMethod[0].share, 100);
    response = await admin.request('GET', `/admin/students/${student.id}/payments`);
    assert.equal(response.json()[0].status, 'paid');
    response = await admin.request('GET', '/admin/students');
    assert.equal(response.json()[0].enrolmentCount, 1);

    assert.equal((await student.request('POST', '/admin/announcements', { title: 'x', body: 'y' })).statusCode, 403);
    response = await admin.request('POST', '/admin/announcements', { title: 'Exam date confirmed', body: 'The final exam is on 3 December.', category: 'Exam', pinned: true });
    assert.equal(response.statusCode, 200, response.body);
    const notice = response.json();
    await admin.request('POST', '/admin/announcements', { title: 'Hidden', body: 'Not yet', isPublished: false });
    response = await context.app.inject({ method: 'GET', url: '/api/announcements' });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().map(item => item.title), ['Exam date confirmed']);
    assert.equal((await admin.request('GET', '/admin/announcements')).json().length, 2);
    assert.equal((await admin.request('DELETE', `/admin/announcements/${notice.id}`)).statusCode, 200);
    assert.equal((await context.app.inject({ method: 'GET', url: '/api/announcements' })).json().length, 0);
  } finally { await context.close(); }
});
