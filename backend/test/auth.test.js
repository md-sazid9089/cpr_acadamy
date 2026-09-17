import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, migrate, one } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';
import { deliverSms } from '../src/sms.js';
import { fixture } from '../test-support/fixture.js';

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