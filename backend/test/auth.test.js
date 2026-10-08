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
test('wrong guesses lock out only the guesser, never the account owner, and good logins are never counted', async () => {
  const { openDatabase, migrate } = await import('../src/db.js');
  const { loadConfig } = await import('../src/config.js');
  const { buildApp } = await import('../src/app.js');
  const { hashPassword } = await import('../src/security.js');
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  await migrate(database);
  const app = await buildApp({ database, config: loadConfig({ NODE_ENV: 'test', SMS_MODE: 'test', TRUST_PROXY: 'true', TOKEN_SECRET: 'test-secret-with-at-least-32-characters' }) });
  const password = 'Synthetic-test-password';
  await database.query("INSERT INTO users(mobile,full_name,password_hash,role,status,mobile_verified_at) VALUES ('01711111111','Admin',$1,'admin','active',now())", [await hashPassword(password)]);
  const login = (guess, address, device = 'device-0001') => app.inject({ method: 'POST', url: '/api/auth/login', headers: { 'x-device-id': device, 'x-forwarded-for': address }, payload: { mobile: '01711111111', password: guess } });
  try {
    const attacker = [];
    for (let attempt = 0; attempt < 12; attempt += 1) attacker.push((await login(`wrong-guess-${attempt}`, '203.0.113.50')).statusCode);
    assert.deepEqual(attacker, [401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 429, 429]);
    assert.equal((await login(password, '203.0.113.50')).statusCode, 429, 'the attacker is locked out of that account');
    const owner = await login(password, '198.51.100.9');
    assert.equal(owner.statusCode, 200, 'the real owner, from another address, is unaffected');

    for (let session = 0; session < 15; session += 1) assert.equal((await login(password, '198.51.100.9', `device-${session}-xxxx`)).statusCode, 200, 'successful logins are not counted');
    assert.equal((await login('wrong-once', '198.51.100.9')).statusCode, 401);
    assert.equal((await login(password, '198.51.100.9')).statusCode, 200);
  } finally {
    await app.close();
    await database.close();
  }
});

test('admins need the staff access key before their password works; students do not', async () => {
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  await migrate(database);
  const gateKey = 'staff-access-key-for-tests';
  const app = await buildApp({ database, config: loadConfig({ NODE_ENV: 'test', SMS_MODE: 'test', TRUST_PROXY: 'true', ADMIN_GATE_KEY: gateKey, TOKEN_SECRET: 'test-secret-with-at-least-32-characters' }) });
  const password = 'Synthetic-test-password';
  for (const [mobile, role] of [['01711111111', 'admin'], ['01722222222', 'student']]) {
    await database.query("INSERT INTO users(mobile,full_name,password_hash,role,status,mobile_verified_at) VALUES ($1,'User',$2,$3,'active',now())", [mobile, await hashPassword(password), role]);
  }
  const gate = (key, device = 'device-0001', address = '203.0.113.10') => app.inject({ method: 'POST', url: '/api/auth/admin-gate', headers: { 'x-device-id': device, 'x-forwarded-for': address }, payload: { key } });
  const login = (mobile, extra = {}, device = 'device-0001') => app.inject({ method: 'POST', url: '/api/auth/login', headers: { 'x-device-id': device, 'x-forwarded-for': '203.0.113.10', ...extra }, payload: { mobile, password } });
  try {
    assert.equal((await login('01722222222')).statusCode, 200, 'students sign in as before');

    const blocked = await login('01711111111');
    assert.equal(blocked.statusCode, 401, 'the right admin password alone is refused');
    const wrongPassword = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { 'x-device-id': 'device-0001', 'x-forwarded-for': '203.0.113.10' }, payload: { mobile: '01711111111', password: 'Not-the-password-1' } });
    const { requestId: _a, ...blockedBody } = blocked.json();
    const { requestId: _b, ...wrongBody } = wrongPassword.json();
    assert.deepEqual(blockedBody, wrongBody, 'without the staff pass, a right admin password looks exactly like a wrong one');
    assert.equal((await one(database, "SELECT count(*)::int AS n FROM audit_log WHERE action='auth.admin_gate_blocked'")).n, 1, 'the blocked attempt is audited');
    assert.equal((await login('01711111111', { 'x-admin-gate': 'forged.pass' })).statusCode, 401);

    assert.equal((await gate('wrong-key')).statusCode, 401);
    const opened = await gate(gateKey);
    assert.equal(opened.statusCode, 200);
    const { gatePass } = opened.json();
    assert.equal((await login('01711111111', { 'x-admin-gate': gatePass }, 'device-9999')).statusCode, 401, 'a pass only works on the device that earned it');
    const check = (pass, device = 'device-0001') => app.inject({ method: 'POST', url: '/api/auth/admin-gate/check', headers: { 'x-device-id': device, 'x-admin-gate': pass }, payload: {} });
    assert.deepEqual((await check(gatePass)).json(), { valid: true }, 'the staff page can ask whether its pass still holds');
    assert.deepEqual((await check('forged.pass')).json(), { valid: false });
    const signedIn = await login('01711111111', { 'x-admin-gate': gatePass });
    assert.equal(signedIn.statusCode, 200);
    assert.equal(signedIn.json().user.role, 'admin');

    const guesses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) guesses.push((await gate(`guess-${attempt}`, 'device-0002', '198.51.100.7')).statusCode);
    assert.deepEqual(guesses, [401, 401, 401, 401, 401, 429], 'key guessing is throttled per address');
    assert.equal((await gate(gateKey, 'device-0003', '203.0.113.20')).statusCode, 200, 'other addresses are not locked out');
  } finally {
    await app.close();
    await database.close();
  }
});

test('the staff access endpoint does not exist when no key is configured', async () => {
  const context = await fixture();
  try {
    const response = await context.app.inject({ method: 'POST', url: '/api/auth/admin-gate', headers: { 'x-device-id': 'device-0001' }, payload: { key: 'anything' } });
    assert.equal(response.statusCode, 404);
  } finally {
    await context.close();
  }
});

test('changing the staff access key voids outstanding passes and ends admin sessions at once', async () => {
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  await migrate(database);
  const base = { NODE_ENV: 'test', SMS_MODE: 'test', TRUST_PROXY: 'true', TOKEN_SECRET: 'test-secret-with-at-least-32-characters' };
  const before = await buildApp({ database, config: loadConfig({ ...base, ADMIN_GATE_KEY: 'first-staff-access-key' }) });
  const after = await buildApp({ database, config: loadConfig({ ...base, ADMIN_GATE_KEY: 'second-staff-access-key' }) });
  const password = 'Synthetic-test-password';
  await database.query("INSERT INTO users(mobile,full_name,password_hash,role,status,mobile_verified_at) VALUES ('01711111111','Admin',$1,'admin','active',now())", [await hashPassword(password)]);
  const headers = { 'x-device-id': 'device-0001', 'x-forwarded-for': '203.0.113.10' };
  try {
    const { gatePass } = (await before.inject({ method: 'POST', url: '/api/auth/admin-gate', headers, payload: { key: 'first-staff-access-key' } })).json();
    const session = (await before.inject({ method: 'POST', url: '/api/auth/login', headers: { ...headers, 'x-admin-gate': gatePass }, payload: { mobile: '01711111111', password } })).json();
    const asAdmin = { ...headers, authorization: `Bearer ${session.accessToken}` };
    assert.equal((await before.inject({ method: 'GET', url: '/api/admin/stats', headers: asAdmin })).statusCode, 200);

    // The key is changed (the "after" app runs with the new one).
    assert.equal((await after.inject({ method: 'GET', url: '/api/admin/stats', headers: asAdmin })).statusCode, 401, 'the open admin session ends');
    assert.equal((await after.inject({ method: 'POST', url: '/api/auth/refresh', headers, payload: { refreshToken: session.refreshToken } })).statusCode, 401, 'and cannot be renewed');
    assert.equal((await after.inject({ method: 'POST', url: '/api/auth/login', headers: { ...headers, 'x-admin-gate': gatePass }, payload: { mobile: '01711111111', password } })).statusCode, 401, 'a pass from the old key no longer opens the login');
    assert.deepEqual((await after.inject({ method: 'POST', url: '/api/auth/admin-gate/check', headers: { ...headers, 'x-admin-gate': gatePass }, payload: {} })).json(), { valid: false });

    const fresh = (await after.inject({ method: 'POST', url: '/api/auth/admin-gate', headers, payload: { key: 'second-staff-access-key' } })).json();
    assert.equal((await after.inject({ method: 'POST', url: '/api/auth/login', headers: { ...headers, 'x-admin-gate': fresh.gatePass }, payload: { mobile: '01711111111', password } })).statusCode, 200, 'the new key works');
  } finally {
    await before.close();
    await after.close();
    await database.close();
  }
});
