import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

// A minimal valid 1x1 PNG (signature bytes matter; content does not).
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test('media: an uploaded image round-trips through its own served URL', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();

    assert.equal((await student.request('POST', '/admin/uploads/images', { data: `data:image/png;base64,${TINY_PNG_BASE64}` })).statusCode, 403);

    const upload = await admin.request('POST', '/admin/uploads/images', { data: `data:image/png;base64,${TINY_PNG_BASE64}` });
    assert.equal(upload.statusCode, 200, upload.body);
    const { url } = upload.json();
    assert.match(url, /^\/api\/media\/[0-9a-f-]{36}\.png$/);

    // The served URL's filename is "<uuid>.png", not a bare UUID — this must not
    // be rejected by the framework's generic "id"-named-param UUID check.
    const served = await student.request('GET', url.replace('/api', ''));
    assert.equal(served.statusCode, 200, served.body);
    assert.equal(served.headers['content-type'], 'image/png');

    assert.equal((await student.request('GET', '/media/does-not-exist.png')).statusCode, 404);
    assert.equal((await student.request('GET', '/media/../../etc/passwd')).statusCode, 404);
  } finally { await context.close(); }
});
