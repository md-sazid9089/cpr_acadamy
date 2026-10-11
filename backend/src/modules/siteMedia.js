import { z } from 'zod';
import { one } from '../db.js';
import { ensure, uuid, audit } from '../http.js';
import { isOwnImageUrl } from './gallery.js';

export const HERO_SLIDE_LIMIT = 8;
export const EVENT_PHOTO_LIMIT = 60;
const GALLERY_HERO_KEY = 'gallery_hero';

/** Where a hero poster may send visitors: a page on this site ("/courses/...") or an https:// address. */
const link = z.string().trim().max(500).refine(value => value === '' || /^\/(?!\/)\S*$/.test(value) || /^https:\/\/\S+$/.test(value),
  'Use a page on this site, like /courses/fcps, or a full https:// address.');
const order = z.object({ ids: z.array(uuid).min(1).max(500) }).strict();

function slideDto(row) {
  return { id: row.id, imageUrl: row.image_url, title: row.title, link: row.link, position: row.position, isPublished: row.is_published };
}
function photoDto(row) {
  return { id: row.id, imageUrl: row.image_url, isCover: row.is_cover, position: row.position };
}

/** Every event with its photos in order; the cover is the photo marked as cover, else the first. */
async function loadEvents(database, { publishedOnly }) {
  const events = (await database.query(`SELECT * FROM gallery_events ${publishedOnly ? 'WHERE is_published' : ''} ORDER BY position, created_at, id`)).rows;
  if (!events.length) return [];
  const photos = (await database.query('SELECT * FROM gallery_event_photos WHERE event_id = ANY($1::uuid[]) ORDER BY position, created_at, id', [events.map(event => event.id)])).rows;
  return events.map(event => {
    const own = photos.filter(photo => photo.event_id === event.id).map(photoDto);
    return { id: event.id, name: event.name, position: event.position, isPublished: event.is_published,
      cover: own.find(photo => photo.isCover) ?? own[0] ?? null, photos: own };
  }).filter(event => !publishedOnly || event.photos.length > 0);
}

async function galleryHero(database) {
  const row = await one(database, 'SELECT value FROM site_settings WHERE key=$1', [GALLERY_HERO_KEY]);
  return row?.value?.imageUrl ? { imageUrl: row.value.imageUrl, alt: row.value.alt ?? '' } : null;
}

/** Rewrites positions 0..n-1 in the order given; every id must belong to the table. */
async function reorder(transaction, table, ids, where = 'true', params = []) {
  const known = (await transaction.query(`SELECT id FROM ${table} WHERE ${where}`, params)).rows.map(row => row.id);
  ensure(ids.length === known.length && new Set(ids).size === ids.length && ids.every(id => known.includes(id)), 400, 'INVALID_ORDER',
    'Send every item exactly once to change the order.');
  for (const [position, id] of ids.entries()) await transaction.query(`UPDATE ${table} SET position=$1 WHERE id=$2`, [position, id]);
}

export function siteMediaRoutes(route, database, config) {
  const image = z.string().max(2048).refine(value => isOwnImageUrl(value, config), 'Add the image with the upload button.');

  // ── Public ──
  route('GET', '/hero-slides', {}, async () => (
    await database.query('SELECT * FROM hero_slides WHERE is_published ORDER BY position, created_at, id')
  ).rows.map(row => ({ id: row.id, imageUrl: row.image_url, title: row.title, link: row.link })));

  route('GET', '/gallery/page', {}, async () => ({
    hero: await galleryHero(database),
    events: (await loadEvents(database, { publishedOnly: true })).map(event => ({
      id: event.id, name: event.name, coverUrl: event.cover.imageUrl,
      photos: event.photos.map(photo => ({ id: photo.id, imageUrl: photo.imageUrl })),
    })),
  }));

  // ── Home hero posters ──
  route('GET', '/admin/hero-slides', { auth: 'admin' }, async () => (
    await database.query('SELECT * FROM hero_slides ORDER BY position, created_at, id')
  ).rows.map(slideDto));

  route('POST', '/admin/hero-slides', { auth: 'admin', body: z.object({ imageUrl: image, title: z.string().trim().max(200).default(''), link: link.default(''), isPublished: z.boolean().default(true) }).strict() },
    async request => database.transaction(async transaction => {
      await transaction.query('LOCK TABLE hero_slides IN SHARE ROW EXCLUSIVE MODE');
      const { count, next } = await one(transaction, 'SELECT count(*)::int AS count, COALESCE(max(position)+1,0)::int AS next FROM hero_slides');
      ensure(count < HERO_SLIDE_LIMIT, 409, 'HERO_SLIDE_LIMIT', `The home page holds up to ${HERO_SLIDE_LIMIT} posters. Delete one to add another.`);
      const { imageUrl, title, link: target, isPublished } = request.body;
      const saved = await one(transaction, 'INSERT INTO hero_slides(image_url,title,link,position,is_published) VALUES ($1,$2,$3,$4,$5) RETURNING *', [imageUrl, title, target, next, isPublished]);
      await audit(transaction, request.auth.user_id, 'hero_slide.created', saved.id);
      return slideDto(saved);
    }));

  route('PATCH', '/admin/hero-slides/:id', { auth: 'admin', body: z.object({ title: z.string().trim().max(200), link, isPublished: z.boolean() }).partial().strict() },
    async request => database.transaction(async transaction => {
      const existing = await one(transaction, 'SELECT * FROM hero_slides WHERE id=$1 FOR UPDATE', [request.params.id]);
      ensure(existing, 404, 'NOT_FOUND', 'Poster not found.');
      const next = { title: existing.title, link: existing.link, isPublished: existing.is_published, ...request.body };
      const saved = await one(transaction, 'UPDATE hero_slides SET title=$1,link=$2,is_published=$3 WHERE id=$4 RETURNING *', [next.title, next.link, next.isPublished, existing.id]);
      await audit(transaction, request.auth.user_id, 'hero_slide.updated', saved.id);
      return slideDto(saved);
    }));

  route('PUT', '/admin/hero-slides/order', { auth: 'admin', body: order }, async request => database.transaction(async transaction => {
    await transaction.query('LOCK TABLE hero_slides IN SHARE ROW EXCLUSIVE MODE');
    await reorder(transaction, 'hero_slides', request.body.ids);
    return { ok: true };
  }));

  route('DELETE', '/admin/hero-slides/:id', { auth: 'admin' }, async request => database.transaction(async transaction => {
    const removed = await one(transaction, 'DELETE FROM hero_slides WHERE id=$1 RETURNING id', [request.params.id]);
    ensure(removed, 404, 'NOT_FOUND', 'Poster not found.');
    await audit(transaction, request.auth.user_id, 'hero_slide.removed', removed.id);
    return { ok: true };
  }));

  // ── Gallery page hero photo ──
  route('GET', '/admin/gallery-hero', { auth: 'admin' }, async () => ({ hero: await galleryHero(database) }));
  route('PUT', '/admin/gallery-hero', { auth: 'admin', body: z.object({ imageUrl: image.nullable(), alt: z.string().trim().max(300).default('') }).strict() },
    async request => database.transaction(async transaction => {
      const { imageUrl, alt } = request.body;
      if (imageUrl) {
        await transaction.query(`INSERT INTO site_settings(key,value,updated_at) VALUES ($1,$2,now())
          ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`, [GALLERY_HERO_KEY, JSON.stringify({ imageUrl, alt })]);
      } else {
        await transaction.query('DELETE FROM site_settings WHERE key=$1', [GALLERY_HERO_KEY]);
      }
      await audit(transaction, request.auth.user_id, 'gallery_hero.updated', null);
      return { hero: await galleryHero(transaction) };
    }));

  // ── Gallery events ──
  route('GET', '/admin/gallery-events', { auth: 'admin' }, () => loadEvents(database, { publishedOnly: false }));

  async function eventFor(transaction, id) {
    const event = await one(transaction, 'SELECT * FROM gallery_events WHERE id=$1 FOR UPDATE', [id]);
    ensure(event, 404, 'NOT_FOUND', 'Event not found.');
    return event;
  }
  const eventResult = async (transaction, id) => (await loadEvents(transaction, { publishedOnly: false })).find(event => event.id === id);

  route('POST', '/admin/gallery-events', { auth: 'admin', body: z.object({ name: z.string().trim().max(120).default('') }).strict() },
    async request => database.transaction(async transaction => {
      // A new event goes to the top of the list, where the admin is about to fill it.
      const { first } = await one(transaction, 'SELECT COALESCE(min(position)-1,0)::int AS first FROM gallery_events');
      const saved = await one(transaction, 'INSERT INTO gallery_events(name,position) VALUES ($1,$2) RETURNING id', [request.body.name, first]);
      await audit(transaction, request.auth.user_id, 'gallery_event.created', saved.id);
      return eventResult(transaction, saved.id);
    }));

  route('PATCH', '/admin/gallery-events/:id', { auth: 'admin', body: z.object({ name: z.string().trim().max(120), isPublished: z.boolean() }).partial().strict() },
    async request => database.transaction(async transaction => {
      const event = await eventFor(transaction, request.params.id);
      const next = { name: event.name, isPublished: event.is_published, ...request.body };
      if (next.isPublished) {
        const { count } = await one(transaction, 'SELECT count(*)::int AS count FROM gallery_event_photos WHERE event_id=$1', [event.id]);
        ensure(count > 0, 409, 'EVENT_HAS_NO_PHOTOS', 'Add at least one photo before showing this event.');
      }
      await transaction.query('UPDATE gallery_events SET name=$1,is_published=$2 WHERE id=$3', [next.name, next.isPublished, event.id]);
      await audit(transaction, request.auth.user_id, 'gallery_event.updated', event.id);
      return eventResult(transaction, event.id);
    }));

  route('PUT', '/admin/gallery-events/order', { auth: 'admin', body: order }, async request => database.transaction(async transaction => {
    await transaction.query('LOCK TABLE gallery_events IN SHARE ROW EXCLUSIVE MODE');
    await reorder(transaction, 'gallery_events', request.body.ids);
    return { ok: true };
  }));

  route('DELETE', '/admin/gallery-events/:id', { auth: 'admin' }, async request => database.transaction(async transaction => {
    const removed = await one(transaction, 'DELETE FROM gallery_events WHERE id=$1 RETURNING id', [request.params.id]);
    ensure(removed, 404, 'NOT_FOUND', 'Event not found.');
    await audit(transaction, request.auth.user_id, 'gallery_event.removed', removed.id);
    return { ok: true };
  }));

  route('POST', '/admin/gallery-events/:id/photos', { auth: 'admin', body: z.object({ imageUrl: image }).strict() },
    async request => database.transaction(async transaction => {
      const event = await eventFor(transaction, request.params.id);
      const { count, next } = await one(transaction, 'SELECT count(*)::int AS count, COALESCE(max(position)+1,0)::int AS next FROM gallery_event_photos WHERE event_id=$1', [event.id]);
      ensure(count < EVENT_PHOTO_LIMIT, 409, 'EVENT_PHOTO_LIMIT', `An event holds up to ${EVENT_PHOTO_LIMIT} photos.`);
      await transaction.query('INSERT INTO gallery_event_photos(event_id,image_url,position,is_cover) VALUES ($1,$2,$3,$4)', [event.id, request.body.imageUrl, next, count === 0]);
      await audit(transaction, request.auth.user_id, 'gallery_event.photo_added', event.id);
      return eventResult(transaction, event.id);
    }));

  route('PATCH', '/admin/gallery-events/:id/photos/:photoId', { auth: 'admin', body: z.object({ isCover: z.literal(true) }).strict() },
    async request => database.transaction(async transaction => {
      const event = await eventFor(transaction, request.params.id);
      const photo = await one(transaction, 'SELECT id FROM gallery_event_photos WHERE id=$1 AND event_id=$2', [request.params.photoId, event.id]);
      ensure(photo, 404, 'NOT_FOUND', 'Photo not found.');
      await transaction.query('UPDATE gallery_event_photos SET is_cover=(id=$1) WHERE event_id=$2', [photo.id, event.id]);
      await audit(transaction, request.auth.user_id, 'gallery_event.cover_changed', event.id);
      return eventResult(transaction, event.id);
    }));

  route('DELETE', '/admin/gallery-events/:id/photos/:photoId', { auth: 'admin' }, async request => database.transaction(async transaction => {
    const event = await eventFor(transaction, request.params.id);
    const removed = await one(transaction, 'DELETE FROM gallery_event_photos WHERE id=$1 AND event_id=$2 RETURNING is_cover', [request.params.photoId, event.id]);
    ensure(removed, 404, 'NOT_FOUND', 'Photo not found.');
    const first = await one(transaction, 'SELECT id FROM gallery_event_photos WHERE event_id=$1 ORDER BY position, created_at, id LIMIT 1', [event.id]);
    if (!first) await transaction.query('UPDATE gallery_events SET is_published=false WHERE id=$1', [event.id]); // nothing left to show
    else if (removed.is_cover) await transaction.query('UPDATE gallery_event_photos SET is_cover=(id=$1) WHERE event_id=$2', [first.id, event.id]);
    await audit(transaction, request.auth.user_id, 'gallery_event.photo_removed', event.id);
    return eventResult(transaction, event.id);
  }));
}
