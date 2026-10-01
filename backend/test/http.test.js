import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { one } from '../src/db.js';

test('Web API enforces CORS, JSON, body limits, HTTP methods, and shared rate limits', async () => {
  const context = await fixture();
  const send = (path, options) => context.app.handle(new Request(`http://localhost/api${path}`, options));
  try {
    let response = await send('/health', { headers: { origin: 'http://localhost:5174' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5174');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(response.headers.get('x-request-id'));
    response = await send('/auth/login', { method: 'OPTIONS', headers: { origin: 'http://localhost:5174', 'access-control-request-method': 'POST' } });
    assert.equal(response.status, 204);
    assert.match(response.headers.get('access-control-allow-headers'), /X-Device-Id/);
    response = await send('/health', { headers: { origin: 'https://untrusted.example' } });
    assert.equal(response.status, 403);
    assert.equal(response.headers.has('access-control-allow-origin'), false);
    response = await send('/health', { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '');
    assert.equal((await send('/missing')).status, 404);
    assert.equal((await send('/health', { method: 'POST' })).status, 405);
    response = await send('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{invalid' });
    assert.equal(response.status, 400);
    response = await send('/auth/login', { method: 'POST', body: 'text body' });
    assert.equal(response.status, 415);
    response = await send('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json-invalid' }, body: '{}' });
    assert.equal(response.status, 415);
    response = await send('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: 'a'.repeat(1048576) }) });
    assert.equal(response.status, 413);
    context.app.route({ method: 'GET', url: '/api/hourly', config: { rateLimit: { max: 1, timeWindow: '1 hour' } }, handler: () => ({ ok: true }) });
    // No trusted proxy: everyone shares the `unknown` bucket, whose allowance is 20x the route limit, and X-Forwarded-For is ignored.
    for (let hit = 0; hit < 20; hit += 1) assert.equal((await send('/hourly', { headers: { 'x-forwarded-for': `1.2.3.${hit}` } })).status, 200);
    response = await send('/hourly', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    assert.equal(response.status, 429);
    assert.ok(Number(response.headers.get('retry-after')) > 3500);
    const bucket = await one(context.database, "SELECT extract(epoch FROM resets_at-now()) AS seconds FROM rate_buckets ORDER BY resets_at DESC LIMIT 1");
    assert.ok(Number(bucket.seconds) > 3500);
  } finally {
    await context.close();
  }
});
test('client address comes from the trusted proxy hop and cannot be chosen by the caller', async () => {
  const { clientIp } = await import('../src/web-app.js');
  const headers = value => new Headers(value === undefined ? {} : { 'x-forwarded-for': value });
  const behind = { trustProxy: true, trustedProxyHops: 1 };
  assert.equal(clientIp(headers('198.51.100.7'), behind), '198.51.100.7');
  assert.equal(clientIp(headers('6.6.6.6, 198.51.100.7'), behind), '198.51.100.7', 'a spoofed leading entry is ignored');
  assert.equal(clientIp(headers('6.6.6.6, 7.7.7.7, 198.51.100.7'), behind), '198.51.100.7');
  assert.equal(clientIp(headers('198.51.100.7, 10.0.0.2'), { trustProxy: true, trustedProxyHops: 2 }), '198.51.100.7', 'two proxies in front');
  assert.equal(clientIp(headers('198.51.100.7'), { trustProxy: true, trustedProxyHops: 3 }), '198.51.100.7', 'fewer entries than hops falls back to the first');
  assert.equal(clientIp(headers('not-an-ip'), behind), 'unknown');
  assert.equal(clientIp(headers(), behind), 'unknown');
  assert.equal(clientIp(headers('198.51.100.7'), { trustProxy: false }), 'unknown', 'the header is ignored without a trusted proxy');
});

test('spoofed X-Forwarded-For values do not buy extra attempts, and a shared bucket does not lock real users out', async () => {
  const { openDatabase, migrate } = await import('../src/db.js');
  const { loadConfig } = await import('../src/config.js');
  const { buildApp } = await import('../src/app.js');
  const boot = async env => {
    const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
    await migrate(database);
    const app = await buildApp({ database, config: loadConfig({ NODE_ENV: 'test', SMS_MODE: 'test', TOKEN_SECRET: 'test-secret-with-at-least-32-characters', ...env }) });
    return { app, database };
  };
  const register = (app, index, forwardedFor) => app.inject({ method: 'POST', url: '/api/auth/register', headers: { 'x-device-id': 'device-0001', 'x-forwarded-for': forwardedFor },
    payload: { mobile: `0174${String(1000000 + index)}`, password: 'Synthetic-test-password', fullName: 'Spam Account', institution: 'X', interest: 'FCPS', acceptTerms: true } });
  let context = await boot({ TRUST_PROXY: 'true' });
  try {
    const statuses = [];
    // Each request claims a fresh leading address; the proxy-appended last entry is always the same real client.
    for (let index = 0; index < 8; index += 1) statuses.push((await register(context.app, index, `203.0.113.${index}, 198.51.100.7`)).statusCode);
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429, 429, 429]);
    assert.equal((await register(context.app, 99, '203.0.113.9, 198.51.100.8')).statusCode, 200, 'a different real client is unaffected');
  } finally { await context.database.close(); }

  context = await boot({});
  try {
    const statuses = [];
    for (let index = 0; index < 12; index += 1) statuses.push((await register(context.app, index, `203.0.113.${index}`)).statusCode);
    assert.equal(statuses.every(status => status === 200), true, 'no usable address: many different people may still register');
  } finally { await context.database.close(); }
});

test('oversized bodies are refused before they are read, and uploads need a signed-in admin first', async () => {
  const context = await fixture();
  const send = (path, options) => context.app.handle(new Request(`http://localhost/api${path}`, options));
  const stream = (total, counter) => {
    const chunk = new Uint8Array(64 * 1024).fill(97);
    let sent = 0;
    return new ReadableStream({ pull(controller) { if (sent >= total) return controller.close(); sent += chunk.length; counter.sent = sent; controller.enqueue(chunk); } });
  };
  try {
    const anonymous = { sent: 0 };
    let response = await send('/admin/uploads/images', { method: 'POST', headers: { 'content-type': 'application/json' }, body: stream(7 * 1024 * 1024, anonymous), duplex: 'half' });
    assert.equal(response.status, 401);
    assert.ok(anonymous.sent <= 64 * 1024, `an unauthenticated upload is not read (the stream only pre-buffered ${anonymous.sent} bytes of 7 MB)`);

    const student = await context.user();
    const forbidden = { sent: 0 };
    response = await send('/admin/uploads/images', { method: 'POST', headers: { ...student.headers, 'content-type': 'application/json' }, body: stream(7 * 1024 * 1024, forbidden), duplex: 'half' });
    assert.equal(response.status, 403);
    assert.ok(forbidden.sent <= 64 * 1024, 'a non-admin upload is not read either');

    const declared = await send('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': String(5 * 1024 * 1024) }, body: '{}' });
    assert.equal(declared.status, 413, 'a declared size over the limit is refused outright');

    const admin = await context.user('admin', '01799999999');
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    response = await admin.request('POST', '/admin/uploads/images', { data: `data:image/png;base64,${png}` });
    assert.equal(response.statusCode, 200, 'a real admin upload still works');
  } finally { await context.close(); }
});
