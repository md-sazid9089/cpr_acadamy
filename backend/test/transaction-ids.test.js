import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { one } from '../src/db.js';

async function setup() {
  const context = await fixture();
  const admin = await context.user('admin', '01799999999');
  const first = await context.user('student', '01712345678');
  const second = await context.user('student', '01812345678');
  for (const slug of ['ids-one', 'ids-two']) await admin.request('POST', '/admin/courses', { slug, title: slug, category: 'FCPS', price: 500, isPublished: true });
  const invoice = async (student, slug, attempt = 1) => (await student.request('POST', '/payments/initiate', { courseSlug: slug, method: 'manual' }, { 'idempotency-key': `key-${student.id}-${slug}-${attempt}` })).json();
  const confirm = (payment, transactionId) => admin.request('POST', `/admin/payments/${payment.id}/confirm`, { transactionId, amount: 500, evidence: 'matched in merchant statement' });
  return { context, admin, first, second, invoice, confirm };
}

test('one real payment reference cannot unlock two invoices by changing its letter case', async () => {
  const { context, first, second, invoice, confirm } = await setup();
  try {
    const one = await invoice(first, 'ids-one');
    const two = await invoice(second, 'ids-two');
    const paid = await confirm(one, '9xk2lm3pq1');
    assert.equal(paid.statusCode, 200, paid.body);
    assert.equal(paid.json().transactionId, '9XK2LM3PQ1', 'references are stored upper-case');
    for (const variant of ['9XK2LM3PQ1', '9xk2lm3pq1', '  9Xk2Lm3Pq1 ']) {
      const response = await confirm(two, variant);
      assert.equal(response.statusCode, 409, variant);
      assert.equal(response.json().code, 'DUPLICATE_TRANSACTION_ID', variant);
    }
    const proof = await second.request('POST', `/payments/${two.id}/proof`, { transactionId: '9xk2lm3pq1', payerMobile: '01812345678' });
    assert.equal(proof.statusCode, 409);
    assert.equal(proof.json().code, 'DUPLICATE_TRANSACTION_ID');
    assert.equal(paid.json().status, 'paid');
  } finally { await context.close(); }
});

test('a rejected invoice does not keep its reference locked for the genuine payer', async () => {
  const { context, admin, first, invoice, confirm, second } = await setup();
  try {
    const wrong = await invoice(first, 'ids-one');
    assert.equal((await first.request('POST', `/payments/${wrong.id}/proof`, { transactionId: 'real-ref-77', payerMobile: '01712345678' })).statusCode, 200);
    assert.equal((await admin.request('POST', `/admin/payments/${wrong.id}/reject`, { reason: 'wrong amount sent' })).statusCode, 200);
    const retry = await invoice(first, 'ids-one', 2);
    const proof = await first.request('POST', `/payments/${retry.id}/proof`, { transactionId: 'REAL-REF-77', payerMobile: '01712345678' });
    assert.equal(proof.statusCode, 200, proof.body);
    assert.equal((await confirm(retry, 'real-ref-77')).statusCode, 200);
    // ... while the live payment still protects the reference from everyone else
    const other = await invoice(second, 'ids-two');
    assert.equal((await confirm(other, 'Real-Ref-77')).json().code, 'DUPLICATE_TRANSACTION_ID');
  } finally { await context.close(); }
});

test('the database itself refuses a second live payment with the same reference in any case', async () => {
  const { context, first, second, invoice, confirm } = await setup();
  try {
    const a = await invoice(first, 'ids-one');
    const b = await invoice(second, 'ids-two');
    await confirm(a, 'abc-12345');
    await assert.rejects(context.database.query("UPDATE payments SET transaction_id='ABC-12345' WHERE id=$1", [b.id]), { code: '23505' });
    await context.database.query("UPDATE payments SET status='failed' WHERE id=$1", [a.id]);
    await context.database.query("UPDATE payments SET transaction_id='ABC-12345' WHERE id=$1", [b.id]);
    assert.equal((await one(context.database, 'SELECT transaction_id FROM payments WHERE id=$1', [b.id])).transaction_id, 'ABC-12345');
  } finally { await context.close(); }
});
