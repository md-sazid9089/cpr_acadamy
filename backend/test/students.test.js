import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';

test('student profile ownership, support thread lifecycle, approval transitions, and reporting', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin', '01799999999');
    const student = await context.user();
    const other = await context.user('student', '01812345678');
    const pending = await context.user('student', '01912345678', 'awaiting_approval');
    assert.equal((await pending.request('GET', '/me/profile')).statusCode, 403);
    assert.equal((await admin.request('PATCH', `/admin/students/${pending.id}/status`, { status: 'active' })).statusCode, 200);
    assert.equal((await pending.request('GET', '/me/profile')).statusCode, 200);
    assert.equal((await student.request('PATCH', '/me/profile', { section: 'basic', values: { role: 'admin' } })).statusCode, 400);
    assert.equal((await student.request('PATCH', '/me/profile', { section: 'contact', values: { mobile: '01612345678' } })).statusCode, 400);
    const profile = await student.request('PATCH', '/me/profile', { section: 'basic', values: { name: 'Updated Student' } });
    assert.equal(profile.statusCode, 200, profile.body);
    assert.equal(profile.json().basic.name, 'Updated Student');
    let response = await student.request('POST', '/me/complaints', { relatedTo: 'Other', body: 'Please check my account.' });
    assert.equal(response.statusCode, 200, response.body);
    const complaint = response.json();
    assert.equal((await other.request('GET', `/me/complaints/${complaint.id}`)).statusCode, 404);
    assert.equal((await other.request('POST', `/me/complaints/${complaint.id}/replies`, { body: 'Forged reply' })).statusCode, 404);
    response = await admin.request('POST', `/admin/complaints/${complaint.id}/replies`, { body: 'We are reviewing your account.' });
    assert.equal(response.json().status, 'answered');
    assert.equal((await admin.request('PATCH', `/admin/complaints/${complaint.id}/status`, { status: 'solved' })).statusCode, 200);
    assert.equal((await student.request('POST', `/me/complaints/${complaint.id}/replies`, { body: 'Another reply' })).statusCode, 409);
    for (const path of ['/me/enrollments', '/me/progress', '/me/devices', '/me/subscriptions/batches']) {
      response = await student.request('GET', path);
      assert.equal(response.statusCode, 200, `${path}: ${response.body}`);
    }
    response = await admin.request('GET', '/admin/stats');
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().totalStudents, 3);
    assert.equal((await admin.request('GET', '/admin/reports')).statusCode, 200);
    assert.equal((await admin.request('PATCH', `/admin/students/${student.id}/status`, { status: 'suspended' })).statusCode, 200);
    assert.equal((await student.request('GET', '/me/profile')).statusCode, 401);
  } finally { await context.close(); }
});