import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, migrate, one } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';
import { deliverSms, enqueueSms, sendWithReve } from '../src/sms.js';

// Every key below is made up. Nothing here reaches the real Reve service: fetch is replaced.
const API_KEY = 'synthetic-api-key-0001';
const SECRET_KEY = 'synthetic-secret-key-0002';
const CALLER_ID = '8809000000';
const base = { NODE_ENV: 'test', TOKEN_SECRET: 'test-secret-with-at-least-32-characters' };
const reveEnv = { ...base, SMS_MODE: 'reve', REVE_SMS_API_KEY: API_KEY, REVE_SMS_SECRET_KEY: SECRET_KEY, REVE_SMS_CALLER_ID: CALLER_ID };
const accepted = () => new Response(JSON.stringify({ Status: '0', Text: 'ACCEPTD', Message_ID: '444' }), { status: 200 });
const rejected = status => new Response(JSON.stringify({ Status: status, Text: 'REJECTD' }), { status: 200 });

test('reve config needs both keys, a sender ID and an https address, and never echoes a value', () => {
  assert.throws(() => loadConfig({ ...base, SMS_MODE: 'reve' }), /REVE_SMS_API_KEY/);
  assert.throws(() => loadConfig({ ...base, SMS_MODE: 'reve', REVE_SMS_API_KEY: API_KEY }), /REVE_SMS_SECRET_KEY/);
  assert.throws(() => loadConfig({ ...base, SMS_MODE: 'reve', REVE_SMS_API_KEY: API_KEY, REVE_SMS_SECRET_KEY: SECRET_KEY }), /REVE_SMS_CALLER_ID/);
  assert.throws(() => loadConfig({ ...reveEnv, REVE_SMS_BASE_URL: 'http://smpp.revesms.com:7788' }), error => /https/.test(error.message)
    && ![API_KEY, SECRET_KEY, CALLER_ID].some(value => error.message.includes(value)));

  assert.equal(loadConfig(reveEnv).reveSmsBaseUrl, 'https://smpp.revesms.com:7790', 'the documented main address is the default');
  assert.equal(loadConfig({ ...reveEnv, REVE_SMS_BASE_URL: 'https://apismpp.revesms.com/' }).reveSmsBaseUrl, 'https://apismpp.revesms.com', 'the C panel address works and a trailing slash is dropped');
  assert.equal(loadConfig({ ...base, SMS_MODE: 'disabled' }).smsMode, 'disabled', 'the Reve keys are only needed when Reve is chosen');
  assert.doesNotThrow(() => loadConfig({ ...reveEnv, NODE_ENV: 'production', DATABASE_URL: 'postgres://localhost/test', CORS_ORIGINS: 'https://app.example',
    ADMIN_GATE_KEY: 'k'.repeat(16), TRUST_PROXY: 'true', WORKER_MODE: 'embedded', TOKEN_SECRET: 'x'.repeat(32) }), 'production may use Reve');
});

test('a Reve request is a GET with the number in 880 form, the text encoded, and no redirects or caching', async () => {
  const config = loadConfig(reveEnv);
  const calls = [];
  mock.method(globalThis, 'fetch', async (url, init) => { calls.push({ url: new URL(url), init }); return accepted(); });
  try {
    const message = 'Your CPR Academy verification code is 123456. It expires in 10 minutes.';
    await sendWithReve(config, { mobile: '01712345678', message });
    assert.equal(calls.length, 1);
    const { url, init } = calls[0];
    assert.equal(url.origin, 'https://smpp.revesms.com:7790');
    assert.equal(url.pathname, '/sendtext');
    assert.deepEqual(Object.fromEntries(url.searchParams), { apikey: API_KEY, secretkey: SECRET_KEY, callerID: CALLER_ID, toUser: '8801712345678', messageContent: message });
    assert.ok(!url.search.includes('+'), 'spaces are sent as %20, which every query parser reads the same way');
    assert.equal(init.method, 'GET');
    assert.equal(init.redirect, 'error');
    assert.equal(init.cache, 'no-store');

    await assert.rejects(sendWithReve(config, { mobile: '8801712345678', message }), /not a Bangladesh mobile number/);
    await assert.rejects(sendWithReve(config, { mobile: '01712345678&callerID=x', message }), /not a Bangladesh mobile number/);
    assert.equal(calls.length, 1, 'a malformed number never reaches the provider');
  } finally {
    mock.restoreAll();
  }
});

test('delivery: only Status 0 counts as sent, failures are retried, and nothing secret is ever logged', async () => {
  const config = loadConfig(reveEnv);
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  await migrate(database);
  const logged = [];
  let respond;
  mock.method(console, 'error', (...values) => logged.push(values.join(' ')));
  mock.method(globalThis, 'fetch', async url => respond(url));
  try {
    const user = await one(database, "INSERT INTO users(mobile,full_name,password_hash) VALUES ('01712345678','Test','x') RETURNING *");
    const message = 'Your CPR Academy verification code is 654321. It expires in 10 minutes.';
    const state = async () => one(database, 'SELECT status,attempts,payload FROM sms_outbox');
    const attempt = async () => {
      await database.query("UPDATE sms_outbox SET next_attempt_at=now()-interval '1 second'");
      await deliverSms(database, config);
    };
    await enqueueSms(database, config, user, message);

    const failures = [
      [() => rejected('108'), /status 108/],
      [() => rejected('109'), /status 109/],
      [() => rejected('1'), /status 1\)/],
      [() => new Response('<html>gateway</html>', { status: 200 }), /status unreadable/],
      [() => new Response('nope', { status: 502 }), /HTTP 502/],
    ];
    for (const [index, [answer, expected]] of failures.entries()) {
      respond = answer;
      await attempt();
      assert.match(logged.at(-1), expected);
      const row = await state();
      assert.equal(row.attempts, index + 1);
      assert.equal(row.status, index + 1 >= 5 ? 'failed' : 'pending');
    }
    assert.equal((await state()).payload, '', 'a message that ran out of attempts keeps no text');

    // A network error whose own message contains the full address must not leak it.
    await database.query('DELETE FROM sms_outbox');
    await enqueueSms(database, config, user, message);
    respond = url => { throw new Error(`connect failed for ${url}`); };
    await attempt();
    assert.match(logged.at(-1), /Reve SMS request failed \(Error\)/);

    const everything = logged.join(' | ');
    for (const secret of [API_KEY, SECRET_KEY, CALLER_ID, '654321', '01712345678', '8801712345678', 'apikey=', 'secretkey=']) {
      assert.ok(!everything.includes(secret), `the log must not contain ${secret}`);
    }

    respond = () => accepted();
    await attempt();
    const sentRow = await state();
    assert.deepEqual({ status: sentRow.status, payload: sentRow.payload }, { status: 'sent', payload: '' }, 'once accepted, the message is marked sent and its text is erased');
  } finally {
    mock.restoreAll();
    await database.close();
  }
});

test('with Reve: sign-up code, repeat sign-up of an unverified number, verified numbers left alone, and password reset', async () => {
  const config = loadConfig(reveEnv);
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  await migrate(database);
  const app = await buildApp({ database, config });
  const sent = [];
  mock.method(globalThis, 'fetch', async url => {
    const query = new URL(url).searchParams;
    sent.push({ to: query.get('toUser'), text: query.get('messageContent') });
    return accepted();
  });
  const request = (method, url, payload) => app.inject({ method, url: `/api${url}`, payload, headers: { 'x-device-id': 'test-device-one' } });
  const drain = () => deliverSms(database, config);
  const codeOf = message => message.text.match(/\b\d{6}\b/)[0];
  const mobile = '01712345678';
  const signUp = (fullName, password) => request('POST', '/auth/register', { mobile, password, fullName, institution: 'Medical College', interest: 'FCPS', acceptTerms: true });
  const row = () => one(database, 'SELECT full_name,status FROM users WHERE mobile=$1', [mobile]);
  try {
    let response = await signUp('First Try', 'First-password-123');
    assert.equal(response.statusCode, 200, response.body);
    await drain();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, '8801712345678');
    const firstCode = codeOf(sent[0]);

    // Within a minute of the first code, a second sign-up changes nothing and sends nothing; the answer is the same.
    response = await signUp('Second Try', 'Second-password-123');
    assert.equal(response.statusCode, 200, response.body);
    await drain();
    assert.equal(sent.length, 1);
    assert.equal((await row()).full_name, 'First Try');

    // Later, the same number signs up again (a typo, or a stranger got there first): the new details win and a new code goes out.
    await database.query("UPDATE otp_challenges SET sent_at=now()-interval '2 minutes'");
    response = await signUp('Third Try', 'Third-password-123');
    assert.equal(response.statusCode, 200, response.body);
    await drain();
    assert.equal(sent.length, 2);
    assert.equal((await row()).full_name, 'Third Try');
    const secondCode = codeOf(sent[1]);
    if (secondCode !== firstCode) assert.equal((await request('POST', '/auth/otp/verify', { mobile, otp: firstCode })).statusCode, 400, 'the earlier code no longer works');
    response = await request('POST', '/auth/otp/verify', { mobile, otp: secondCode });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().user.status, 'awaiting_approval');

    // Once verified the account is the owner's: signing up again with the number changes nothing and sends nothing.
    await database.query("UPDATE users SET status='active' WHERE mobile=$1", [mobile]);
    response = await signUp('Intruder', 'Intruder-password-123');
    assert.equal(response.statusCode, 200, response.body);
    await drain();
    assert.equal(sent.length, 2);
    assert.equal((await row()).full_name, 'Third Try');
    assert.equal((await request('POST', '/auth/login', { mobile, password: 'Intruder-password-123' })).statusCode, 401);
    assert.equal((await request('POST', '/auth/login', { mobile, password: 'Third-password-123' })).statusCode, 200);

    // Password reset goes through the same provider.
    assert.equal((await request('POST', '/auth/password/forgot', { mobile })).statusCode, 200);
    await drain();
    assert.equal(sent.length, 3);
    assert.match(sent[2].text, /password reset code/);
    response = await request('POST', '/auth/password/reset', { mobile, otp: codeOf(sent[2]), password: 'Replacement-password-123' });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal((await request('POST', '/auth/login', { mobile, password: 'Replacement-password-123' })).statusCode, 200);
  } finally {
    mock.restoreAll();
    await app.close();
    await database.close();
  }
});
