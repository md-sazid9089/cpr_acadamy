import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { one } from '../src/db.js';
import { deliverSms } from '../src/sms.js';
import { finalizeExpiredAttempts } from '../src/modules/exams.js';

const nil = '00000000-0000-0000-0000-000000000000';
const questions = [
  { id: 'question-one', type: 'sba', stem: 'Choose one.', options: [{ id: 'first', text: 'First' }, { id: 'second', text: 'Second' }], correctAnswer: 'second', explanation: 'The second option is correct.', marks: 1 },
  { id: 'question-two', type: 'mtf', stem: 'Evaluate each.', options: [{ id: 'first', text: 'First' }, { id: 'second', text: 'Second' }], correctAnswer: { first: true, second: false }, explanation: 'True then false.', marks: 1 },
];

test('HTTP layer rejects malformed bodies, query bounds, path params, and tampered credentials without leaking internals', async () => {
  const context = await fixture();
  const send = (path, options) => context.app.handle(new Request(`http://localhost/api${path}`, options));
  const raw = (path, body, headers = {}, method = 'POST') => send(path, { method, headers: { 'content-type': 'application/json; charset=utf-8', ...headers }, body });
  try {
    const student = await context.user();
    for (const body of ['[]', 'null', '"text"', '123', '']) {
      const response = await raw('/auth/login', body);
      assert.equal(response.status, 400, `body ${JSON.stringify(body)}`);
      assert.equal((await response.json()).code, 'VALIDATION_ERROR');
    }
    let response = await raw('/auth/login', '{"mobile":"01712345678","password":"x","__proto__":{"polluted":true}}', { 'x-device-id': 'fixture-device' });
    assert.equal(response.status, 400);
    // Browsers send body-less POSTs as an empty stream without a content type; Next.js hands that through as a non-null body.
    const emptyStream = () => new ReadableStream({ start(controller) { controller.close(); } });
    response = await send('/courses/00000000-0000-0000-0000-000000000000/enroll', { method: 'POST', headers: student.headers, body: emptyStream(), duplex: 'half' });
    assert.equal(response.status, 404, 'an empty body-less POST must reach the handler');
    response = await send('/admin/videos/00000000-0000-0000-0000-000000000000', { method: 'DELETE', headers: student.headers, body: emptyStream(), duplex: 'half' });
    assert.equal(response.status, 403);
    response = await send('/auth/login', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'mobile=x' });
    assert.equal(response.status, 415);
    response = await raw('/me/profile', '{"section":"basic","values":{"__proto__":{"polluted":true},"gender":"F"}}', student.headers, 'PATCH');
    assert.equal(response.status, 200, 'record parsing silently drops the __proto__ key');
    assert.equal({}.polluted, undefined);
    const profile = (await one(context.database, 'SELECT profile FROM users WHERE id=$1', [student.id])).profile;
    assert.equal(profile.basic.gender, 'F');
    assert.equal(Object.hasOwn(profile.basic, '__proto__'), false);
    assert.equal(JSON.stringify(profile).includes('polluted'), false);
    response = await raw('/me/profile', '{"section":"basic","values":{"gender":"F"}}', student.headers);
    assert.equal(response.status, 405);
    assert.match(response.headers.get('allow'), /PATCH/);

    for (const query of ['limit=0', 'limit=101', 'limit=abc', 'limit=1e9', 'offset=-1', 'offset=1.5', 'category=XYZ', 'featured=yes', 'search=' + 'a'.repeat(201)]) {
      assert.equal((await send(`/courses?${query}`)).status, 400, query);
    }
    assert.equal((await send(`/courses?limit=1&offset=0&category=ALL&batchTypes=a,b,&search=${encodeURIComponent('১০০% ছাড়')}`)).status, 200);
    assert.equal((await send('/health/')).status, 200);
    response = await send('/health', { method: 'DELETE' });
    assert.equal(response.status, 405);
    assert.match(response.headers.get('allow'), /GET/);
    assert.match(response.headers.get('allow'), /OPTIONS/);
    assert.equal((await send('/courses/%ZZ')).status, 400);
    assert.equal((await send('/courses/does-not-exist')).status, 404);
    assert.equal((await student.request('GET', '/payments/not-a-uuid')).statusCode, 400);
    assert.equal((await student.request('GET', `/payments/${nil}`)).statusCode, 404);
    response = await student.request('GET', '/me/complaints/../../admin/students');
    assert.equal(response.statusCode, 403, 'dot segments normalize to the admin route, which still enforces the role');
    assert.equal(response.json().code, 'FORBIDDEN');

    const token = student.headers.authorization;
    assert.equal((await student.request('GET', '/auth/me', undefined, { authorization: 'Bearer short' })).statusCode, 401);
    assert.equal((await student.request('GET', '/auth/me', undefined, { authorization: token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A') })).statusCode, 401);
    assert.equal((await student.request('GET', '/auth/me', undefined, { authorization: token.replace('Bearer', 'Basic') })).statusCode, 401);
    assert.equal((await student.request('GET', '/auth/me', undefined, { 'x-device-id': 'another-device' })).statusCode, 401);
    assert.equal((await student.request('GET', '/auth/me', undefined, { 'x-device-id': '' })).statusCode, 401);
    response = await send('/auth/me', { method: 'HEAD' });
    assert.equal(response.status, 401);
    assert.equal(await response.text(), '');
    await context.database.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1", [student.id]);
    response = await student.request('GET', '/auth/me');
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().code, 'TOKEN_EXPIRED');

    context.app.route({ method: 'GET', url: '/api/boom', handler: () => { throw new TypeError('secret detail'); } });
    response = await send('/boom');
    assert.equal(response.status, 500);
    const body = await response.text();
    assert.equal(body.includes('secret detail'), false);
    assert.equal(body.includes('TypeError'), false);
    assert.match(body, /requestId/);
  } finally { await context.close(); }
});

test('auth edge cases: silent duplicate registration, status gates, device rotation, and credential changes revoke sessions', async () => {
  const context = await fixture();
  const { app, database } = context;
  const request = (method, path, payload, headers = {}) => app.inject({ method, url: `/api${path}`, headers: { 'x-device-id': 'device-one', ...headers }, payload });
  try {
    const admin = await context.user('admin', '01799999999');
    const mobile = '01911111111';
    const registration = { mobile, password: 'Strong-password-1', fullName: 'Edge Case', institution: 'DMC', interest: 'FCPS', acceptTerms: true };
    assert.equal((await request('POST', '/auth/register', { ...registration, mobile: `${mobile} ` })).statusCode, 400);
    assert.equal((await request('POST', '/auth/register', { ...registration, confirmPassword: 'different' })).statusCode, 400);
    assert.equal((await request('POST', '/auth/register', registration)).statusCode, 200);
    let response = await request('POST', '/auth/register', { ...registration, password: 'Attacker-password-1', fullName: 'Impostor' });
    assert.equal(response.statusCode, 200);
    assert.equal((await one(database, 'SELECT full_name FROM users WHERE mobile=$1', [mobile])).full_name, 'Edge Case');
    assert.equal((await one(database, 'SELECT count(*)::int AS count FROM sms_outbox')).count, 1);
    response = await request('POST', '/auth/login', { mobile, password: registration.password });
    assert.equal(response.statusCode, 403);
    assert.equal(response.json().code, 'OTP_REQUIRED');
    assert.equal((await request('POST', '/auth/login', { mobile: '01900000000', password: 'whatever-1' })).statusCode, 401);
    response = await request('POST', '/auth/otp/resend', { mobile });
    assert.equal(response.statusCode, 429);
    assert.ok(Number(response.headers['retry-after']) > 0);
    assert.equal((await request('POST', '/auth/password/forgot', { mobile })).statusCode, 200);
    assert.equal((await one(database, 'SELECT count(*)::int AS count FROM sms_outbox')).count, 1, 'unverified numbers never receive reset codes');
    assert.equal((await request('POST', '/auth/otp/verify', { mobile, otp: '12345' })).statusCode, 400);
    assert.equal((await request('POST', '/auth/otp/verify', { mobile, otp: 123456 })).statusCode, 400);

    const messages = [];
    await deliverSms(database, context.config, payload => messages.push(payload));
    const otp = messages[0].message.match(/\b\d{6}\b/)[0];
    response = await request('POST', '/auth/otp/verify', { mobile, otp });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal((await request('POST', '/auth/otp/verify', { mobile, otp })).statusCode, 400, 'OTP cannot be replayed');
    const pending = { authorization: `Bearer ${response.json().accessToken}` };
    const { refreshToken } = response.json();
    assert.equal((await request('GET', '/auth/me', undefined, pending)).statusCode, 200);
    response = await request('GET', '/me/enrollments', undefined, pending);
    assert.equal(response.statusCode, 403);
    assert.equal(response.json().code, 'ACCOUNT_NOT_ACTIVE');
    assert.equal((await request('GET', '/admin/students', undefined, pending)).statusCode, 403);
    assert.equal((await request('POST', '/auth/refresh', { refreshToken }, { 'x-device-id': 'device-two' })).statusCode, 401);
    assert.equal((await request('POST', '/auth/refresh', { refreshToken: 'not-a-token' })).statusCode, 400);

    const user = await one(database, 'SELECT id FROM users WHERE mobile=$1', [mobile]);
    assert.equal((await admin.request('PATCH', `/admin/students/${user.id}/status`, { status: 'suspended' })).statusCode, 409);
    assert.equal((await admin.request('PATCH', `/admin/students/${user.id}/status`, { status: 'rejected' })).statusCode, 200);
    assert.equal((await request('GET', '/auth/me', undefined, pending)).statusCode, 401);
    assert.equal((await request('POST', '/auth/refresh', { refreshToken })).statusCode, 401);
    assert.equal((await request('POST', '/auth/login', { mobile, password: registration.password })).statusCode, 403);
    assert.equal((await admin.request('PATCH', `/admin/students/${user.id}/status`, { status: 'active' })).statusCode, 409);

    const student = await context.user('student', '01812222222');
    response = await request('POST', '/auth/login', { mobile: '01812222222', password: 'Synthetic-test-password' }, { 'x-device-id': 'device-two' });
    assert.equal(response.statusCode, 200);
    assert.equal((await student.request('GET', '/auth/me')).statusCode, 401, 'a new device sign-in revokes the previous session');
    const second = { 'x-device-id': 'device-two', authorization: `Bearer ${response.json().accessToken}` };
    assert.equal((await request('POST', '/me/password', { currentPassword: 'wrong-password', newPassword: 'Another-password-1' }, second)).statusCode, 400);
    assert.equal((await request('POST', '/me/password', { currentPassword: 'Synthetic-test-password', newPassword: 'short' }, second)).statusCode, 400);
    assert.equal((await request('POST', '/me/password', { currentPassword: 'Synthetic-test-password', newPassword: 'Another-password-1' }, second)).statusCode, 200);
    assert.equal((await request('GET', '/auth/me', undefined, second)).statusCode, 401);
    assert.equal((await request('POST', '/auth/login', { mobile: '01812222222', password: 'Synthetic-test-password' })).statusCode, 401);
    response = await request('POST', '/auth/login', { mobile: '01812222222', password: 'Another-password-1' });
    assert.equal(response.statusCode, 200);
    const third = { authorization: `Bearer ${response.json().accessToken}` };
    assert.equal((await request('POST', '/auth/logout', undefined, third)).statusCode, 200);
    assert.equal((await request('GET', '/auth/me', undefined, third)).statusCode, 401);
    assert.equal((await request('POST', '/auth/refresh', { refreshToken: response.json().refreshToken })).statusCode, 401);
  } finally { await context.close(); }
});

test('billing edge cases: idempotency conflicts, pending reuse, rejected invoices, duplicate references, and expired renewals', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const other = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'edge-course', title: 'Edge Course', category: 'FCPS', price: 1000, isPublished: true })).json();
    const second = (await admin.request('POST', '/admin/courses', { slug: 'second-course', title: 'Second Course', category: 'BCS', price: 500, isPublished: true })).json();
    const draft = (await admin.request('POST', '/admin/courses', { slug: 'draft-course', title: 'Draft Course', category: 'BCS', price: 500 })).json();
    for (const invalid of [{ price: 10.005 }, { price: -1 }, { price: 1000001 }, { price: '1000' }, { discountPrice: 1001 }, { slug: 'Bad Slug' }, { slug: 'ab' }, { accessDays: 0 }, { thumbnailUrl: 'http://insecure.example/a.png' }, { classTime: { start: '25:00', end: '' } }, { unknown: true }]) {
      const response = await admin.request('POST', '/admin/courses', { slug: 'invalid-course', title: 'Invalid', category: 'FCPS', price: 1000, ...invalid });
      assert.equal(response.statusCode, 400, JSON.stringify(invalid));
    }
    assert.equal((await admin.request('POST', '/admin/courses', { slug: 'edge-course', title: 'Duplicate', category: 'FCPS', price: 1 })).statusCode, 409);
    assert.equal((await admin.request('PATCH', `/admin/courses/${course.id}`, { discountPrice: 1500 })).statusCode, 400);
    assert.equal((await admin.request('PATCH', `/admin/courses/${nil}`, { title: 'Ghost' })).statusCode, 404);

    const input = { courseSlug: course.slug, method: 'manual' };
    assert.equal((await student.request('POST', '/payments/initiate', input)).statusCode, 400);
    assert.equal((await student.request('POST', '/payments/initiate', input, { 'idempotency-key': 'short' })).statusCode, 400);
    assert.equal((await student.request('POST', '/payments/initiate', { courseSlug: draft.slug, method: 'manual' }, { 'idempotency-key': 'draft-purchase-key' })).statusCode, 404);
    assert.equal((await student.request('POST', '/payments/initiate', { ...input, planId: 'not-a-uuid' }, { 'idempotency-key': 'plan-purchase-key' })).statusCode, 400);
    assert.equal((await student.request('POST', '/payments/initiate', { ...input, planId: nil }, { 'idempotency-key': 'plan-purchase-key' })).statusCode, 403, 'plans require an active enrollment');
    let response = await student.request('POST', '/payments/initiate', input, { 'idempotency-key': 'first-purchase-key' });
    assert.equal(response.statusCode, 200, response.body);
    const payment = response.json();
    assert.equal(payment.amount, 1000);
    response = await student.request('POST', '/payments/initiate', { courseSlug: second.slug, method: 'manual' }, { 'idempotency-key': 'first-purchase-key' });
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'IDEMPOTENCY_CONFLICT');
    response = await student.request('POST', '/payments/initiate', input, { 'idempotency-key': 'second-purchase-key' });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().id, payment.id, 'a pending invoice is reused instead of duplicated');
    assert.equal((await other.request('GET', `/payments/${payment.id}`)).statusCode, 404);
    assert.equal((await student.request('GET', '/admin/payments')).statusCode, 403);
    assert.equal((await admin.request('GET', '/admin/payments?status=pending')).json().some(row => row.id === payment.id), true);
    assert.equal((await admin.request('GET', '/admin/payments?status=bogus')).statusCode, 400);

    const confirmation = { amount: 1000, transactionId: 'BANK-REF-EDGE-1', evidence: 'Verified against the bank statement.' };
    for (const invalid of [{ amount: 1000.001 }, { amount: -1000 }, { amount: '1000' }, { evidence: 'short' }, { transactionId: 'ab' }, { extra: true }]) {
      assert.equal((await admin.request('POST', `/admin/payments/${payment.id}/confirm`, { ...confirmation, ...invalid })).statusCode, 400, JSON.stringify(invalid));
    }
    assert.equal((await admin.request('POST', `/admin/payments/${nil}/confirm`, confirmation)).statusCode, 404);
    assert.equal((await admin.request('POST', `/admin/payments/${payment.id}/reject`, { reason: 'nope' })).statusCode, 400);
    assert.equal((await admin.request('POST', `/admin/payments/${payment.id}/reject`, { reason: 'No matching bank transfer found.' })).statusCode, 200);
    assert.equal((await admin.request('POST', `/admin/payments/${payment.id}/reject`, { reason: 'No matching bank transfer found.' })).statusCode, 409);
    response = await admin.request('POST', `/admin/payments/${payment.id}/confirm`, confirmation);
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'INVALID_PAYMENT_STATE');
    assert.equal((await one(context.database, 'SELECT status FROM enrollments WHERE user_id=$1 AND course_id=$2', [student.id, course.id])).status, 'pending_payment');
    assert.equal((await student.request('GET', '/courses/edge-course/videos')).statusCode, 403);
    assert.equal((await student.request('GET', `/payments/${payment.id}`)).json().status, 'failed');
    response = await student.request('POST', '/payments/initiate', input, { 'idempotency-key': 'third-purchase-key' });
    assert.equal(response.statusCode, 200, response.body);
    const retry = response.json();
    assert.notEqual(retry.id, payment.id);

    const otherPayment = (await other.request('POST', '/payments/initiate', input, { 'idempotency-key': 'other-purchase-key' })).json();
    assert.equal((await admin.request('POST', `/admin/payments/${otherPayment.id}/confirm`, confirmation)).statusCode, 200);
    response = await admin.request('POST', `/admin/payments/${retry.id}/confirm`, confirmation);
    assert.equal(response.statusCode, 409, 'a bank reference can only reconcile one invoice');
    assert.equal(response.json().code, 'CONFLICT');
    assert.equal((await one(context.database, 'SELECT status FROM payments WHERE id=$1', [retry.id])).status, 'pending');
    assert.equal((await one(context.database, 'SELECT status FROM enrollments WHERE user_id=$1 AND course_id=$2', [student.id, course.id])).status, 'pending_payment');
    assert.equal((await admin.request('POST', `/admin/payments/${retry.id}/confirm`, { ...confirmation, transactionId: 'BANK-REF-EDGE-2' })).statusCode, 200);
    response = await student.request('POST', '/payments/initiate', input, { 'idempotency-key': 'fourth-purchase-key' });
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'ALREADY_ENROLLED');

    await context.database.query("UPDATE enrollments SET starts_at=now()-interval '400 days',expires_at=now()-interval '220 days' WHERE user_id=$1 AND course_id=$2", [student.id, course.id]);
    assert.equal((await student.request('GET', '/courses/edge-course/videos')).statusCode, 403);
    assert.equal((await student.request('GET', '/me/enrollments')).json()[0].status, 'expired');
    assert.equal((await student.request('GET', '/me/subscriptions/batches')).json().length, 0);
    response = await student.request('POST', '/payments/initiate', input, { 'idempotency-key': 'renewal-purchase-key' });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal((await admin.request('POST', `/admin/payments/${response.json().id}/confirm`, { ...confirmation, transactionId: 'BANK-REF-EDGE-3' })).statusCode, 200);
    const renewed = await one(context.database, 'SELECT extract(epoch FROM expires_at-now())/86400 AS days FROM enrollments WHERE user_id=$1 AND course_id=$2', [student.id, course.id]);
    assert.ok(Number(renewed.days) > 179 && Number(renewed.days) <= 180, `renewal restarts from today, got ${renewed.days}`);
    assert.equal((await student.request('GET', '/courses/edge-course/videos')).statusCode, 200);
    assert.equal((await student.request('GET', '/me/payments')).json().length, 3);
    assert.equal((await student.request('GET', '/me/payments?limit=1')).json().length, 1);
    assert.equal((await admin.request('GET', `/admin/students/${student.id}/payments`)).json().length, 3);
    assert.equal((await one(context.database, "SELECT count(*)::int AS count FROM audit_log WHERE action IN ('payment.confirmed','payment.rejected')")).count, 4);

    assert.equal((await admin.request('POST', '/admin/subscription-plans', { courseId: course.id, name: 'Free', amount: 0, durationDays: 30 })).statusCode, 400);
    assert.equal((await admin.request('POST', '/admin/subscription-plans', { courseId: nil, name: 'Ghost', amount: 100, durationDays: 30 })).statusCode, 409);
    response = await admin.request('POST', '/admin/subscription-plans', { courseId: course.id, name: 'Monthly', amount: 99.99, durationDays: 30 });
    assert.equal(response.statusCode, 200, response.body);
    const plan = response.json();
    assert.equal((await other.request('POST', '/payments/initiate', { ...input, planId: plan.id }, { 'idempotency-key': 'other-plan-key' })).json().amount, 99.99);
    assert.equal((await other.request('POST', '/payments/initiate', { courseSlug: second.slug, method: 'manual', planId: plan.id }, { 'idempotency-key': 'wrong-course-plan-key' })).statusCode, 403, 'plans are scoped to their course');
  } finally { await context.close(); }
});

test('exam edge cases: schedule gates, deadline caps, answer shapes, result embargo, ties, and locked deletion', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const rival = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'exam-edge', title: 'Exam Edge', category: 'FCPS', price: 1000, isPublished: true })).json();
    for (const user of [student, rival]) await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [user.id, course.id]);
    const base = { courseId: course.id, title: 'Edge Paper', type: 'practice', questionType: 'mixed', durationMinutes: 60, scheduledAt: '2025-01-01T00:00:00Z', isPublished: true, questions };
    for (const [patch, code] of [
      [{ questions: [] }, 'EMPTY_EXAM'],
      [{ questions: [{ ...questions[0], options: [{ id: 'first', text: 'First' }, { id: 'second', text: '' }] }] }, 'INCOMPLETE_QUESTIONS'],
      [{ questions: [{ ...questions[0], stem: '   ' }] }, 'INCOMPLETE_QUESTIONS'],
      [{ questions: [{ ...questions[1], correctAnswer: { first: true } }] }, 'INCOMPLETE_QUESTIONS'],
      [{ questions: [questions[0], questions[0]] }, 'DUPLICATE_QUESTION'],
      [{ questionType: 'sba' }, 'QUESTION_TYPE_MISMATCH'],
      [{ closesAt: '2024-12-31T00:00:00Z' }, 'INVALID_SCHEDULE'],
      [{ type: 'live' }, 'INVALID_RESULTS_RELEASE'],
      [{ type: 'mock', closesAt: '2025-01-02T00:00:00Z', resultsAt: '2025-01-01T12:00:00Z' }, 'INVALID_RESULTS_RELEASE'],
    ]) {
      const response = await admin.request('POST', '/admin/exams', { ...base, ...patch });
      assert.equal(response.statusCode, 400, JSON.stringify(patch));
      assert.equal(response.json().code, code, JSON.stringify(patch));
    }
    for (const patch of [
      { questions: [{ ...questions[0], options: [{ id: 'same', text: 'A' }, { id: 'same', text: 'B' }] }] },
      { questions: [{ ...questions[0], correctAnswer: 'missing' }] },
      { questions: [{ ...questions[1], correctAnswer: { first: true, ghost: false } }] },
      { questions: [{ ...questions[0], id: '__proto__' }] },
      { questions: [{ ...questions[0], id: 'has space' }] },
      { questions: [{ ...questions[0], marks: 0 }] },
      { questions: [{ ...questions[0], options: [{ id: 'only', text: 'One' }] }] },
      { questions: [{ ...questions[0], imageUrl: 'http://insecure.example/q.png' }] },
      { durationMinutes: 0 }, { durationMinutes: 601 }, { negativeMarking: -1 }, { negativeMarking: 0.0001 }, { scheduledAt: 'tomorrow' }, { courseId: 'course' },
    ]) {
      const response = await admin.request('POST', '/admin/exams', { ...base, ...patch });
      assert.equal(response.statusCode, 400, JSON.stringify(patch));
      assert.equal(response.json().code, 'VALIDATION_ERROR', JSON.stringify(patch));
    }
    assert.equal((await admin.request('POST', '/admin/exams', { ...base, courseId: nil })).statusCode, 409);
    assert.equal((await student.request('POST', '/admin/exams', base)).statusCode, 403);

    let response = await admin.request('POST', '/admin/exams', { ...base, isPublished: false, questions: [{ ...questions[0], correctAnswer: null, stem: '' }] });
    assert.equal(response.statusCode, 200, response.body);
    const draft = response.json();
    assert.equal(draft.completeQuestionCount, 0);
    assert.equal(draft.status, 'draft');
    assert.equal((await admin.request('PATCH', `/admin/exams/${draft.id}`, { isPublished: true })).json().code, 'INCOMPLETE_QUESTIONS');
    assert.equal((await student.request('POST', `/exams/${draft.id}/start`)).statusCode, 404);
    assert.equal((await student.request('GET', '/exams')).json().some(exam => exam.id === draft.id), false);
    assert.equal((await admin.request('GET', '/admin/exams?type=sba')).json().some(exam => exam.id === draft.id), false);
    assert.equal((await admin.request('GET', '/admin/exams?type=mtf')).json().some(exam => exam.id === draft.id), false);
    assert.equal((await admin.request('GET', '/admin/exams?type=ALL')).json().some(exam => exam.id === draft.id), true);

    const future = (await admin.request('POST', '/admin/exams', { ...base, scheduledAt: new Date(Date.now() + 3600000).toISOString() })).json();
    response = await student.request('POST', `/exams/${future.id}/start`);
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'EXAM_NOT_STARTED');
    const closed = (await admin.request('POST', '/admin/exams', { ...base, closesAt: '2025-01-02T00:00:00Z' })).json();
    response = await student.request('POST', `/exams/${closed.id}/start`);
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'EXAM_CLOSED');
    assert.equal((await student.request('GET', `/exams/${closed.id}`)).json().code, 'ATTEMPT_REQUIRED');
    assert.equal((await student.request('GET', `/exams/${closed.id}/result`)).statusCode, 404);
    assert.equal((await student.request('POST', `/exams/${closed.id}/submit`, { answers: {} })).json().code, 'ATTEMPT_REQUIRED');

    const closesAt = new Date(Date.now() + 600000);
    response = await admin.request('POST', '/admin/exams', { ...base, type: 'live', closesAt: closesAt.toISOString(), resultsAt: new Date(Date.now() + 3600000).toISOString() });
    assert.equal(response.statusCode, 200, response.body);
    const live = response.json();
    response = await student.request('POST', `/exams/${live.id}/start`);
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(new Date(response.json().endsAt).getTime(), closesAt.getTime(), 'the attempt deadline is capped by the closing time');
    for (const body of [
      { questionId: 'question-two', answer: ['first'] },
      { questionId: 'question-two', answer: { first: 'yes' } },
      { questionId: 'question-one', answer: { first: true } },
      { questionId: 'question-two', answer: 'first' },
      { questionId: 'question-two', answer: { ghost: true } },
      { questionId: 'question-one', answer: 'third' },
      { questionId: '__proto__', answer: 'first' },
      { questionId: 'question-one' },
      { questionId: 'question-one', answer: 'first', extra: 1 },
    ]) {
      response = await student.request('POST', `/exams/${live.id}/answers`, body);
      assert.equal(response.statusCode, 400, JSON.stringify(body));
    }
    assert.equal((await student.request('POST', `/exams/${live.id}/answers`, { questionId: 'question-one', answer: 'first' })).statusCode, 200);
    assert.equal((await student.request('POST', `/exams/${live.id}/answers`, { questionId: 'question-one', answer: null })).statusCode, 200);
    assert.equal((await student.request('POST', `/exams/${live.id}/answers`, { questionId: 'question-two', answer: { first: true } })).statusCode, 200);
    assert.deepEqual((await student.request('GET', `/exams/${live.id}`)).json().answers, { 'question-one': null, 'question-two': { first: true } });
    assert.equal((await rival.request('GET', `/exams/${live.id}`)).json().code, 'ATTEMPT_REQUIRED');
    const tooMany = Object.fromEntries(Array.from({ length: 501 }, (_, index) => [`q${index}`, null]));
    assert.equal((await student.request('POST', `/exams/${live.id}/submit`, { answers: tooMany })).statusCode, 400);
    assert.equal((await student.request('POST', `/exams/${live.id}/submit`, { answers: { 'question-one': 'ghost' } })).statusCode, 400);
    assert.equal((await admin.request('DELETE', `/admin/exams/${live.id}`)).statusCode, 409);
    assert.equal((await admin.request('DELETE', `/admin/exams/${draft.id}`)).statusCode, 200);
    assert.equal((await admin.request('DELETE', `/admin/exams/${draft.id}`)).statusCode, 404);

    response = await student.request('POST', `/exams/${live.id}/submit`, { answers: { 'question-one': 'second', 'question-two': { first: true, second: false } } });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().resultsAvailable, false);
    assert.equal('score' in response.json(), false);
    response = await student.request('GET', `/exams/${live.id}/result`);
    assert.equal(response.statusCode, 403);
    assert.equal(response.json().code, 'RESULTS_NOT_RELEASED');
    assert.equal((await student.request('POST', `/exams/${live.id}/answers`, { questionId: 'question-one', answer: 'first' })).json().code, 'ALREADY_SUBMITTED');
    assert.equal((await student.request('POST', `/exams/${live.id}/start`)).json().code, 'ALREADY_SUBMITTED');
    assert.equal((await student.request('POST', `/exams/${live.id}/submit`, { answers: { 'question-one': 'first' } })).statusCode, 200);
    assert.equal((await one(context.database, 'SELECT answers FROM exam_attempts WHERE exam_id=$1 AND user_id=$2', [live.id, student.id])).answers['question-one'], 'second', 'answers are frozen after submission');
    assert.equal((await student.request('GET', '/me/progress')).json().examsTaken, 0, 'embargoed results stay out of progress');

    await rival.request('POST', `/exams/${live.id}/start`);
    await rival.request('POST', `/exams/${live.id}/answers`, { questionId: 'question-one', answer: 'second' });
    await rival.request('POST', `/exams/${live.id}/answers`, { questionId: 'question-two', answer: { first: true, second: false } });
    await context.database.query("UPDATE exam_attempts SET ends_at=now()-interval '1 second' WHERE exam_id=$1 AND user_id=$2", [live.id, rival.id]);
    response = await rival.request('POST', `/exams/${live.id}/answers`, { questionId: 'question-one', answer: 'first' });
    assert.equal(response.json().code, 'EXAM_DEADLINE_PASSED');
    assert.ok((await one(context.database, 'SELECT submitted_at FROM exam_attempts WHERE exam_id=$1 AND user_id=$2', [live.id, rival.id])).submitted_at, 'a late answer finalizes the attempt');
    assert.equal(await finalizeExpiredAttempts(context.database), 0);
    await context.database.query("UPDATE exams SET closes_at=now()-interval '2 seconds',results_at=now()-interval '1 second' WHERE id=$1", [live.id]);
    assert.equal((await student.request('GET', `/exams/${live.id}/result`)).json().rank, 1);
    response = await rival.request('GET', `/exams/${live.id}/result`);
    assert.equal(response.json().rank, 1, 'equal scores share the top rank');
    assert.equal(response.json().participants, 2);
    assert.equal(response.json().score, 3);
    assert.equal(response.json().review[0].correctAnswer, 'second');
    assert.equal((await student.request('GET', '/me/progress')).json().examsTaken, 1);
    assert.equal((await student.request('GET', '/me/progress')).json().averageScore, 100);
    await context.database.query("UPDATE enrollments SET expires_at=now()-interval '1 second' WHERE user_id=$1", [rival.id]);
    assert.equal((await rival.request('GET', `/exams/${live.id}/result`)).statusCode, 403);
    assert.equal((await rival.request('GET', '/exams')).json().length, 0);
    assert.equal((await student.request('GET', `/courses/${course.slug}/exams`)).json().sba.length, 3);
  } finally { await context.close(); }
});

test('content and profile edge cases: search escaping, lesson gating, routine references, profile limits, and complaint ownership', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const other = await context.user('student', '01812345678');
    const percent = (await admin.request('POST', '/admin/courses', { slug: 'percent-course', title: 'Save 100% today', category: 'FCPS', price: 1000, isPublished: true, batchType: 'Regular', session: '2026' })).json();
    const thousand = (await admin.request('POST', '/admin/courses', { slug: 'thousand-course', title: 'Save 1000 today', category: 'BCS', price: 1000, isPublished: true, batchType: 'Crash' })).json();
    const hidden = (await admin.request('POST', '/admin/courses', { slug: 'hidden-course', title: 'Hidden 100%', category: 'BCS', price: 1000 })).json();
    let response = await context.app.inject('/api/courses?search=100%25');
    assert.deepEqual(response.json().map(course => course.slug), [percent.slug], 'wildcards in search terms are literal');
    assert.equal((await context.app.inject('/api/courses?search=_')).json().length, 0);
    assert.equal((await context.app.inject('/api/courses?search=%5C')).statusCode, 200);
    assert.equal((await context.app.inject('/api/courses?batchTypes=Regular,Crash')).json().length, 2);
    assert.equal((await context.app.inject('/api/courses?batchTypes=Regular&sessions=2027')).json().length, 0);
    assert.equal((await context.app.inject('/api/courses?category=BCS&featured=true')).json().length, 0);
    assert.equal((await context.app.inject('/api/courses/hidden-course')).statusCode, 404);
    assert.equal((await context.app.inject('/api/courses/hidden-course/schedule')).statusCode, 404);
    assert.equal((await admin.request('GET', `/admin/courses/${hidden.id}`)).json().status, 'draft');
    assert.equal((await admin.request('DELETE', `/admin/courses/${percent.id}`)).statusCode, 200);
    assert.equal((await context.app.inject('/api/courses/percent-course')).statusCode, 404);
    assert.equal((await admin.request('PATCH', `/admin/courses/${percent.id}`, { isPublished: true })).json().isPublished, true);

    const enroll = await student.request('POST', `/courses/${percent.id}/enroll`);
    assert.equal(enroll.statusCode, 200);
    assert.equal((await student.request('POST', `/courses/${percent.id}/enroll`)).json().enrollmentId, enroll.json().enrollmentId);
    assert.equal((await student.request('POST', `/courses/${hidden.id}/enroll`)).statusCode, 404);
    response = await student.request('GET', `/courses/${percent.slug}/videos`);
    assert.equal(response.statusCode, 403);
    assert.equal(response.json().code, 'ENROLLMENT_REQUIRED');
    assert.equal((await student.request('GET', '/me/enrollments')).json()[0].status, 'pending_payment');

    assert.equal((await admin.request('POST', '/admin/videos', { courseId: percent.id, title: 'No source', scheduledAt: '2025-01-01T00:00:00Z', status: 'published' })).json().code, 'VIDEO_SOURCE_REQUIRED');
    assert.equal((await admin.request('POST', '/admin/videos', { courseId: percent.id, title: 'Insecure', src: 'http://cdn.example/a.mp4', scheduledAt: '2025-01-01T00:00:00Z' })).statusCode, 400);
    assert.equal((await admin.request('POST', '/admin/videos', { courseId: percent.id, title: 'Too long', src: 'https://cdn.example/a.mp4', scheduledAt: '2025-01-01T00:00:00Z', durationMinutes: 1441 })).statusCode, 400);
    const lesson = (await admin.request('POST', '/admin/videos', { courseId: percent.id, title: 'Lesson', src: 'https://cdn.example/a.mp4', scheduledAt: '2025-01-01T00:00:00Z', status: 'published', durationMinutes: 30 })).json();
    const upcoming = (await admin.request('POST', '/admin/videos', { courseId: percent.id, title: 'Upcoming', src: 'https://cdn.example/b.mp4', scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: 'published' })).json();
    const draftLesson = (await admin.request('POST', '/admin/videos', { courseId: percent.id, title: 'Draft', scheduledAt: '2025-01-01T00:00:00Z' })).json();
    assert.equal((await context.app.inject('/api/courses/percent-course')).json().curriculum[0].lessons.length, 2, 'drafts are hidden from the public curriculum');
    assert.equal((await student.request('POST', `/lessons/${lesson.id}/complete`)).statusCode, 403);
    await context.database.query("UPDATE enrollments SET status='active',starts_at=now(),expires_at=now()+interval '30 days' WHERE user_id=$1", [student.id]);
    response = await student.request('GET', `/courses/${percent.slug}/videos`);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().flatMap(group => group.videos.map(video => video.id)), [lesson.id], 'future and draft lessons are withheld');
    assert.equal((await student.request('POST', `/lessons/${upcoming.id}/complete`)).statusCode, 404);
    assert.equal((await student.request('POST', `/lessons/${draftLesson.id}/complete`)).statusCode, 404);
    assert.equal((await student.request('POST', `/lessons/${lesson.id}/complete`)).statusCode, 200);
    assert.equal((await student.request('POST', `/lessons/${lesson.id}/complete`)).statusCode, 200);
    assert.equal((await other.request('POST', `/lessons/${lesson.id}/complete`)).statusCode, 403);
    response = await student.request('GET', '/me/progress');
    assert.equal(response.json().lessonsCompleted, 1);
    assert.equal(response.json().lessonsTotal, 1);
    assert.equal((await student.request('GET', '/me/enrollments')).json()[0].progress, 100);
    assert.equal((await admin.request('PATCH', `/admin/videos/${lesson.id}`, { courseId: thousand.id })).json().code, 'COURSE_IMMUTABLE');
    assert.equal((await admin.request('PATCH', `/admin/videos/${lesson.id}`, { src: '' })).json().code, 'VIDEO_SOURCE_REQUIRED');
    assert.equal((await admin.request('DELETE', `/admin/videos/${lesson.id}`)).statusCode, 200);
    assert.equal((await one(context.database, 'SELECT status FROM lessons WHERE id=$1', [lesson.id])).status, 'draft', 'completed lessons are retained as drafts');
    assert.equal((await admin.request('DELETE', `/admin/videos/${draftLesson.id}`)).statusCode, 200);
    assert.equal(await one(context.database, 'SELECT id FROM lessons WHERE id=$1', [draftLesson.id]), undefined);
    assert.equal((await admin.request('DELETE', `/admin/videos/${draftLesson.id}`)).statusCode, 404);
    response = await admin.request('POST', '/admin/schedules', { courseId: thousand.id, scheduledAt: '2025-01-01T00:00:00Z', lectureVideoId: upcoming.id });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().code, 'INVALID_REFERENCE');
    const routine = (await admin.request('POST', '/admin/schedules', { courseId: percent.id, scheduledAt: '2025-01-01T00:00:00Z', lectureVideoId: upcoming.id })).json();
    assert.equal((await admin.request('DELETE', `/admin/videos/${upcoming.id}`)).statusCode, 200);
    assert.equal((await context.app.inject('/api/courses/percent-course/schedule')).json()[0].lectureVideoId, null, 'routine pointers clear when the lesson is removed');
    assert.equal((await admin.request('PATCH', `/admin/schedules/${routine.id}`, { courseId: thousand.id })).json().code, 'COURSE_IMMUTABLE');

    for (const body of [
      { section: 'basic', values: { bmdcNo: 'x'.repeat(31) } },
      { section: 'basic', values: { name: 'X' } },
      { section: 'basic', values: { dateOfBirth: '31/12/1990' } },
      { section: 'basic', values: { unknown: 'field' } },
      { section: 'contact', values: { mobile: '01999999999' } },
      { section: 'contact', values: { email: 'not-an-email' } },
      { section: 'payment', values: {} },
      { section: 'address', values: [] },
      { section: 'address', values: { division: 'x'.repeat(301) } },
    ]) assert.equal((await student.request('PATCH', '/me/profile', body)).statusCode, 400, JSON.stringify(body));
    response = await student.request('PATCH', '/me/profile', { section: 'basic', values: { name: '  Edge Case  ', bmdcNo: 'A-12345', dateOfBirth: '1990-12-31' } });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().basic.name, 'Edge Case');
    assert.equal(response.json().basic.dateOfBirth, '1990-12-31');
    assert.equal((await student.request('GET', '/auth/me')).json().fullName, 'Edge Case');
    response = await student.request('PATCH', '/me/profile', { section: 'contact', values: { mobile: '01712345678', email: '' } });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().contact.email, '');
    assert.equal(response.json().basic.dateOfBirth, '1990-12-31', 'sections do not overwrite each other');
    assert.equal((await student.request('POST', '/me/devices/verify-request', { reason: 'short' })).statusCode, 400);
    assert.equal((await student.request('POST', '/me/devices/verify-request', { reason: 'I replaced my phone this week.' })).statusCode, 200);
    assert.equal((await student.request('POST', '/me/devices/verify-request', { reason: 'I replaced my phone again today.' })).statusCode, 200);
    assert.equal((await admin.request('GET', '/admin/device-requests')).json().length, 1, 'one open device request per student');

    response = await student.request('POST', '/me/complaints', { relatedTo: 'Other', body: '  Something is wrong.  ' });
    assert.equal(response.statusCode, 200, response.body);
    const complaint = response.json();
    assert.equal(complaint.messages[0].body, 'Something is wrong.');
    assert.equal((await student.request('POST', '/me/complaints', { relatedTo: 'Something else', body: 'Hello there.' })).statusCode, 400);
    assert.equal((await other.request('GET', `/me/complaints/${complaint.id}`)).statusCode, 404);
    assert.equal((await other.request('POST', `/me/complaints/${complaint.id}/replies`, { body: 'Hijack' })).statusCode, 404);
    assert.equal((await student.request('POST', `/me/complaints/${complaint.id}/replies`, { body: '   ' })).statusCode, 400);
    assert.equal((await admin.request('POST', `/admin/complaints/${complaint.id}/replies`, { body: 'Looking into it.' })).json().status, 'answered');
    assert.equal((await student.request('POST', `/me/complaints/${complaint.id}/replies`, { body: 'Thanks.' })).json().status, 'open');
    assert.equal((await admin.request('PATCH', `/admin/complaints/${complaint.id}/status`, { status: 'solved' })).statusCode, 200);
    assert.equal((await student.request('POST', `/me/complaints/${complaint.id}/replies`, { body: 'Still broken' })).json().code, 'COMPLAINT_CLOSED');
    assert.equal((await admin.request('POST', `/admin/complaints/${complaint.id}/replies`, { body: 'Reopening' })).json().code, 'COMPLAINT_CLOSED');
    assert.equal((await admin.request('PATCH', `/admin/complaints/${complaint.id}/status`, { status: 'answered' })).statusCode, 400);
    assert.equal((await admin.request('PATCH', `/admin/complaints/${nil}/status`, { status: 'open' })).statusCode, 404);

    assert.equal((await admin.request('GET', `/admin/students/${admin.id}`)).statusCode, 404, 'administrators are not managed as students');
    assert.equal((await admin.request('PATCH', `/admin/students/${admin.id}/status`, { status: 'suspended' })).statusCode, 404);
    assert.equal((await admin.request('PATCH', `/admin/students/${other.id}/status`, { status: 'suspended' })).statusCode, 200);
    assert.equal((await other.request('GET', '/auth/me')).statusCode, 401);
    assert.equal((await context.app.inject({ method: 'POST', url: '/api/auth/login', headers: { 'x-device-id': 'fixture-device' }, payload: { mobile: '01812345678', password: 'Synthetic-test-password' } })).statusCode, 403);
    assert.equal((await admin.request('PATCH', `/admin/students/${other.id}/status`, { status: 'rejected' })).statusCode, 409);
    assert.equal((await admin.request('PATCH', `/admin/students/${other.id}/status`, { status: 'suspended' })).statusCode, 200, 'repeating the current status is a no-op');
    assert.equal((await admin.request('PATCH', `/admin/students/${other.id}/status`, { status: 'active' })).statusCode, 200);
    assert.equal((await admin.request('GET', '/admin/students?status=active&search=01812345678')).json().length, 1);
    assert.equal((await admin.request('GET', '/admin/students?status=banned')).statusCode, 400);
    assert.equal((await admin.request('GET', '/admin/students?search=Edge')).json().map(row => row.id).includes(student.id), true);
    assert.equal((await admin.request('GET', '/admin/students?search=%25')).json().length, 0, 'wildcards in the student search are literal');
    assert.equal((await admin.request('GET', '/admin/students?search=_')).json().length, 0);
    assert.equal((await admin.request('GET', '/admin/students?search=%5C')).statusCode, 200);
  } finally { await context.close(); }
});
