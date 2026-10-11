import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

const img = (n) => `/api/media/aaaaaaaa-0000-0000-0000-${String(n).padStart(12, '0')}.jpg`;

test('home hero posters: seeded from the old posters, admin-managed, limited to 8, public feed shows only switched-on ones', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();

    // The migration seeds the six posters the home page used to hard-code.
    let response = await student.request('GET', '/hero-slides');
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().length, 6);
    assert.equal(response.json()[0].imageUrl, '/assets/carousel/posterd.jpeg');

    assert.equal((await student.request('GET', '/admin/hero-slides')).statusCode, 403);
    assert.equal((await student.request('POST', '/admin/hero-slides', { imageUrl: img(1) })).statusCode, 403);

    response = await admin.request('POST', '/admin/hero-slides', { imageUrl: img(1), title: 'New batch', link: '/courses/fcps' });
    assert.equal(response.statusCode, 200, response.body);
    const added = response.json();
    assert.equal(added.position, 6);
    assert.equal((await admin.request('POST', '/admin/hero-slides', { imageUrl: 'https://elsewhere.test/a.jpg' })).statusCode, 400);
    assert.equal((await admin.request('POST', '/admin/hero-slides', { imageUrl: img(2), link: 'javascript:alert(1)' })).statusCode, 400);
    assert.equal((await admin.request('POST', '/admin/hero-slides', { imageUrl: img(2), link: '//evil.test' })).statusCode, 400);
    assert.equal((await admin.request('POST', '/admin/hero-slides', { imageUrl: img(2), link: 'https://www.facebook.com/cpr' })).statusCode, 200);

    response = await admin.request('POST', '/admin/hero-slides', { imageUrl: img(3) });
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'HERO_SLIDE_LIMIT');

    // Switch one off, move the new one to the front, and check the public order.
    let slides = (await admin.request('GET', '/admin/hero-slides')).json();
    assert.equal((await admin.request('PATCH', `/admin/hero-slides/${slides[1].id}`, { isPublished: false })).statusCode, 200);
    const ids = [added.id, ...slides.map((slide) => slide.id).filter((id) => id !== added.id)];
    assert.equal((await admin.request('PUT', '/admin/hero-slides/order', { ids })).statusCode, 200);
    assert.equal((await admin.request('PUT', '/admin/hero-slides/order', { ids: ids.slice(1) })).json().code, 'INVALID_ORDER');
    response = await student.request('GET', '/hero-slides');
    assert.equal(response.json().length, 7);
    assert.deepEqual(response.json()[0], { id: added.id, imageUrl: img(1), title: 'New batch', link: '/courses/fcps' });
    assert.equal(response.json().some((slide) => slide.id === slides[1].id), false);

    assert.equal((await admin.request('DELETE', `/admin/hero-slides/${added.id}`)).statusCode, 200);
    assert.equal((await admin.request('DELETE', `/admin/hero-slides/${added.id}`)).statusCode, 404);
  } finally { await context.close(); }
});

test('gallery page: hero photo and events with covers, publish rules and the public feed', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();

    let response = await student.request('GET', '/gallery/page');
    assert.deepEqual(response.json(), { hero: null, events: [] });

    assert.equal((await student.request('PUT', '/admin/gallery-hero', { imageUrl: img(9), alt: 'x' })).statusCode, 403);
    response = await admin.request('PUT', '/admin/gallery-hero', { imageUrl: img(9), alt: 'Group photo' });
    assert.equal(response.statusCode, 200, response.body);
    assert.deepEqual(response.json().hero, { imageUrl: img(9), alt: 'Group photo' });

    response = await admin.request('POST', '/admin/gallery-events', { name: 'Felicitation' });
    assert.equal(response.statusCode, 200, response.body);
    const first = response.json();
    assert.equal(first.isPublished, false);
    // An event with no photos cannot be shown.
    response = await admin.request('PATCH', `/admin/gallery-events/${first.id}`, { isPublished: true });
    assert.equal(response.json().code, 'EVENT_HAS_NO_PHOTOS');

    response = await admin.request('POST', `/admin/gallery-events/${first.id}/photos`, { imageUrl: img(1) });
    assert.equal(response.statusCode, 200, response.body);
    response = await admin.request('POST', `/admin/gallery-events/${first.id}/photos`, { imageUrl: img(2) });
    let event = response.json();
    assert.equal(event.photos.length, 2);
    assert.equal(event.cover.imageUrl, img(1), 'the first photo is the cover');
    response = await admin.request('PATCH', `/admin/gallery-events/${first.id}/photos/${event.photos[1].id}`, { isCover: true });
    assert.equal(response.json().cover.imageUrl, img(2));
    assert.equal((await admin.request('PATCH', `/admin/gallery-events/${first.id}`, { isPublished: true })).statusCode, 200);

    // A second event goes to the top; a hidden one never reaches the public feed.
    const second = (await admin.request('POST', '/admin/gallery-events', { name: 'Model test' })).json();
    await admin.request('POST', `/admin/gallery-events/${second.id}/photos`, { imageUrl: img(3) });
    const hidden = (await admin.request('POST', '/admin/gallery-events', { name: 'Draft' })).json();
    await admin.request('POST', `/admin/gallery-events/${hidden.id}/photos`, { imageUrl: img(4) });
    await admin.request('PATCH', `/admin/gallery-events/${second.id}`, { isPublished: true });
    assert.deepEqual((await admin.request('GET', '/admin/gallery-events')).json().map((e) => e.name), ['Draft', 'Model test', 'Felicitation']);

    response = await student.request('GET', '/gallery/page');
    let page = response.json();
    assert.deepEqual(page.events.map((e) => e.name), ['Model test', 'Felicitation']);
    assert.equal(page.events[1].coverUrl, img(2));
    assert.deepEqual(page.events[1].photos.map((p) => p.imageUrl), [img(1), img(2)]);

    // Reorder, then delete the cover: the next photo takes over. Deleting the last photo hides the event.
    await admin.request('PUT', '/admin/gallery-events/order', { ids: [first.id, second.id, hidden.id] });
    event = (await admin.request('DELETE', `/admin/gallery-events/${first.id}/photos/${page.events[1].photos[1].id}`)).json();
    assert.equal(event.cover.imageUrl, img(1));
    event = (await admin.request('DELETE', `/admin/gallery-events/${first.id}/photos/${event.photos[0].id}`)).json();
    assert.equal(event.isPublished, false);
    page = (await student.request('GET', '/gallery/page')).json();
    assert.deepEqual(page.events.map((e) => e.name), ['Model test']);

    assert.equal((await admin.request('DELETE', `/admin/gallery-events/${second.id}`)).statusCode, 200);
    assert.equal((await admin.request('PUT', '/admin/gallery-hero', { imageUrl: null })).json().hero, null);
  } finally { await context.close(); }
});

test('the migration copies existing gallery sections into events and leaves the Success Collage alone', async () => {
  const { openDatabase, migrate } = await import('../src/db.js');
  const { readdir, mkdtemp, copyFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join, resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const source = resolve(dirname(fileURLToPath(import.meta.url)), '../migrations');
  // Apply every migration before 023, add old-style gallery rows, then apply the rest.
  const before = await mkdtemp(join(tmpdir(), 'cpr-migrations-'));
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  try {
    for (const name of await readdir(source)) if (name < '023') await copyFile(join(source, name), join(before, name));
    await migrate(database, before);
    await database.query(`INSERT INTO gallery_photos(section,caption,image_url,position,is_published) VALUES
      ('Convocation','',$1,1,true), ('Convocation','',$2,0,true), ('Convocation','',$3,2,false),
      ('Success Collage','',$4,0,true), ('Campus','',$5,0,true)`, [img(1), img(2), img(3), img(4), img(5)]);
    await migrate(database, source);
    const events = (await database.query('SELECT * FROM gallery_events ORDER BY position')).rows;
    // Same creation time here, so the order falls back to the section name.
    assert.deepEqual(events.map((e) => [e.name, e.is_published]), [['Campus', true], ['Convocation', true]]);
    const convocation = events.find((e) => e.name === 'Convocation');
    const photos = (await database.query('SELECT image_url,is_cover FROM gallery_event_photos WHERE event_id=$1 ORDER BY position', [convocation.id])).rows;
    assert.deepEqual(photos.map((p) => [p.image_url, p.is_cover]), [[img(2), true], [img(1), false]], 'published photos only, in their old order');
    assert.equal((await database.query('SELECT count(*)::int AS n FROM gallery_photos')).rows[0].n, 5, 'old rows are kept');
  } finally {
    await database.close();
    await rm(before, { recursive: true, force: true });
  }
});
