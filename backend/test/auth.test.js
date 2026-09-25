import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, migrate, one } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';
import { deliverSms } from '../src/sms.js';
import { deliverEmail } from '../src/email.js';
import { hashPassword } from '../src/security.js';
import { fixture } from '../test-support/fixture.js';

test('password reset by email: delivery, case-insensitive lookup, and non-committal misses', async () => {
  const config = loadConfig({ NODE_ENV: 'test', SMS_MODE: 'test', EMAIL_MODE: 'test', TOKEN_SECRET: 'test-secret-with-at-least-32-characters' });
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  await migrate(database);
  const app = await buildApp({ database, config });
  const request = (method, url, payload) => app.inject({ method, url: `/api${url}`, payload, headers: { 'x-device-id': 'test-device-one' } });
  const insertUser = async (mobile, email) => database.query(`INSERT INTO users(mobile,full_name,password_hash,status,email,mobile_verified_at)
    VALUES ($1,'Email User',$2,'active',$3,now())`, [mobile, await hashPassword('Original-password-1'), email]);
  try {
    await insertUser('01712340001', 'Reset.Me@Example.com');
    await insertUser('01712340002', 'shared@example.com');
    await insertUser('01712340003', 'shared@example.com');
    const emails = [];
    const drain = () => deliverEmail(database, config, payload => emails.push(payload));

    assert.equal((await request('POST', '/auth/password/forgot', { mobile: '01712340001', email: 'reset.me@example.com' })).statusCode, 400);
    assert.equal((await request('POST', '/auth/password/forgot', {})).statusCode, 400);

    let response = await request('POST', '/auth/password/forgot', { email: '  RESET.me@example.com ' });
    assert.equal(response.statusCode, 200, response.body);
    await drain();
    assert.equal(emails.length, 1);
    assert.equal(emails[0].to, 'Reset.Me@Example.com');
    const code = emails[0].text.match(/\b\d{6}\b/)[0];
    assert.ok(emails[0].html.includes(code));

    for (const email of ['shared@example.com', 'nobody@example.com']) {
      response = await request('POST', '/auth/password/forgot', { email });
      assert.equal(response.statusCode, 200, response.body);
    }
    await drain();
    assert.equal(emails.length, 1, 'shared and unknown addresses must not receive a code');

    response = await request('POST', '/auth/password/reset', { email: 'reset.me@example.com', otp: code, password: 'Replacement-password-1' });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal((await request('POST', '/auth/password/reset', { email: 'reset.me@example.com', otp: code, password: 'Another-password-1' })).statusCode, 400);
    assert.equal((await request('POST', '/auth/login', { mobile: '01712340001', password: 'Replacement-password-1' })).statusCode, 200);
    assert.equal((await one(database, "SELECT count(*)::int AS n FROM email_outbox WHERE status='sent' AND payload=''")).n, 1);
  } finally {
    await app.close();
    await database.close();
  }

  const smsOnly = loadConfig({ NODE_ENV: 'test', SMS_MODE: 'test', TOKEN_SECRET: 'test-secret-with-at-least-32-characters' });
  const smsDatabase = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  await migrate(smsDatabase);
  const smsApp = await buildApp({ database: smsDatabase, config: smsOnly });
  try {
    const response = await smsApp.inject({ method: 'POST', url: '/api/auth/password/forgot', payload: { email: 'reset.me@example.com' } });
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().code, 'EMAIL_UNAVAILABLE');
  } finally {
    await smsApp.close();
    await smsDatabase.close();
  }
});

test('email config requires a Resend key and sender', () => {
  const base = { NODE_ENV: 'test', TOKEN_SECRET: 'test-secret-with-at-least-32-characters' };
  assert.throws(() => loadConfig({ ...base, EMAIL_MODE: 'resend' }), /RESEND_API_KEY/);
  assert.throws(() => loadConfig({ ...base, EMAIL_MODE: 'resend', RESEND_API_KEY: 're_x' }), /EMAIL_FROM/);
  assert.throws(() => loadConfig({ ...base, EMAIL_MODE: 'smtp' }), /EMAIL_MODE/);
  assert.equal(loadConfig({ ...base, EMAIL_MODE: 'resend', RESEND_API_KEY: 're_x', EMAIL_FROM: 'a@b.co' }).emailMode, 'resend');
});

test('registration, OTP limits, pending gate, session rotation, and password reset', async () => {
  const config = loadConfig({ NODE_ENV: 'test', SMS_MODE: 'test', TOKEN_SECRET: 'test-secret-with-at-least-32-characters' });
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  await migrate(database);
  const app = await buildApp({ database, config });
  const headers = { 'x-device-id': 'test-device-one' };
  const request = (method, url, payload, extra = {}) => app.inject({ method, url: `/api${url}`, payload, headers: { ...headers, ...extra } });
  const mobile = '01712345678';
  const password = 'Testing-a-real-password';
  try {
    let response = await request('POST', '/auth/register', { mobile, password, fullName: 'Test Student', institution: 'Medical College', interest: 'FCPS', acceptTerms: true, role: 'admin' });
    assert.equal(response.statusCode, 400);
    response = await request('POST', '/auth/register', { mobile, password, fullName: 'Test Student', institution: 'Medical College', interest: 'FCPS', acceptTerms: true });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal('otp' in response.json(), false);
    assert.equal((await request('POST', '/auth/login', { mobile, password })).statusCode, 403);
    const messages = [];
    await deliverSms(database, config, payload => messages.push(payload));
    const otp = messages[0].message.match(/\b\d{6}\b/)[0];
    response = await request('POST', '/auth/otp/verify', { mobile, otp: otp === '000000' ? '000001' : '000000' });
    assert.equal(response.statusCode, 400);
    assert.equal((await one(database, 'SELECT attempts FROM otp_challenges')).attempts, 1);
    response = await request('POST', '/auth/otp/verify', { mobile, otp });
    assert.equal(response.statusCode, 200, response.body);
    const pending = response.json();
    assert.equal(pending.user.status, 'awaiting_approval');
    assert.equal((await request('GET', '/auth/approval-status', undefined, { authorization: `Bearer ${pending.accessToken}` })).json().status, 'awaiting_approval');
    assert.equal((await request('GET', '/auth/approval-status')).statusCode, 401);
    assert.equal((await request('POST', '/auth/otp/verify', { mobile, otp })).statusCode, 400);
    await database.query("UPDATE users SET status='active' WHERE mobile=$1", [mobile]);
    response = await request('POST', '/auth/login', { mobile, password });
    const session = response.json();
    assert.equal(response.statusCode, 200, response.body);
    assert.equal((await request('GET', '/auth/me', undefined, { authorization: `Bearer ${pending.accessToken}` })).json().code, 'SESSION_REVOKED');
    assert.equal((await request('GET', '/auth/me', undefined, { authorization: `Bearer ${session.accessToken}`, 'x-device-id': 'another-device' })).json().code, 'DEVICE_MISMATCH');
    response = await request('POST', '/auth/refresh', { refreshToken: session.refreshToken });
    assert.equal(response.statusCode, 200, response.body);
    const refreshed = response.json();
    assert.equal((await request('POST', '/auth/refresh', { refreshToken: session.refreshToken })).statusCode, 401);
    assert.equal((await request('POST', '/auth/password/forgot', { mobile })).statusCode, 200);
    await deliverSms(database, config, payload => messages.push(payload));
    const resetOtp = messages.at(-1).message.match(/\b\d{6}\b/)[0];
    response = await request('POST', '/auth/password/reset', { mobile, otp: resetOtp, password: 'Replacement-password' });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal((await request('GET', '/auth/me', undefined, { authorization: `Bearer ${refreshed.accessToken}` })).statusCode, 401);
    assert.equal((await request('POST', '/auth/login', { mobile, password })).statusCode, 401);
    assert.equal((await request('POST', '/auth/login', { mobile, password: 'Replacement-password' })).statusCode, 200);
  } finally {
    await app.close();
    await database.close();
  }
});

test('admin sessions expire sooner than student sessions', async () => {
  const context = await fixture();
  try {
    const student = await context.user('student', '01712345671');
    const admin = await context.user('admin', '01712345672');
    const studentSession = await one(context.database, "SELECT refresh_expires_at FROM sessions WHERE user_id=$1 AND revoked_at IS NULL", [student.id]);
    const adminSession = await one(context.database, "SELECT refresh_expires_at FROM sessions WHERE user_id=$1 AND revoked_at IS NULL", [admin.id]);
    const studentDays = (new Date(studentSession.refresh_expires_at) - Date.now()) / 86400000;
    const adminDays = (new Date(adminSession.refresh_expires_at) - Date.now()) / 86400000;
    assert.ok(adminDays < studentDays, `expected admin refresh window (${adminDays}d) to be shorter than student's (${studentDays}d)`);
    assert.ok(adminDays <= 7.01 && adminDays > 6.9, `expected admin refresh window to be ~7 days, got ${adminDays}`);
    assert.ok(studentDays <= 30.01 && studentDays > 29.9, `expected student refresh window to be ~30 days, got ${studentDays}`);
  } finally {
    await context.close();
  }
});