import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

test('gallery: admin CRUD, public feed groups by section, and photos hide when unpublished', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();

    assert.equal((await student.request('POST', '/admin/gallery', { section: 'Campus', imageUrl: 'https://media.example.test/a.jpg' })).statusCode, 403);
    assert.equal((await student.request('GET', '/admin/gallery')).statusCode, 403);

    let response = await admin.request('POST', '/admin/gallery', { section: 'Campus', caption: 'Main building', imageUrl: '/api/media/aaaaaaaa-1111-1111-1111-111111111111.jpg', position: 1 });
    assert.equal(response.statusCode, 200, response.body);
    const photo1 = response.json();
    assert.equal(photo1.section, 'Campus');
    assert.equal(photo1.isPublished, true);

    response = await admin.request('POST', '/admin/gallery', { section: 'Campus', imageUrl: 'https://media.example.test/b.jpg', position: 0 });
    assert.equal(response.statusCode, 200, response.body);
    const photo2 = response.json();

    response = await admin.request('POST', '/admin/gallery', { section: 'Convocation', imageUrl: 'https://media.example.test/c.jpg' });
    assert.equal(response.statusCode, 200, response.body);
    const photo3 = response.json();

    // Public feed: no auth required, grouped by section, ordered by position within a section.
    response = await student.request('GET', '/gallery');
    assert.equal(response.statusCode, 200, response.body);
    let groups = response.json();
    assert.deepEqual(groups.map((g) => g.section), ['Campus', 'Convocation']);
    assert.deepEqual(groups[0].photos.map((p) => p.id), [photo2.id, photo1.id]);

    // An invalid image value (neither https:// nor a root-relative path) is rejected.
    assert.equal((await admin.request('POST', '/admin/gallery', { section: 'Campus', imageUrl: 'ftp://example.test/x.jpg' })).statusCode, 400);

    // Unpublishing removes a photo from the public feed but keeps it in the admin list.
    response = await admin.request('PATCH', `/admin/gallery/${photo3.id}`, { isPublished: false });
    assert.equal(response.statusCode, 200, response.body);
    groups = (await student.request('GET', '/gallery')).json();
    assert.deepEqual(groups.map((g) => g.section), ['Campus']);
    const adminList = (await admin.request('GET', '/admin/gallery')).json();
    assert.equal(adminList.length, 3);

    // Deleting a photo removes it entirely.
    assert.equal((await admin.request('DELETE', `/admin/gallery/${photo1.id}`)).statusCode, 200);
    assert.equal((await admin.request('DELETE', `/admin/gallery/${photo1.id}`)).statusCode, 404);
    assert.equal((await admin.request('GET', '/admin/gallery')).json().length, 2);
  } finally { await context.close(); }
});
