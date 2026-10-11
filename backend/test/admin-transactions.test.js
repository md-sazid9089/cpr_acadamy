import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

test('admin transactions: counts per status, search by name, phone, transaction ID or invoice, and the student phone', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const farhana = await context.user('student', '01711882231');
    const arif = await context.user('student', '01822450918');
    await context.database.query("UPDATE users SET full_name='Farhana Rahman' WHERE id=$1", [farhana.id]);
    await context.database.query("UPDATE users SET full_name='Arif Chowdhury' WHERE id=$1", [arif.id]);
    const course = (await admin.request('POST', '/admin/courses', { slug: 'tx-course', title: 'Tx Course', category: 'FCPS', price: 1000, isPublished: true })).json();
    for (const [user, status, trx, method] of [
      [farhana, 'pending', 'BKH7Q2M9XA', 'bkash'],
      [arif, 'pending', 'DBBL-884210', 'card'],
      [farhana, 'paid', 'NGD5K81PZ0', 'nagad'],
      [arif, 'failed', 'FAIL-1', 'manual'],
      [farhana, 'refunded', 'REF-1', 'manual'],
    ]) {
      await context.database.query(`INSERT INTO payments(user_id,course_id,amount_minor,method,status,idempotency_key,invoice_no,description,billed_to,access_days,transaction_id,paid_at)
        VALUES ($1,$2,650000,$3,$4,$5,$6,'Tx Course','{}',30,$5,CASE WHEN $4 IN ('paid','refunded') THEN now() END)`, [user.id, course.id, method, status, trx, `INV-${trx}`]);
    }

    let body = (await admin.request('GET', '/admin/transactions')).json();
    assert.deepEqual(body.counts, { all: 5, pending: 2, paid: 1, failed: 1, refunded: 1 });
    assert.equal(body.pendingCount, 2);
    assert.equal(body.total, 5);
    assert.equal(body.items[0].status, 'pending', 'pending payments come first');
    assert.ok(body.items.every((item) => item.studentMobile), 'each row carries the student phone');

    // The status filter narrows the rows but the chip counts stay for every status.
    body = (await admin.request('GET', '/admin/transactions?status=paid')).json();
    assert.equal(body.total, 1);
    assert.deepEqual(body.items.map((item) => item.transactionId), ['NGD5K81PZ0']);
    assert.equal(body.counts.all, 5);

    // Search: name, phone, transaction ID (any case), invoice number.
    body = (await admin.request('GET', '/admin/transactions?search=farhana')).json();
    assert.deepEqual(body.counts, { all: 3, pending: 1, paid: 1, failed: 0, refunded: 1 });
    assert.equal(body.pendingCount, 2, 'the waiting badge counts every pending payment');
    body = (await admin.request('GET', '/admin/transactions?search=01822')).json();
    assert.equal(body.counts.all, 2);
    body = (await admin.request('GET', '/admin/transactions?search=dbbl-88')).json();
    assert.deepEqual(body.items.map((item) => item.studentName), ['Arif Chowdhury']);
    body = (await admin.request('GET', '/admin/transactions?search=INV-REF')).json();
    assert.deepEqual(body.items.map((item) => item.transactionId), ['REF-1']);
    // Wildcards in the search are taken literally.
    body = (await admin.request('GET', '/admin/transactions?search=%25')).json();
    assert.equal(body.counts.all, 0);
    assert.equal((await farhana.request('GET', '/admin/transactions')).statusCode, 403);
  } finally { await context.close(); }
});
