import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { one } from '../db.js';
import { audit, ensure, uuid, text, pageQuery } from '../http.js';
import { money, requireCourseAccess } from './courses.js';
import { registrationNumber } from './students.js';

export function paymentDto(row) {
  return { id: row.id, paymentId: row.id, invoiceNo: row.invoice_no, courseId: row.course_id,
    courseTitle: row.description, amount: row.amount_minor / 100, status: row.status, currency: row.currency,
    method: row.method, transactionId: row.transaction_id, paidAt: row.paid_at, createdAt: row.created_at };
}

export function billingRoutes(route, database) {
  route('POST', '/payments/initiate', { auth: 'active', body: z.object({
    courseSlug: text, method: z.enum(['bkash', 'nagad', 'rocket', 'card', 'manual']),
    amount: money.optional(), planId: uuid.optional(),
  }).strict() }, async request => {
    ensure(request.body.method === 'manual', 503, 'PAYMENT_PROVIDER_UNAVAILABLE', 'Online payments are not configured. Contact the academy for payment arrangements.');
    const idempotencyKey = z.string().min(8).max(128).parse(request.headers['idempotency-key']);
    return database.transaction(async transaction => {
      const user = await one(transaction, 'SELECT * FROM users WHERE id=$1 FOR UPDATE', [request.auth.user_id]);
      const course = await one(transaction, 'SELECT * FROM courses WHERE slug=$1 AND is_published FOR SHARE', [request.body.courseSlug]);
      ensure(course, 404, 'COURSE_NOT_FOUND', 'This course could not be found.');
      const prior = await one(transaction, 'SELECT * FROM payments WHERE user_id=$1 AND idempotency_key=$2', [user.id, idempotencyKey]);
      if (prior) {
        ensure(prior.course_id === course.id && prior.plan_id === (request.body.planId || null) && prior.method === request.body.method, 409, 'IDEMPOTENCY_CONFLICT', 'This request key was already used for a different purchase.');
        return { ok: true, ...paymentDto(prior), redirectUrl: null };
      }
      let plan;
      if (request.body.planId) {
        await requireCourseAccess(transaction, request.auth, course.id);
        plan = await one(transaction, 'SELECT * FROM subscription_plans WHERE id=$1 AND course_id=$2 AND is_active FOR SHARE', [request.body.planId, course.id]);
        ensure(plan, 404, 'PLAN_NOT_FOUND', 'Subscription plan not found.');
      } else {
        const active = await one(transaction, "SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2 AND status='active' AND expires_at>now()", [user.id, course.id]);
        ensure(!active, 409, 'ALREADY_ENROLLED', 'This course enrollment is already active.');
      }
      const pending = await one(transaction, "SELECT * FROM payments WHERE user_id=$1 AND course_id=$2 AND plan_id IS NOT DISTINCT FROM $3::uuid AND status='pending'", [user.id, course.id, plan?.id || null]);
      if (pending) return { ok: true, ...paymentDto(pending), redirectUrl: null };
      const payment = await one(transaction, `INSERT INTO payments(user_id,course_id,plan_id,amount_minor,method,idempotency_key,invoice_no,description,billed_to,access_days)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [user.id, course.id, plan?.id || null, plan ? plan.price_minor : course.discount_minor ?? course.price_minor,
        request.body.method, idempotencyKey, `CPR-${new Date().getUTCFullYear()}-${randomUUID().toUpperCase()}`,
        plan ? `${course.title}: ${plan.name}` : course.title,
        JSON.stringify({ name: user.full_name, mobile: user.mobile, institution: user.institution }), plan?.duration_days || course.access_days]);
      if (!plan) await transaction.query('INSERT INTO enrollments(user_id,course_id) VALUES ($1,$2) ON CONFLICT(user_id,course_id) DO NOTHING', [user.id, course.id]);
      await audit(transaction, user.id, 'payment.initiated', payment.id, { amountMinor: payment.amount_minor });
      return { ok: true, ...paymentDto(payment), redirectUrl: null };
    });
  });
  route('GET', '/payments/:id', { auth: 'active' }, async request => {
    const payment = await one(database, 'SELECT * FROM payments WHERE id=$1 AND user_id=$2', [request.params.id, request.auth.user_id]);
    ensure(payment, 404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
    return paymentDto(payment);
  });
  route('GET', '/invoices/:id', { auth: 'active' }, async request => {
    const payment = await one(database, 'SELECT * FROM payments WHERE id=$1 AND user_id=$2', [request.params.id, request.auth.user_id]);
    ensure(payment, 404, 'INVOICE_NOT_FOUND', 'Invoice not found.');
    return { id: payment.id, invoiceNo: payment.invoice_no, issuedAt: payment.created_at, paidAt: payment.paid_at, status: payment.status,
      method: payment.method, transactionId: payment.transaction_id, billedTo: payment.billed_to,
      lines: [{ id: payment.id, description: payment.description, quantity: 1, unitPrice: payment.amount_minor / 100 }], discount: 0, total: payment.amount_minor / 100 };
  });
  route('GET', '/me/payments', { auth: 'active', query: pageQuery }, async request => (await database.query('SELECT * FROM payments WHERE user_id=$1 ORDER BY created_at DESC,id LIMIT $2 OFFSET $3', [request.auth.user_id, request.query.limit, request.query.offset])).rows.map(paymentDto));
  route('GET', '/me/payment-history', { auth: 'active', query: pageQuery.extend({
    from: z.string().date().optional(), to: z.string().date().optional(),
    sort: z.enum(['date-desc', 'date-asc', 'amount-desc', 'amount-asc']).default('date-desc'),
  }).refine(query => !query.from || !query.to || query.from <= query.to, { message: 'The end date must not precede the start date.' }) }, async request => {
    const { from, to, sort, limit, offset } = request.query;
    const filter = `user_id=$1
      AND ($2::date IS NULL OR (COALESCE(paid_at,created_at) AT TIME ZONE 'Asia/Dhaka')::date >= $2::date)
      AND ($3::date IS NULL OR (COALESCE(paid_at,created_at) AT TIME ZONE 'Asia/Dhaka')::date <= $3::date)`;
    const values = [request.auth.user_id, from || null, to || null];
    const order = { 'date-desc': 'COALESCE(paid_at,created_at) DESC', 'date-asc': 'COALESCE(paid_at,created_at) ASC', 'amount-desc': 'amount_minor DESC', 'amount-asc': 'amount_minor ASC' }[sort];
    const rows = (await database.query(`SELECT * FROM payments WHERE ${filter} ORDER BY ${order},id LIMIT $4 OFFSET $5`, [...values, limit, offset])).rows;
    const totals = await one(database, `SELECT count(*)::int AS count,
      COALESCE(sum(amount_minor) FILTER (WHERE status='paid'),0) AS paid,
      COALESCE(sum(amount_minor) FILTER (WHERE status='pending'),0) AS pending,
      COALESCE(sum(amount_minor) FILTER (WHERE status='refunded'),0) AS refunded,
      COALESCE(sum(amount_minor) FILTER (WHERE status='failed'),0) AS failed
      FROM payments WHERE ${filter}`, values);
    return { items: rows.map(paymentDto), total: totals.count, totals: {
      paid: Number(totals.paid) / 100, pending: Number(totals.pending) / 100,
      refunded: Number(totals.refunded) / 100, failed: Number(totals.failed) / 100,
    } };
  });
  route('GET', '/admin/payments', { auth: 'admin', query: pageQuery.extend({ status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional() }) }, async request => (await database.query('SELECT * FROM payments WHERE ($1::text IS NULL OR status=$1) ORDER BY created_at DESC,id LIMIT $2 OFFSET $3', [request.query.status || null, request.query.limit, request.query.offset])).rows.map(row => ({ ...paymentDto(row), userId: row.user_id })));

  route('POST', '/admin/payments/:id/confirm', { auth: 'admin', body: z.object({ transactionId: text.min(3).max(120), amount: money, evidence: z.string().trim().min(10).max(2000) }).strict() }, async request => database.transaction(async transaction => {
    const payment = await one(transaction, 'SELECT * FROM payments WHERE id=$1 FOR UPDATE', [request.params.id]);
    ensure(payment, 404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
    ensure(payment.method === 'manual', 409, 'GATEWAY_CONFIRMATION_REQUIRED', 'Gateway payments require provider verification.');
    ensure(payment.amount_minor === Math.round(request.body.amount * 100), 409, 'AMOUNT_MISMATCH', 'The verified amount must match the invoice.');
    const matchingTransaction = await one(transaction, 'SELECT id FROM payments WHERE transaction_id=$1 AND id<>$2', [request.body.transactionId, payment.id]);
    ensure(!matchingTransaction, 409, 'DUPLICATE_TRANSACTION_ID', 'This transaction ID is already linked to another payment.');
    if (payment.status === 'paid') {
      ensure(payment.transaction_id === request.body.transactionId, 409, 'PAYMENT_ALREADY_CONFIRMED', 'This payment has already been reconciled.');
      return paymentDto(payment);
    }
    ensure(payment.status === 'pending', 409, 'INVALID_PAYMENT_STATE', 'Only pending payments can be confirmed.');
    const paid = await one(transaction, "UPDATE payments SET status='paid',transaction_id=$2,paid_at=now() WHERE id=$1 RETURNING *", [payment.id, request.body.transactionId]);
    if (payment.plan_id) {
      await transaction.query(`INSERT INTO subscriptions(user_id,plan_id,starts_at,ends_at) VALUES ($1,$2,now(),now()+$3*interval '1 day')
        ON CONFLICT(user_id,plan_id) DO UPDATE SET starts_at=CASE WHEN subscriptions.ends_at<now() THEN now() ELSE subscriptions.starts_at END,
        ends_at=GREATEST(subscriptions.ends_at,now())+$3*interval '1 day'`, [payment.user_id, payment.plan_id, payment.access_days]);
    } else {
      await transaction.query(`INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',now(),now()+$3*interval '1 day')
        ON CONFLICT(user_id,course_id) DO UPDATE SET status='active',starts_at=now(),expires_at=GREATEST(COALESCE(enrollments.expires_at,now()),now())+$3*interval '1 day'`, [payment.user_id, payment.course_id, payment.access_days]);
    }
    await audit(transaction, request.auth.user_id, 'payment.confirmed', payment.id, { transactionId: request.body.transactionId, amountMinor: paid.amount_minor, evidence: request.body.evidence });
    return paymentDto(paid);
  }));
  route('POST', '/admin/payments/:id/reject', { auth: 'admin', body: z.object({ reason: text.min(5) }).strict() }, async request => database.transaction(async transaction => {
    const payment = await one(transaction, "UPDATE payments SET status='failed' WHERE id=$1 AND status='pending' RETURNING *", [request.params.id]);
    ensure(payment, 409, 'INVALID_PAYMENT_STATE', 'Only pending payments can be rejected.');
    await audit(transaction, request.auth.user_id, 'payment.rejected', payment.id, { reason: request.body.reason });
    return paymentDto(payment);
  }));

  route('POST', '/admin/subscription-plans', { auth: 'admin', body: z.object({ courseId: uuid, name: text, description: z.string().max(2000).default(''), amount: money.refine(value => value > 0), durationDays: z.number().int().min(1).max(3650), features: z.array(text).max(20).default([]) }).strict() }, async request => database.transaction(async transaction => {
    const input = request.body;
    const plan = await one(transaction, 'INSERT INTO subscription_plans(course_id,name,description,price_minor,duration_days,features) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [input.courseId, input.name, input.description, Math.round(input.amount * 100), input.durationDays, JSON.stringify(input.features)]);
    await audit(transaction, request.auth.user_id, 'subscription_plan.created', plan.id);
    return { ...input, id: plan.id };
  }));
  route('GET', '/subscription-plans', { auth: 'active', query: z.object({ batchId: uuid }) }, async request => {
    const enrollment = await one(database, 'SELECT course_id FROM enrollments WHERE id=$1 AND user_id=$2', [request.query.batchId, request.auth.user_id]);
    ensure(enrollment, 404, 'NOT_FOUND', 'Batch not found.');
    return (await database.query('SELECT * FROM subscription_plans WHERE course_id=$1 AND is_active ORDER BY name,id', [enrollment.course_id])).rows.map(plan => ({ id: plan.id, name: plan.name, amount: plan.price_minor / 100, durationLabel: `${plan.duration_days} days`, features: plan.features }));
  });
  route('GET', '/me/subscriptions/batches', { auth: 'active' }, async request => (await database.query(`SELECT e.id,e.created_at,c.slug,c.title FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=$1 AND e.status='active' AND e.expires_at>now() ORDER BY c.title`, [request.auth.user_id])).rows.map(row => ({ id: row.id, slug: row.slug, title: row.title, regNo: registrationNumber(row.id, row.created_at) })));
  route('GET', '/me/subscriptions', { auth: 'active', query: z.object({ batchId: uuid }) }, async request => {
    const enrollment = await one(database, 'SELECT course_id FROM enrollments WHERE id=$1 AND user_id=$2', [request.query.batchId, request.auth.user_id]);
    ensure(enrollment, 404, 'NOT_FOUND', 'Batch not found.');
    const rows = (await database.query(`SELECT s.*,p.name,p.description,p.price_minor FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id WHERE s.user_id=$1 AND p.course_id=$2`, [request.auth.user_id, enrollment.course_id])).rows;
    const groups = { active: [], unpaid: [], previous: [] };
    for (const row of rows) groups[new Date(row.ends_at).getTime() > Date.now() ? 'active' : 'previous'].push({ id: row.id, name: row.name, description: row.description, amount: row.price_minor / 100, startsOn: row.starts_at, endsOn: row.ends_at });
    groups.unpaid = (await database.query("SELECT * FROM payments WHERE user_id=$1 AND course_id=$2 AND plan_id IS NOT NULL AND status='pending'", [request.auth.user_id, enrollment.course_id])).rows.map(row => ({ id: row.id, name: row.description, amount: row.amount_minor / 100, dueOn: null }));
    return groups;
  });
}
