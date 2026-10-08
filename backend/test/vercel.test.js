import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fixture } from '../test-support/fixture.js';
import { loadConfig } from '../src/config.js';
import { enqueueSms } from '../src/sms.js';
import { isCronAuthorized, maintainAfterRequest } from '../src/worker.js';

const production = { NODE_ENV: 'production', DATABASE_URL: 'postgres://db.example.test/app', TOKEN_SECRET: 'x'.repeat(40), CORS_ORIGINS: 'https://app.example.test', TRUST_PROXY: 'true' };

test('on Vercel the worker runs serverless, which needs a cron secret, and the database pool stays small', () => {
  assert.throws(() => loadConfig({ ...production, VERCEL: '1' }), /CRON_SECRET/);
  const config = loadConfig({ ...production, VERCEL: '1', CRON_SECRET: 'c'.repeat(32) });
  assert.equal(config.workerMode, 'serverless');
  assert.equal(config.databasePoolMax, 3);
  assert.equal(config.vercel, true);
  assert.throws(() => loadConfig({ ...production, VERCEL: '1', CRON_SECRET: 'c'.repeat(32), WORKER_MODE: 'embedded' }), /does not work on Vercel/);
  assert.equal(loadConfig({ ...production, WORKER_MODE: 'embedded' }).databasePoolMax, 10, 'a container deployment is unchanged');
  assert.equal(loadConfig({ ...production, WORKER_MODE: 'embedded', DATABASE_POOL_MAX: '4' }).databasePoolMax, 4);
});

test('only the cron secret opens the scheduled maintenance call', () => {
  const config = { cronSecret: 's'.repeat(32) };
  assert.equal(isCronAuthorized(config, `Bearer ${'s'.repeat(32)}`), true);
  assert.equal(isCronAuthorized(config, `Bearer ${'t'.repeat(32)}`), false);
  assert.equal(isCronAuthorized(config, undefined), false);
  assert.equal(isCronAuthorized({ cronSecret: null }, 'Bearer '), false, 'no secret configured means nobody gets in');
});

test('after-request maintenance runs at most once a minute, but queued messages go out after every write', async () => {
  const context = await fixture();
  try {
    const { database, config } = context;
    const sent = [];
    const sink = payload => sent.push(payload);
    assert.equal(await maintainAfterRequest(database, config, 'GET', sink), true, 'the first call runs maintenance');
    assert.equal(await maintainAfterRequest(database, config, 'GET', sink), false, 'a call within the minute does not');

    const user = { id: (await context.user()).id, mobile: '01712345678' };
    await enqueueSms(database, config, user, 'Your code is 123456');
    await maintainAfterRequest(database, config, 'GET', sink);
    assert.equal(sent.length, 0, 'a read does not deliver');
    assert.equal(await maintainAfterRequest(database, config, 'POST', sink), false, 'still inside the minute');
    assert.equal(sent.length, 1, 'but the write delivers the queued SMS straight away');

    await database.query("UPDATE worker_heartbeat SET beat_at=now()-interval '2 minutes' WHERE id=1");
    assert.equal(await maintainAfterRequest(database, config, 'GET', sink), true, 'once the minute has passed it runs again');
  } finally { await context.close(); }
});

test('uploads are signed for the browser to send straight to Cloudinary, and never land on a serverless disk', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    assert.deepEqual((await admin.request('POST', '/admin/uploads/signature', { kind: 'image' })).json(), { mode: 'server' }, 'without Cloudinary the browser uses the upload routes');

    context.config.cloudinaryUrl = 'cloudinary://123456:topsecret@demo-cloud';
    const pdf = (await admin.request('POST', '/admin/uploads/signature', { kind: 'pdf' })).json();
    assert.equal(pdf.uploadUrl, 'https://api.cloudinary.com/v1_1/demo-cloud/raw/upload');
    assert.equal(pdf.fields.folder, 'cpr-academy/notes');
    assert.match(pdf.fields.public_id, /^[0-9a-f-]{36}\.pdf$/);
    assert.equal(pdf.fields.api_key, '123456');
    assert.equal(JSON.stringify(pdf).includes('topsecret'), false, 'the API secret never leaves the server');
    // Cloudinary's rule: SHA-1 of the sorted "key=value" pairs joined by "&", followed by the API secret.
    const { signature, api_key: _key, ...signed } = pdf.fields;
    const expected = createHash('sha1').update(`${Object.keys(signed).sort().map(key => `${key}=${signed[key]}`).join('&')}topsecret`).digest('hex');
    assert.equal(signature, expected);

    const screenshot = (await student.request('POST', '/uploads/payment-screenshot/signature', {})).json();
    assert.equal(screenshot.uploadUrl, 'https://api.cloudinary.com/v1_1/demo-cloud/image/upload');
    assert.equal(screenshot.fields.allowed_formats, 'jpg,png,webp');
    assert.equal((await student.request('POST', '/admin/uploads/signature', { kind: 'pdf' })).statusCode, 403);

    context.config.cloudinaryUrl = null;
    context.config.vercel = true;
    const png = `data:image/png;base64,${Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]).toString('base64')}`;
    const blocked = await admin.request('POST', '/admin/uploads/images', { data: png });
    assert.equal(blocked.statusCode, 503);
    assert.equal(blocked.json().code, 'UPLOADS_NOT_CONFIGURED');
  } finally { await context.close(); }
});

test('lecture notes uploaded to Cloudinary open there directly instead of passing through the API', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const outsider = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'cloud-notes', title: 'Cloud Notes', category: 'FCPS', price: 200, isPublished: true })).json();
    await context.database.query("INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+interval '30 days')", [student.id, course.id]);
    const notesUrl = 'https://res.cloudinary.com/demo-cloud/raw/upload/v1/cpr-academy/notes/0f8a20c0-1111-2222-3333-444455556666.pdf';
    const lesson = (await admin.request('POST', '/admin/videos', { courseId: course.id, title: 'Lesson', src: 'https://youtu.be/dQw4w9WgXcQ', notesUrl, scheduledAt: '2025-01-01T00:00:00Z', status: 'published' })).json();
    assert.deepEqual((await student.request('GET', `/lessons/${lesson.id}/content-url?kind=notes`)).json(), { url: notesUrl, expiresIn: null });
    assert.equal((await outsider.request('GET', `/lessons/${lesson.id}/content-url?kind=notes`)).statusCode, 403);
  } finally { await context.close(); }
});
