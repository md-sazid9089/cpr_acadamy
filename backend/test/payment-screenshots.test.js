import test from 'node:test';
import assert from 'node:assert/strict';
import { isOwnScreenshotUrl } from '../src/modules/billing.js';
import { fixture } from '../test-support/fixture.js';

const cloudinary = { cloudinaryUrl: 'cloudinary://key:secret@democloud' };
const local = '/api/media/0b3c8e5a-7a7e-4d40-9a2f-1b2c3d4e5f60.png';

test('only images this app stored can be attached as payment screenshots', () => {
  assert.equal(isOwnScreenshotUrl(local, {}), true);
  assert.equal(isOwnScreenshotUrl('https://res.cloudinary.com/democloud/image/upload/v1/cpr-academy/uploads/abc.png', cloudinary), true);
  for (const value of ['javascript:alert(document.domain)', 'data:text/html,<script>alert(1)</script>', 'http://res.cloudinary.com/democloud/image/upload/a.png',
    'https://res.cloudinary.com/othercloud/image/upload/a.png', 'https://evil.example/pixel.gif', 'http://169.254.169.254/latest/meta-data/',
    'https://user@res.cloudinary.com/democloud/image/upload/a.png', '//evil.example/a.png', '/api/media/../../etc/passwd', '/api/media/not-a-uuid.png', 'https://res.cloudinary.com/democloud/raw/upload/a.html']) {
    assert.equal(isOwnScreenshotUrl(value, cloudinary), false, value);
  }
  assert.equal(isOwnScreenshotUrl('https://res.cloudinary.com/democloud/image/upload/a.png', {}), false, 'without Cloudinary configured only local uploads count');
});

test('payment proof rejects screenshot links that are not this app\'s own uploads', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    await admin.request('POST', '/admin/courses', { slug: 'shots', title: 'Shots', category: 'FCPS', price: 100, isPublished: true });
    const invoice = (await student.request('POST', '/payments/initiate', { courseSlug: 'shots', method: 'manual' }, { 'idempotency-key': 'key-shots-001' })).json();
    const proof = screenshotUrl => student.request('POST', `/payments/${invoice.id}/proof`, { transactionId: 'SHOT-REF-1', payerMobile: '01712345678', screenshotUrl });
    for (const url of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'https://evil.example/pixel.gif', 'http://169.254.169.254/x']) {
      const response = await proof(url);
      assert.equal(response.statusCode, 400, url);
      assert.equal(response.json().code, 'VALIDATION_ERROR');
    }
    assert.equal((await proof(local)).statusCode, 200);
    assert.equal((await proof('')).statusCode, 200, 'the screenshot stays optional');
  } finally { await context.close(); }
});
