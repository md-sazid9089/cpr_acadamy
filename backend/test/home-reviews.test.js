import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

test('home page reviews: seeded, admin-managed, ordered, hidden ones stay off the public list', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();

    // The migration loads the four reviews the home page used to hard-code.
    let response = await student.request('GET', '/home-reviews');
    assert.equal(response.statusCode, 200, response.body);
    assert.deepEqual(response.json().map((review) => review.name), ['Nazmul Hasan', 'Tasmiah B. Mimi', 'জান্নাতুল ফেরদৌস নদীয়া', 'Syeda Fatema Alam']);
    assert.equal(response.json()[0].rating, 5);

    assert.equal((await student.request('GET', '/admin/home-reviews')).statusCode, 403);
    assert.equal((await student.request('POST', '/admin/home-reviews', { name: 'X', quote: 'Y' })).statusCode, 403);

    // Validation: name and quote are required, rating is 1 to 5.
    assert.equal((await admin.request('POST', '/admin/home-reviews', { name: ' ', quote: 'Great' })).statusCode, 400);
    assert.equal((await admin.request('POST', '/admin/home-reviews', { name: 'Rafi', quote: '' })).statusCode, 400);
    assert.equal((await admin.request('POST', '/admin/home-reviews', { name: 'Rafi', quote: 'Great', rating: 6 })).statusCode, 400);

    response = await admin.request('POST', '/admin/home-reviews', { name: 'Dr. Rafi', role: 'Student, Residency', quote: 'Mock tests helped.', rating: 4 });
    assert.equal(response.statusCode, 200, response.body);
    const added = response.json();
    assert.equal(added.position, 4);

    // Edit, hide one, move the new one first.
    response = await admin.request('PATCH', `/admin/home-reviews/${added.id}`, { quote: 'The mock tests helped a lot.' });
    assert.equal(response.json().quote, 'The mock tests helped a lot.');
    assert.equal(response.json().rating, 4, 'fields not sent stay as they were');
    const all = (await admin.request('GET', '/admin/home-reviews')).json();
    await admin.request('PATCH', `/admin/home-reviews/${all[0].id}`, { isPublished: false });
    const ids = [added.id, ...all.map((review) => review.id).filter((id) => id !== added.id)];
    assert.equal((await admin.request('PUT', '/admin/home-reviews/order', { ids })).statusCode, 200);
    assert.equal((await admin.request('PUT', '/admin/home-reviews/order', { ids: ids.slice(1) })).json().code, 'INVALID_ORDER');

    response = await student.request('GET', '/home-reviews');
    assert.deepEqual(response.json().map((review) => review.name), ['Dr. Rafi', 'Tasmiah B. Mimi', 'জান্নাতুল ফেরদৌস নদীয়া', 'Syeda Fatema Alam']);
    assert.deepEqual(Object.keys(response.json()[0]).sort(), ['id', 'name', 'quote', 'rating', 'role'], 'the public list carries no admin fields');

    // Limit of 12.
    for (let i = 0; i < 7; i += 1) await admin.request('POST', '/admin/home-reviews', { name: `Student ${i}`, quote: 'Good' });
    response = await admin.request('POST', '/admin/home-reviews', { name: 'One too many', quote: 'Good' });
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().code, 'HOME_REVIEW_LIMIT');

    assert.equal((await admin.request('DELETE', `/admin/home-reviews/${added.id}`)).statusCode, 200);
    assert.equal((await admin.request('DELETE', `/admin/home-reviews/${added.id}`)).statusCode, 404);
  } finally { await context.close(); }
});
