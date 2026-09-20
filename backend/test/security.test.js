import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, newToken, digestToken, publicUser, signContentToken, verifyContentToken } from '../src/security.js';

test('password hashes are salted and reject incorrect passwords', async () => {
  const password = 'correct horse battery staple';
  const first = await hashPassword(password);
  assert.notEqual(first, await hashPassword(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('incorrect', first), false);
  assert.equal(await verifyPassword(password, 'invalid'), false);
});

test('bearer tokens are unpredictable and digests depend on the server secret', () => {
  const token = newToken();
  assert.notEqual(token, newToken());
  assert.equal(Buffer.from(token, 'base64url').length, 32);
  assert.notEqual(digestToken(token, 'first'), digestToken(token, 'second'));
  assert.equal(digestToken(token, 'first'), digestToken(token, 'first'));
});

test('public users never expose authentication fields', () => {
  const user = publicUser({ id: 'user', password_hash: 'secret', role: 'student' });
  assert.equal(user.id, 'user');
  assert.equal('password_hash' in user, false);
});

test('content tokens are self-verifying, tamper-evident, and expire', () => {
  const token = signContentToken({ lessonId: 'lesson-1', kind: 'video' }, 'secret', 60);
  const payload = verifyContentToken(token, 'secret');
  assert.equal(payload.lessonId, 'lesson-1');
  assert.equal(payload.kind, 'video');

  assert.equal(verifyContentToken(token, 'wrong-secret'), null);
  const [body, signature] = token.split('.');
  assert.equal(verifyContentToken(`${body}.${signature.slice(0, -1)}x`, 'secret'), null);
  assert.equal(verifyContentToken(`${body}x.${signature}`, 'secret'), null);
  assert.equal(verifyContentToken('not-a-token', 'secret'), null);

  const expired = signContentToken({ lessonId: 'lesson-1', kind: 'video' }, 'secret', -1);
  assert.equal(verifyContentToken(expired, 'secret'), null);
});