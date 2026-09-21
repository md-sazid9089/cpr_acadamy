import { z } from 'zod';
import { one } from '../db.js';
import { ensure, text, pageQuery, audit } from '../http.js';

// A photo's URL is either the admin's own upload (a root-relative /api/media/...
// path) or a full HTTPS link, mirroring the same union used for course posters.
const imageUrl = z.union([
  z.string().url().max(2048).refine(value => value.startsWith('https://'), 'An HTTPS URL is required'),
  z.string().regex(/^\/[A-Za-z0-9_\-./%]{1,500}$/),
]);

const galleryFields = z.object({
  section: text.max(80),
  caption: z.string().trim().max(300).default(''),
  imageUrl,
  position: z.number().int().min(0).max(100000).default(0),
  isPublished: z.boolean().default(true),
}).strict();

function galleryDto(row) {
  return { id: row.id, section: row.section, caption: row.caption, imageUrl: row.image_url,
    position: row.position, isPublished: row.is_published, createdAt: row.created_at };
}

export function galleryRoutes(route, database) {
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
      const input = galleryFields.parse({ ...previous, ...request.body });
      const saved = creating
        ? await one(transaction, 'INSERT INTO gallery_photos(section,caption,image_url,position,is_published) VALUES ($1,$2,$3,$4,$5) RETURNING *',
          [input.section, input.caption, input.imageUrl, input.position, input.isPublished])
        : await one(transaction, 'UPDATE gallery_photos SET section=$1,caption=$2,image_url=$3,position=$4,is_published=$5 WHERE id=$6 RETURNING *',
          [input.section, input.caption, input.imageUrl, input.position, input.isPublished, existing.id]);
      await audit(transaction, request.auth.user_id, `gallery.${creating ? 'created' : 'updated'}`, saved.id);
      return galleryDto(saved);
    });
  }
  route('POST', '/admin/gallery', { auth: 'admin', body: galleryFields }, request => save(request, true));
  route('PATCH', '/admin/gallery/:id', { auth: 'admin', body: galleryFields.partial() }, request => save(request, false));
  route('DELETE', '/admin/gallery/:id', { auth: 'admin' }, async request => database.transaction(async transaction => {
    const removed = await one(transaction, 'DELETE FROM gallery_photos WHERE id=$1 RETURNING id', [request.params.id]);
    ensure(removed, 404, 'NOT_FOUND', 'Photo not found.');
    await audit(transaction, request.auth.user_id, 'gallery.removed', removed.id);
    return { ok: true };
  }));
}
