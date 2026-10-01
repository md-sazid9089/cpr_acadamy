import assert from 'node:assert/strict';
import test from 'node:test';
import { newerStoredSession, waitForNewerSession } from '../src/lib/session-sync.js';

const stored = (accessToken, extra = {}) => JSON.stringify({ state: { user: { id: 'student-one' }, accessToken, refreshToken: `${accessToken}-refresh`, ...extra }, version: 0 });

test('a session another tab saved is adopted when its token differs from the one that failed', () => {
  assert.deepEqual(newerStoredSession(stored('second-token'), 'first-token'), { user: { id: 'student-one' }, accessToken: 'second-token', refreshToken: 'second-token-refresh' });
});

test('the same token, a cleared session or a corrupt entry mean no other session exists', () => {
  assert.equal(newerStoredSession(stored('first-token'), 'first-token'), null, 'nothing newer: a genuine sign-in elsewhere must still log out');
  assert.equal(newerStoredSession(JSON.stringify({ state: { user: null, accessToken: null } }), 'first-token'), null, 'another tab signed out');
  assert.equal(newerStoredSession('{broken', 'first-token'), null);
  assert.equal(newerStoredSession(null, 'first-token'), null);
});

test('a tab that loses a simultaneous refresh waits for the winner to store its session', async () => {
  const reads = [stored('first-token'), stored('first-token'), stored('winner-token')];
  const slept = [];
  const session = await waitForNewerSession(() => reads.shift(), 'first-token', { sleep: async (ms) => { slept.push(ms); } });
  assert.equal(session.accessToken, 'winner-token');
  assert.equal(slept.length, 2);
});

test('waiting gives up when nobody else refreshed', async () => {
  let calls = 0;
  const session = await waitForNewerSession(() => { calls += 1; return stored('first-token'); }, 'first-token', { attempts: 3, sleep: async () => {} });
  assert.equal(session, null);
  assert.equal(calls, 3);
});
