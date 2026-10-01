import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { BlockedAddressError, guardedLookup, isAllowedMediaUrl, isPublicAddress, safeFetch } from '../src/safe-fetch.js';
import { fixture } from '../test-support/fixture.js';

test('only globally routable addresses are public', () => {
  for (const address of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700::1111', '::ffff:8.8.8.8']) assert.equal(isPublicAddress(address), true, address);
  for (const address of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '198.18.0.1',
    '::1', '::', 'fe80::1', 'fd00::1', '::ffff:127.0.0.1', '2001:db8::1', 'not-an-ip']) assert.equal(isPublicAddress(address), false, address);
});

test('media URLs must be public HTTPS addresses', () => {
  assert.equal(isAllowedMediaUrl('https://cdn.example.com/lecture.mp4'), true);
  for (const url of ['http://cdn.example.com/a.mp4', 'https://127.0.0.1/a', 'https://[::1]/a', 'https://169.254.169.254/latest/meta-data', 'https://localhost/a',
    'https://metadata.google.internal/a', 'https://user:pass@cdn.example.com/a', 'ftp://example.com/a', 'nonsense']) assert.equal(isAllowedMediaUrl(url), false, url);
});

test('name lookups that resolve to a private address are refused at connect time', async () => {
  const lookup = (hostname, options = {}) => new Promise((resolve, reject) => guardedLookup(hostname, options, (error, ...result) => (error ? reject(error) : resolve(result))));
  await assert.rejects(lookup('localhost'), BlockedAddressError);
  await assert.rejects(lookup('localhost', { all: true }), BlockedAddressError);
  await assert.rejects(lookup('127.0.0.1'), BlockedAddressError);
});

test('every redirect hop is re-checked, including hops to private or non-HTTPS targets', async () => {
  const fake = responses => {
    const seen = [];
    return { seen, transport: async url => { seen.push(url.toString()); return responses.shift(); } };
  };
  const ok = { status: 206, headers: { 'content-type': 'video/mp4', 'content-range': 'bytes 0-3/10' }, body: Readable.from(['data']) };

  let run = fake([{ status: 302, headers: { location: 'https://cdn.example.com/real.mp4' }, body: Readable.from([]) }, ok]);
  const followed = await safeFetch('https://example.com/video.mp4', { transport: run.transport });
  assert.equal(followed.status, 206);
  assert.deepEqual(run.seen, ['https://example.com/video.mp4', 'https://cdn.example.com/real.mp4']);

  for (const location of ['http://example.com/plain', 'https://127.0.0.1:8080/secret', 'https://169.254.169.254/latest/meta-data', 'https://localhost/x', '//127.0.0.1/x']) {
    run = fake([{ status: 302, headers: { location }, body: Readable.from([]) }, ok]);
    await assert.rejects(safeFetch('https://example.com/video.mp4', { transport: run.transport }), BlockedAddressError, location);
    assert.equal(run.seen.length, 1, `${location} must not be requested`);
  }

  const loop = { status: 302, headers: { location: 'https://example.com/again' }, body: Readable.from([]) };
  run = fake([loop, loop, loop, loop, loop]);
  await assert.rejects(safeFetch('https://example.com/start', { transport: run.transport, maxRedirects: 3 }), /Too many redirects/);
  await assert.rejects(safeFetch('https://127.0.0.1/start', { transport: fake([ok]).transport }), BlockedAddressError, 'the first URL is checked too');
});

test('lecture URLs that point at the server\'s own network are rejected when saved', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'safe-media', title: 'Safe', category: 'FCPS', price: 100, isPublished: true })).json();
    const base = { courseId: course.id, title: 'Lecture', scheduledAt: '2025-01-01T00:00:00Z' };
    for (const src of ['https://127.0.0.1/video.mp4', 'https://169.254.169.254/latest', 'https://localhost:8443/v.mp4']) {
      const response = await admin.request('POST', '/admin/videos', { ...base, src });
      assert.equal(response.statusCode, 400, src);
      assert.equal(response.json().code, 'VALIDATION_ERROR');
    }
    assert.equal((await admin.request('POST', '/admin/videos', { ...base, notesUrl: 'https://10.0.0.5/notes.pdf' })).statusCode, 400);
    assert.equal((await admin.request('POST', '/admin/videos', { ...base, src: 'https://cdn.example.com/video.mp4' })).statusCode, 200);
  } finally { await context.close(); }
});
