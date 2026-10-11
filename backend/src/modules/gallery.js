import { z } from 'zod';
import { one } from '../db.js';
import { ensure, text, pageQuery, audit } from '../http.js';

/** A path on this site: an upload the admin made here (/api/media/...) or one of the site's own images (/assets/...). */
const sitePath = /^\/(?!\/)[A-Za-z0-9_\-./%]{1,500}$/;

/**
 * A gallery photo must be an image this academy stored itself: a path on this site, or this account's
 * Cloudinary uploads (where the upload button puts it). An arbitrary HTTPS address is refused, as for payment
 * screenshots: an outside image can vanish or change, and its host learns who viewed the page. This is the
 * usual allowlist approach to user-supplied URLs.
 */
export function isOwnImageUrl(value, config) {
  if (sitePath.test(value)) return true;
  if (!config?.cloudinaryUrl) return false;
  try {
    const url = new URL(value);
    const cloud = new URL(config.cloudinaryUrl).hostname;
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && !url.username && !url.password && !url.port
      && url.pathname.startsWith(`/${cloud}/image/upload/`) && /\/cpr-academy\/uploads\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(url.pathname);
  } catch {
    return false;
  }
}

const galleryFields = config => z.object({
  section: text.max(80),
  caption: z.string().trim().max(300).default(''),
  imageUrl: z.string().max(2048).refine(value => isOwnImageUrl(value, config), 'Add the photo with the upload button.'),
  position: z.number().int().min(0).max(100000).default(0),
  isPublished: z.boolean().default(true),
}).strict();

function galleryDto(row) {
  return { id: row.id, section: row.section, caption: row.caption, imageUrl: row.image_url,
    position: row.position, isPublished: row.is_published, createdAt: row.created_at };
}

export function galleryRoutes(route, database, config) {
  const fields = galleryFields(config);
  // Public: every published photo, grouped by section for the Gallery page.
  route('GET', '/gallery', {}, async () => {
    const rows = (await database.query("SELECT * FROM gallery_photos WHERE is_published ORDER BY section,position,id")).rows;
    const groups = new Map();
    for (const row of rows) {
      if (!groups.has(row.section)) groups.set(row.section, { section: row.section, photos: [] });
      groups.get(row.section).photos.push(galleryDto(row));
    }
    return [...groups.values()];
  });

  route('GET', '/admin/gallery', { auth: 'admin', query: pageQuery.extend({ section: z.string().max(80).optional() }) }, async request => (
    await database.query('SELECT * FROM gallery_photos WHERE ($1::text IS NULL OR section=$1) ORDER BY section,position,id LIMIT $2 OFFSET $3',
      [request.query.section || null, request.query.limit, request.query.offset])
  ).rows.map(galleryDto));

  async function save(request, creating) {
    return database.transaction(async transaction => {
      const existing = creating ? null : await one(transaction, 'SELECT * FROM gallery_photos WHERE id=$1 FOR UPDATE', [request.params.id]);
      if (!creating) ensure(existing, 404, 'NOT_FOUND', 'Photo not found.');
      const previous = existing ? { section: existing.section, caption: existing.caption, imageUrl: existing.image_url, position: existing.position, isPublished: existing.is_published } : {};
      const input = fields.parse({ ...previous, ...request.body });
      const saved = creating
        ? await one(transaction, 'INSERT INTO gallery_photos(section,caption,image_url,position,is_published) VALUES ($1,$2,$3,$4,$5) RETURNING *',
          [input.section, input.caption, input.imageUrl, input.position, input.isPublished])
        : await one(transaction, 'UPDATE gallery_photos SET section=$1,caption=$2,image_url=$3,position=$4,is_published=$5 WHERE id=$6 RETURNING *',
          [input.section, input.caption, input.imageUrl, input.position, input.isPublished, existing.id]);
      await audit(transaction, request.auth.user_id, `gallery.${creating ? 'created' : 'updated'}`, saved.id);
      return galleryDto(saved);
    });
  }
  route('POST', '/admin/gallery', { auth: 'admin', body: fields }, request => save(request, true));
  route('PATCH', '/admin/gallery/:id', { auth: 'admin', body: fields.partial() }, request => save(request, false));
  route('DELETE', '/admin/gallery/:id', { auth: 'admin' }, async request => database.transaction(async transaction => {
    const removed = await one(transaction, 'DELETE FROM gallery_photos WHERE id=$1 RETURNING id', [request.params.id]);
    ensure(removed, 404, 'NOT_FOUND', 'Photo not found.');
    await audit(transaction, request.auth.user_id, 'gallery.removed', removed.id);
    return { ok: true };
  }));
}
