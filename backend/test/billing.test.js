import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { one } from '../src/db.js';

test('billing ignores client prices, isolates invoices, and activates access exactly once', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const other = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'billing-course', title: 'Billing Course', category: 'FCPS', price: 1000, discountPrice: 800, isPublished: true })).json();
    const input = { courseSlug: course.slug, method: 'manual', amount: 1 };
    assert.equal((await student.request('POST', '/payments/initiate', { ...input, method: 'bkash' })).statusCode, 503);
    let response = await student.request('POST', '/payments/initiate', input, { 'idempotency-key': 'purchase-key-one' });
    assert.equal(response.statusCode, 200, response.body);
    const payment = response.json();
    assert.equal(payment.amount, 800);
    assert.equal((await student.request('POST', '/payments/initiate', input, { 'idempotency-key': 'purchase-key-one' })).json().id, payment.id);
    assert.equal((await other.request('GET', `/invoices/${payment.id}`)).statusCode, 404);
    const confirmation = { amount: 800, transactionId: 'BANK-REFERENCE-001', evidence: 'Verified against bank statement dated today.' };
    assert.equal((await student.request('POST', `/admin/payments/${payment.id}/confirm`, confirmation)).statusCode, 403);
    assert.equal((await admin.request('POST', `/admin/payments/${payment.id}/confirm`, { ...confirmation, amount: 1 })).statusCode, 409);
    response = await admin.request('POST', `/admin/payments/${payment.id}/confirm`, confirmation);
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().status, 'paid');
    const before = await one(context.database, 'SELECT * FROM enrollments WHERE user_id=$1', [student.id]);
    response = await admin.request('POST', `/admin/payments/${payment.id}/confirm`, confirmation);
    assert.equal(response.statusCode, 200);
    const after = await one(context.database, 'SELECT * FROM enrollments WHERE user_id=$1', [student.id]);
    assert.equal(new Date(before.expires_at).getTime(), new Date(after.expires_at).getTime());
    assert.equal(after.status, 'active');
    assert.equal((await one(context.database, "SELECT count(*)::int AS count FROM audit_log WHERE action='payment.confirmed'")).count, 1);
    assert.equal((await student.request('GET', `/invoices/${payment.id}`)).json().total, 800);
  } finally { await context.close(); }
});