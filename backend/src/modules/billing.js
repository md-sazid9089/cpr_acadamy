import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { one } from '../db.js';
import { audit, ensure, uuid, text, mobile, pageQuery } from '../http.js';
import { money, requireCourseAccess } from './courses.js';
import { registrationNumber } from './students.js';

// A bank/bKash reference means the same payment in any letter case, so it is stored upper-case.
const transactionId = text.min(3).max(120).transform(value => value.toUpperCase());

export function paymentDto(row) {
  return { id: row.id, paymentId: row.id, invoiceNo: row.invoice_no, courseId: row.course_id,
    courseTitle: row.description, amount: row.amount_minor / 100, status: row.status, currency: row.currency,
    method: row.method, transactionId: row.transaction_id, paidAt: row.paid_at, createdAt: row.created_at,
    payerMobile: row.payer_mobile ?? null, screenshotUrl: row.screenshot_url ?? null, proofSubmittedAt: row.proof_submitted_at ?? null };
}

function planDto(row) {
  return { id: row.id, courseId: row.course_id, name: row.name, description: row.description, amount: row.price_minor / 100,
    durationDays: row.duration_days, features: row.features, isActive: row.is_active };
}

const ownUpload = /^\/api\/media\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/;

/**
 * The screenshot must be an image this app stored itself (the upload endpoint answers with either a local
 * /api/media path or this account's Cloudinary URL). Anything else — javascript:/data: URLs, plain http,
 * other hosts — would let a student point the admin's browser at an arbitrary address.
 */
export function isOwnScreenshotUrl(value, config) {
  if (ownUpload.test(value)) return true;
  if (!config?.cloudinaryUrl) return false;
  try {
    const url = new URL(value);
    const cloud = new URL(config.cloudinaryUrl).hostname;
    // Only the students' screenshot folder: never the academy's own images or lecture files.
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && !url.username && url.pathname.startsWith(`/${cloud}/image/upload/`)
      && /^\/[^/]+\/image\/upload\/(?:v\d+\/)?cpr-academy\/payments\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function billingRoutes(route, database, config) {
  const screenshotUrl = z.union([z.string().max(2048).refine(value => isOwnScreenshotUrl(value, config), 'Attach the screenshot with the upload button.'), z.literal('')]).default('');
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
  // Replaces the old "share it over WhatsApp" step: the student attaches their own
  // transaction ID, the mobile they paid from, and an optional screenshot right on
  // the invoice, for an admin to review in /admin/payments before confirming.
  route('POST', '/payments/:id/proof', { auth: 'active', body: z.object({
    transactionId, payerMobile: mobile, screenshotUrl,
  }).strict() }, async request => database.transaction(async transaction => {
    const payment = await one(transaction, 'SELECT * FROM payments WHERE id=$1 AND user_id=$2 FOR UPDATE', [request.params.id, request.auth.user_id]);
    ensure(payment, 404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
    ensure(payment.method === 'manual', 409, 'PROOF_NOT_APPLICABLE', 'This payment method does not require manual proof.');
    ensure(payment.status === 'pending', 409, 'INVALID_PAYMENT_STATE', 'Only a pending invoice can be updated with payment proof.');
    const duplicate = await one(transaction, "SELECT id FROM payments WHERE transaction_id=$1 AND id<>$2 AND status<>'failed'", [request.body.transactionId, payment.id]);
    ensure(!duplicate, 409, 'DUPLICATE_TRANSACTION_ID', 'This transaction ID is already linked to another payment.');
    const updated = await one(transaction, `UPDATE payments SET transaction_id=$2,payer_mobile=$3,screenshot_url=$4,proof_submitted_at=now() WHERE id=$1 RETURNING *`,
      [payment.id, request.body.transactionId, request.body.payerMobile, request.body.screenshotUrl || null]);
    await audit(transaction, request.auth.user_id, 'payment.proof_submitted', payment.id, { transactionId: request.body.transactionId });
    return paymentDto(updated);
  }));
  route('GET', '/invoices/:id', { auth: 'active' }, async request => {
    const payment = await one(database, 'SELECT * FROM payments WHERE id=$1 AND user_id=$2', [request.params.id, request.auth.user_id]);
    ensure(payment, 404, 'INVOICE_NOT_FOUND', 'Invoice not found.');
    return { id: payment.id, invoiceNo: payment.invoice_no, issuedAt: payment.created_at, paidAt: payment.paid_at, status: payment.status,
      method: payment.method, transactionId: payment.transaction_id, billedTo: payment.billed_to,
      payerMobile: payment.payer_mobile ?? null, screenshotUrl: payment.screenshot_url ?? null, proofSubmittedAt: payment.proof_submitted_at ?? null,
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
  // The dashboard's Transaction approval panel. Filtering and paging happen here, so an old pending
  // invoice can never fall outside a fixed window of recent rows and go unreviewed.
  route('GET', '/admin/transactions', { auth: 'admin', query: pageQuery.extend({ status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional() }) }, async request => {
    const status = request.query.status || null;
    const [rows, counts] = await Promise.all([
      database.query(`SELECT p.*,u.full_name FROM payments p JOIN users u ON u.id=p.user_id WHERE ($1::text IS NULL OR p.status=$1)
        ORDER BY (p.status='pending') DESC, p.created_at DESC, p.id LIMIT $2 OFFSET $3`, [status, request.query.limit, request.query.offset]),
      one(database, `SELECT count(*) FILTER (WHERE $1::text IS NULL OR status=$1)::int AS total, count(*) FILTER (WHERE status='pending')::int AS pending FROM payments`, [status]),
    ]);
    return { items: rows.rows.map(row => ({ ...paymentDto(row), userId: row.user_id, studentId: row.user_id, studentName: row.full_name })), total: counts.total, pendingCount: counts.pending };
  });
  route('GET', '/admin/payments', { auth: 'admin', query: pageQuery.extend({ status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional() }) }, async request => (await database.query('SELECT * FROM payments WHERE ($1::text IS NULL OR status=$1) ORDER BY created_at DESC,id LIMIT $2 OFFSET $3', [request.query.status || null, request.query.limit, request.query.offset])).rows.map(row => ({ ...paymentDto(row), userId: row.user_id })));

  route('POST', '/admin/payments/:id/confirm', { auth: 'admin', body: z.object({ transactionId, amount: money, evidence: z.string().trim().min(10).max(2000) }).strict() }, async request => database.transaction(async transaction => {
    const payment = await one(transaction, 'SELECT * FROM payments WHERE id=$1 FOR UPDATE', [request.params.id]);
    ensure(payment, 404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
    ensure(payment.method === 'manual', 409, 'GATEWAY_CONFIRMATION_REQUIRED', 'Gateway payments require provider verification.');
    ensure(payment.amount_minor === Math.round(request.body.amount * 100), 409, 'AMOUNT_MISMATCH', 'The verified amount must match the invoice.');
    const matchingTransaction = await one(transaction, "SELECT id FROM payments WHERE transaction_id=$1 AND id<>$2 AND status<>'failed'", [request.body.transactionId, payment.id]);
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
  // Every plan of one course — switched-off ones too, so an admin can bring a package back.
  route('GET', '/admin/subscription-plans', { auth: 'admin', query: z.object({ courseId: uuid }) }, async request =>
    (await database.query('SELECT * FROM subscription_plans WHERE course_id=$1 ORDER BY is_active DESC,name,id', [request.query.courseId])).rows.map(planDto));
  // Plans are never deleted (subscriptions and invoices point at them); switching `isActive` off retires one.
  route('PATCH', '/admin/subscription-plans/:id', { auth: 'admin', body: z.object({ name: text, description: z.string().max(2000), amount: money.refine(value => value > 0), durationDays: z.number().int().min(1).max(3650), features: z.array(text).max(20), isActive: z.boolean() })
    .partial().strict().refine(body => Object.keys(body).length > 0, 'Send at least one field to change.') }, async request => database.transaction(async transaction => {
    const input = request.body;
    const plan = await one(transaction, 'SELECT * FROM subscription_plans WHERE id=$1 FOR UPDATE', [request.params.id]);
    ensure(plan, 404, 'PLAN_NOT_FOUND', 'Subscription plan not found.');
    const updated = await one(transaction, 'UPDATE subscription_plans SET name=$2,description=$3,price_minor=$4,duration_days=$5,features=$6,is_active=$7 WHERE id=$1 RETURNING *',
      [plan.id, input.name ?? plan.name, input.description ?? plan.description, input.amount === undefined ? plan.price_minor : Math.round(input.amount * 100),
        input.durationDays ?? plan.duration_days, JSON.stringify(input.features ?? plan.features), input.isActive ?? plan.is_active]);
    await audit(transaction, request.auth.user_id, 'subscription_plan.updated', plan.id);
    return planDto(updated);
  }));
  route('GET', '/subscription-plans', { auth: 'active', query: z.object({ batchId: uuid }) }, async request => {
    const enrollment = await one(database, 'SELECT course_id FROM enrollments WHERE id=$1 AND user_id=$2', [request.query.batchId, request.auth.user_id]);
    ensure(enrollment, 404, 'NOT_FOUND', 'Batch not found.');
    return (await database.query('SELECT * FROM subscription_plans WHERE course_id=$1 AND is_active ORDER BY name,id', [enrollment.course_id])).rows.map(plan => ({ id: plan.id, name: plan.name, amount: plan.price_minor / 100, durationLabel: `${plan.duration_days} days`, features: plan.features }));
  });
  route('GET', '/me/subscriptions/batches', { auth: 'active' }, async request => (await database.query(`SELECT e.id,e.created_at,c.slug,c.title FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=$1 AND e.status='active' AND e.expires_at>now() ORDER BY c.title`, [request.auth.user_id])).rows.map(row => ({ id: row.id, slug: row.slug, title: row.title, regNo: registrationNumber(row.id, row.created_at) })));
  // The student's subscriptions in three lists: active, unpaid and previous. Each course enrolment is listed in
  // the one it belongs to (running, fee outstanding, lapsed) with the packages bought on top of it right after,
  // so the page answers "which courses do I have, and what is the state of each". `batchId` narrows it to one
  // enrolment. Every item carries `slug` and `invoiceId` so an unpaid one can open its invoice, or checkout when
  // none exists yet.
  route('GET', '/me/subscriptions', { auth: 'active', query: z.object({ batchId: uuid.optional() }) }, async request => {
    const userId = request.auth.user_id;
    const { batchId } = request.query;
    const enrollments = (await database.query('SELECT e.*,c.slug,c.title,c.price_minor,c.discount_minor FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=$1 ORDER BY c.title,e.id', [userId])).rows
      .filter(enrollment => !batchId || enrollment.id === batchId);
    ensure(!batchId || enrollments.length, 404, 'NOT_FOUND', 'Batch not found.');
    const packages = (await database.query('SELECT s.*,p.name,p.description,p.price_minor,p.course_id FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id WHERE s.user_id=$1 ORDER BY s.ends_at DESC,s.id', [userId])).rows;
    const payments = (await database.query("SELECT * FROM payments WHERE user_id=$1 AND status IN ('pending','paid') ORDER BY created_at DESC,id", [userId])).rows;

    const groups = { active: [], unpaid: [], previous: [] };
    for (const enrollment of enrollments) {
      const base = { slug: enrollment.slug, courseTitle: enrollment.title, invoiceId: null };
      const mine = payments.filter(payment => payment.course_id === enrollment.course_id);
      const course = { ...base, kind: 'course', name: enrollment.title, description: '' };
      if (enrollment.status === 'active' || enrollment.status === 'expired') {
        const running = enrollment.status === 'active' && new Date(enrollment.expires_at).getTime() > Date.now();
        const paidFee = mine.find(payment => payment.plan_id === null && payment.status === 'paid');
        groups[running ? 'active' : 'previous'].push({ ...course, id: enrollment.id, amount: paidFee ? paidFee.amount_minor / 100 : null, startsOn: enrollment.starts_at, endsOn: enrollment.expires_at });
      }
      for (const row of packages.filter(item => item.course_id === enrollment.course_id)) {
        groups[new Date(row.ends_at).getTime() > Date.now() ? 'active' : 'previous'].push({ ...base, id: row.id, kind: 'plan', name: row.name, description: row.description, amount: row.price_minor / 100, startsOn: row.starts_at, endsOn: row.ends_at });
      }
      // `id` is the invoice to open; `awaitingApproval` means the student already sent proof and an admin has yet to confirm it.
      const invoices = mine.filter(payment => payment.status === 'pending').map(payment => ({ ...base, id: payment.id, kind: payment.plan_id ? 'plan' : 'course', name: payment.description,
        amount: payment.amount_minor / 100, invoicedOn: payment.created_at, awaitingApproval: Boolean(payment.proof_submitted_at), invoiceId: payment.id }));
      // Enrolled but not invoiced yet: the fee is still owed, and checkout is where the invoice gets made.
      if (enrollment.status === 'pending_payment' && !invoices.some(item => item.kind === 'course')) {
        invoices.push({ ...course, id: enrollment.id, amount: (enrollment.discount_minor ?? enrollment.price_minor) / 100, invoicedOn: enrollment.created_at, awaitingApproval: false });
      }
      groups.unpaid.push(...invoices.sort((left, right) => (left.kind === 'course' ? 0 : 1) - (right.kind === 'course' ? 0 : 1)));
    }
    return groups;
  });
}
