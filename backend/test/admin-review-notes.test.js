import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { hashPassword } from '../src/security.js';

test('login tells apart a wrong password, an unverified number and a blocked account', async () => {
  const context = await fixture();
  try {
    const password = 'Testing-a-real-password';
    const login = (mobile, value = password) => context.app.inject({
      method: 'POST', url: '/api/auth/login', headers: { 'x-device-id': 'device-0001', 'x-forwarded-for': '203.0.113.77' },
      payload: { mobile, password: value },
    });

    // awaiting_approval signs in with a pending session (the app routes it to the approval screen);
    // the other non-active statuses are refused with a code and a reason the login form can explain.
    const statuses = [
      ['otp_pending', 403, 'OTP_REQUIRED', 'otp_pending'],
      ['awaiting_approval', 200, null, null],
      ['suspended', 403, 'ACCOUNT_NOT_ACTIVE', 'suspended'],
      ['rejected', 403, 'ACCOUNT_NOT_ACTIVE', 'rejected'],
    ];
    for (const [index, [status, expectedStatus, code, reason]] of statuses.entries()) {
      const mobile = `0171000000${index + 1}`;
      await context.database.query("INSERT INTO users(mobile,full_name,password_hash,role,status) VALUES ($1,'Blocked User',$2,'student',$3)", [mobile, await hashPassword(password), status]);
      const response = await login(mobile, 'Testing-a-real-password');
      assert.equal(response.statusCode, expectedStatus, `${status}: ${response.body}`);
      if (code) {
        assert.equal(response.json().code, code);
        assert.equal(response.json().reason, reason);
      } else {
        assert.equal(response.json().user.status, 'awaiting_approval');
      }
    }

    const wrong = await login('01712345678', 'wrong-password-1');
    assert.equal(wrong.statusCode, 401);
    assert.equal(wrong.json().code, 'INVALID_CREDENTIALS');
    assert.equal('reason' in wrong.json(), false);
  } finally { await context.close(); }
});

test('admin comments on registrations and payments stay on the record with who and when', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user('student', '01812345678', 'awaiting_approval');

    // Registration: reject with a reason, then read it back from the student record.
    const rejected = await admin.request('PATCH', `/admin/students/${student.id}/status`, { status: 'rejected', note: 'BMDC number does not match the records.' });
    assert.equal(rejected.statusCode, 200, rejected.body);
    let detail = (await admin.request('GET', `/admin/students/${student.id}`)).json();
    assert.equal(detail.statusNote, 'BMDC number does not match the records.');
    assert.ok(detail.statusDecidedBy, 'the deciding admin is named');
    assert.ok(detail.statusDecidedAt, 'the decision time is kept');

    // Approving without a note clears the rejection note.
    assert.equal((await admin.request('PATCH', `/admin/students/${student.id}/status`, { status: 'active' })).statusCode, 200);
    detail = (await admin.request('GET', `/admin/students/${student.id}`)).json();
    assert.equal(detail.statusNote, null);
    assert.equal(detail.statusDecidedAt, null);

    // Approving with a note keeps it on the record.
    assert.equal((await admin.request('PATCH', `/admin/students/${student.id}/status`, { status: 'suspended', note: 'Chargeback abuse.' })).statusCode, 200);
    assert.equal((await admin.request('PATCH', `/admin/students/${student.id}/status`, { status: 'active', note: 'Documents verified by phone.' })).statusCode, 200);
    detail = (await admin.request('GET', `/admin/students/${student.id}`)).json();
    assert.equal(detail.statusNote, 'Documents verified by phone.');
    assert.ok(detail.statusDecidedAt, 'the approval time is kept');

    // Suspend with a reason and read it back.
    await admin.request('PATCH', `/admin/students/${student.id}/status`, { status: 'suspended', note: 'Repeated chargebacks.' });
    detail = (await admin.request('GET', `/admin/students/${student.id}`)).json();
    assert.equal(detail.statusNote, 'Repeated chargebacks.');
    assert.ok(detail.statusDecidedBy, 'the deciding admin is named');

    // Payment: reject with a reason, then read it back from both admin views.
    const course = (await admin.request('POST', '/admin/courses', { slug: 'notes-course', title: 'Notes Course', category: 'FCPS', price: 1000, isPublished: true })).json();
    await context.database.query(`INSERT INTO payments(user_id,course_id,amount_minor,method,status,idempotency_key,invoice_no,description,billed_to,access_days)
      VALUES ($1,$2,100000,'manual','pending','notes-key-1','CPR-2026-NOTES1','Notes Course','{}',30)`, [student.id, course.id]);
    const payment = await context.database.query("SELECT id FROM payments WHERE idempotency_key='notes-key-1'").then(result => result.rows[0]);
    const rejectedPayment = await admin.request('POST', `/admin/payments/${payment.id}/reject`, { reason: 'No matching transfer after 7 days.', note: 'Caller said the money never left their wallet.' });
    assert.equal(rejectedPayment.statusCode, 200, rejectedPayment.body);
    assert.equal(rejectedPayment.json().status, 'failed');
    assert.equal(rejectedPayment.json().adminReviewNote, 'Caller said the money never left their wallet.');

    const transactions = (await admin.request('GET', '/admin/transactions?status=failed')).json();
    const row = transactions.items.find(item => item.id === payment.id);
    assert.equal(row.adminReviewNote, 'Caller said the money never left their wallet.');
    assert.ok(row.adminReviewedAt);
    assert.ok(row.adminReviewedByName, 'the deciding admin is named');

    const history = (await admin.request('GET', `/admin/students/${student.id}/payments`)).json();
    assert.equal(history.find(item => item.id === payment.id).adminReviewNote, 'Caller said the money never left their wallet.');

    // The student who made the payment never sees staff review notes on their own invoices.
    const payer = await context.user('student', '01899998888', 'active');
    await context.database.query(`INSERT INTO payments(user_id,course_id,amount_minor,method,status,idempotency_key,invoice_no,description,billed_to,access_days,admin_review_note,admin_reviewed_by,admin_reviewed_at)
      VALUES ($1,$2,100000,'manual','failed','notes-key-3','CPR-2026-NOTES3','Notes Course','{}',30,'Internal staff note.',$3,now())`, [payer.id, course.id, admin.id]);
    const mine = (await payer.request('GET', '/me/payments')).json();
    const mineRow = mine.find(item => item.invoiceNo === 'CPR-2026-NOTES3');
    assert.ok(mineRow, 'the payment shows up in the student history');
    assert.equal('adminReviewNote' in mineRow, false);
    assert.equal('adminReviewedBy' in mineRow, false);
    assert.equal('adminReviewedAt' in mineRow, false);

    // Confirming also records the note (here the verification evidence, when no separate note is given).
    await context.database.query(`INSERT INTO payments(user_id,course_id,amount_minor,method,status,idempotency_key,invoice_no,description,billed_to,access_days,transaction_id)
      VALUES ($1,$2,100000,'manual','pending','notes-key-2','CPR-2026-NOTES2','Notes Course','{}',30,'TRX-NOTES-2')`, [student.id, course.id]);
    const second = await context.database.query("SELECT id FROM payments WHERE idempotency_key='notes-key-2'").then(result => result.rows[0]);
    const confirmed = await admin.request('POST', `/admin/payments/${second.id}/confirm`, {
      transactionId: 'TRX-NOTES-2', amount: 1000, evidence: 'Matched the merchant statement for 12 Nov.', note: 'First month fee verified.',
    });
    assert.equal(confirmed.statusCode, 200, confirmed.body);
    assert.equal(confirmed.json().adminReviewNote, 'First month fee verified.');
    assert.ok(confirmed.json().adminReviewedAt);
  } finally { await context.close(); }
});
