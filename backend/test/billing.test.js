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
    assert.equal((await student.request('GET', `/invoices/${payment.id}`)).json().paidAt, null);
    const confirmation = { amount: 800, transactionId: 'BANK-REFERENCE-001', evidence: 'Verified against bank statement dated today.' };
    assert.equal((await student.request('POST', `/admin/payments/${payment.id}/confirm`, confirmation)).statusCode, 403);
    assert.equal((await admin.request('POST', `/admin/payments/${payment.id}/confirm`, { ...confirmation, amount: 1 })).statusCode, 409);
    response = await admin.request('POST', `/admin/payments/${payment.id}/confirm`, confirmation);
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().status, 'paid');
    const duplicate = (await other.request('POST', '/payments/initiate', input, { 'idempotency-key': 'purchase-key-two' })).json();
    const duplicateResult = await admin.request('POST', `/admin/payments/${duplicate.id}/confirm`, confirmation);
    assert.equal(duplicateResult.statusCode, 409);
    assert.equal(duplicateResult.json().code, 'DUPLICATE_TRANSACTION_ID');
    assert.match(duplicateResult.json().message, /already linked/i);
    const before = await one(context.database, 'SELECT * FROM enrollments WHERE user_id=$1', [student.id]);
    response = await admin.request('POST', `/admin/payments/${payment.id}/confirm`, confirmation);
    assert.equal(response.statusCode, 200);
    const after = await one(context.database, 'SELECT * FROM enrollments WHERE user_id=$1', [student.id]);
    assert.equal(new Date(before.expires_at).getTime(), new Date(after.expires_at).getTime());
    assert.equal(after.status, 'active');
    assert.equal((await one(context.database, "SELECT count(*)::int AS count FROM audit_log WHERE action='payment.confirmed'")).count, 1);
    const invoice = (await student.request('GET', `/invoices/${payment.id}`)).json();
    assert.equal(invoice.total, 800);
    assert.equal(new Date(invoice.paidAt).getTime(), new Date(response.json().paidAt).getTime());
    assert.ok(invoice.issuedAt);
  } finally { await context.close(); }
});

test('payment history filters dates in Dhaka, paginates, sorts, totals all matches and isolates accounts', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const other = await context.user('student', '01812345678');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'history-course', title: 'History Course', category: 'FCPS', price: 1000, isPublished: true })).json();
    for (const [index, status, amount, createdAt, paidAt] of [
      [1, 'paid', 10000, '2026-01-01T10:00:00Z', '2026-01-02T18:00:00Z'],
      [2, 'pending', 20000, '2026-01-03T17:59:59Z', null],
      [3, 'failed', 30000, '2026-01-03T18:00:00Z', null],
      [4, 'refunded', 40000, '2026-01-01T10:00:00Z', '2026-01-03T10:00:00Z'],
    ]) {
      await context.database.query(`INSERT INTO payments(user_id,course_id,amount_minor,method,status,idempotency_key,invoice_no,description,billed_to,access_days,transaction_id,created_at,paid_at)
        VALUES ($1,$2,$3,'manual',$4,$5,$5,'History Course','{}',30,$5,$6,$7)`, [student.id, course.id, amount, status, `history-${index}`, createdAt, paidAt]);
    }
    const response = await student.request('GET', '/me/payment-history?from=2026-01-03&to=2026-01-03&limit=1&offset=1&sort=amount-desc');
    assert.equal(response.statusCode, 200, response.body);
    const history = response.json();
    assert.equal(history.total, 3);
    assert.equal(history.items.length, 1);
    assert.equal(history.items[0].amount, 200);
    assert.deepEqual(history.totals, { paid: 100, pending: 200, refunded: 400, failed: 0 });
    const ascending = (await student.request('GET', '/me/payment-history?sort=date-asc&limit=2')).json();
    assert.deepEqual(ascending.items.map(item => item.amount), [100, 400]);
    assert.equal((await other.request('GET', '/me/payment-history')).json().total, 0);
    assert.equal((await student.request('GET', '/me/payment-history?offset=20')).json().items.length, 0);
    assert.equal((await student.request('GET', '/me/payment-history?from=2026-02-01&to=2026-01-01')).statusCode, 400);
    assert.equal((await student.request('GET', '/me/payment-history?sort=unsafe')).statusCode, 400);
    assert.ok(Array.isArray((await student.request('GET', '/me/payments')).json()));
  } finally { await context.close(); }
});
