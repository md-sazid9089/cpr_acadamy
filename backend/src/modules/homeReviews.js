import { z } from 'zod';
import { one } from '../db.js';
import { ensure, uuid, audit } from '../http.js';

export const HOME_REVIEW_LIMIT = 12;

const fields = z.object({
  name: z.string().trim().min(1, 'Add the student’s name.').max(80),
  role: z.string().trim().max(80).default(''),
  quote: z.string().trim().min(1, 'Add what the student said.').max(600),
  rating: z.number().int().min(1).max(5).default(5),
  isPublished: z.boolean().default(true),
}).strict();

function dto(row) {
  return { id: row.id, name: row.name, role: row.role, quote: row.quote, rating: row.rating, position: row.position, isPublished: row.is_published };
}

/** Home page reviews ("শিক্ষার্থীদের বিশ্বাসের গল্প!"), written and ordered by admins. */
export function homeReviewRoutes(route, database) {
  route('GET', '/home-reviews', {}, async () => (
    await database.query('SELECT * FROM home_reviews WHERE is_published ORDER BY position, created_at, id')
  ).rows.map(row => ({ id: row.id, name: row.name, role: row.role, quote: row.quote, rating: row.rating })));

  route('GET', '/admin/home-reviews', { auth: 'admin' }, async () => (
    await database.query('SELECT * FROM home_reviews ORDER BY position, created_at, id')
  ).rows.map(dto));

  route('POST', '/admin/home-reviews', { auth: 'admin', body: fields }, async request => database.transaction(async transaction => {
    await transaction.query('LOCK TABLE home_reviews IN SHARE ROW EXCLUSIVE MODE');
    const { count, next } = await one(transaction, 'SELECT count(*)::int AS count, COALESCE(max(position)+1,0)::int AS next FROM home_reviews');
    ensure(count < HOME_REVIEW_LIMIT, 409, 'HOME_REVIEW_LIMIT', `The home page holds up to ${HOME_REVIEW_LIMIT} reviews. Delete one to add another.`);
    const { name, role, quote, rating, isPublished } = request.body;
    const saved = await one(transaction, 'INSERT INTO home_reviews(name,role,quote,rating,position,is_published) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, role, quote, rating, next, isPublished]);
    await audit(transaction, request.auth.user_id, 'home_review.created', saved.id);
    return dto(saved);
  }));

  route('PATCH', '/admin/home-reviews/:id', { auth: 'admin', body: fields.partial() }, async request => database.transaction(async transaction => {
    const existing = await one(transaction, 'SELECT * FROM home_reviews WHERE id=$1 FOR UPDATE', [request.params.id]);
    ensure(existing, 404, 'NOT_FOUND', 'Review not found.');
    const next = { name: existing.name, role: existing.role, quote: existing.quote, rating: existing.rating, isPublished: existing.is_published, ...request.body };
    const saved = await one(transaction, 'UPDATE home_reviews SET name=$1,role=$2,quote=$3,rating=$4,is_published=$5 WHERE id=$6 RETURNING *',
      [next.name, next.role, next.quote, next.rating, next.isPublished, existing.id]);
    await audit(transaction, request.auth.user_id, 'home_review.updated', saved.id);
    return dto(saved);
  }));

  route('PUT', '/admin/home-reviews/order', { auth: 'admin', body: z.object({ ids: z.array(uuid).min(1).max(500) }).strict() }, async request => database.transaction(async transaction => {
    await transaction.query('LOCK TABLE home_reviews IN SHARE ROW EXCLUSIVE MODE');
    const known = (await transaction.query('SELECT id FROM home_reviews')).rows.map(row => row.id);
    const { ids } = request.body;
    ensure(ids.length === known.length && new Set(ids).size === ids.length && ids.every(id => known.includes(id)), 400, 'INVALID_ORDER',
      'Send every review exactly once to change the order.');
    for (const [position, id] of ids.entries()) await transaction.query('UPDATE home_reviews SET position=$1 WHERE id=$2', [position, id]);
    return { ok: true };
  }));

  route('DELETE', '/admin/home-reviews/:id', { auth: 'admin' }, async request => database.transaction(async transaction => {
    const removed = await one(transaction, 'DELETE FROM home_reviews WHERE id=$1 RETURNING id', [request.params.id]);
    ensure(removed, 404, 'NOT_FOUND', 'Review not found.');
    await audit(transaction, request.auth.user_id, 'home_review.removed', removed.id);
    return { ok: true };
  }));
}
