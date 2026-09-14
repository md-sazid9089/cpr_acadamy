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
    assert.equal((await send('/hourly')).status, 200);
    response = await send('/hourly', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    assert.equal(response.status, 429);
    assert.ok(Number(response.headers.get('retry-after')) > 3500);
    const bucket = await one(context.database, "SELECT extract(epoch FROM resets_at-now()) AS seconds FROM rate_buckets ORDER BY resets_at DESC LIMIT 1");
    assert.ok(Number(bucket.seconds) > 3500);
  } finally {
    await context.close();
  }
});