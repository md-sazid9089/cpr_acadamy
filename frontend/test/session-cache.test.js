import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { createStore } from 'zustand/vanilla';
import { watchSessionCache } from '../src/lib/session-cache.js';

function fixture(context) {
  const store = createStore(() => ({
    accessToken: 'first-token',
    user: { id: 'student-one', role: 'student', status: 'active' },
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const unsubscribe = watchSessionCache(client, store);
  context.after(() => { unsubscribe(); client.clear(); });
  client.setQueryData(['dashboard', 'payments'], ['private-payment']);
  return { client, store };
}

test('logout removes private cached data', (context) => {
  const { client, store } = fixture(context);
  store.setState({ user: null, accessToken: null });
  assert.equal(client.getQueryData(['dashboard', 'payments']), undefined);
});

test('switching accounts clears queries and mutations', (context) => {
  const { client, store } = fixture(context);
  client.getMutationCache().build(client, { mutationKey: ['private-change'] });
  store.setState({ user: { id: 'student-two', role: 'student', status: 'active' }, accessToken: 'second-token' });
  assert.equal(client.getQueryCache().getAll().length, 0);
  assert.equal(client.getMutationCache().getAll().length, 0);
});

test('token refresh preserves the same account cache', (context) => {
  const { client, store } = fixture(context);
  store.setState({ accessToken: 'refreshed-token' });
  assert.deepEqual(client.getQueryData(['dashboard', 'payments']), ['private-payment']);
});

test('permission changes invalidate the cache', (context) => {
  const { client, store } = fixture(context);
  store.setState({ user: { ...store.getState().user, status: 'suspended' } });
  assert.equal(client.getQueryData(['dashboard', 'payments']), undefined);
});

test('a late response cannot restore data after logout', async (context) => {
  const { client, store } = fixture(context);
  let finishRequest;
  const request = client.fetchQuery({
    queryKey: ['dashboard', 'profile'],
    queryFn: () => new Promise(resolve => { finishRequest = resolve; }),
  }).catch(() => undefined);
  store.setState({ user: null, accessToken: null });
  finishRequest({ name: 'Previous student' });
  await request;
  assert.equal(client.getQueryData(['dashboard', 'profile']), undefined);
});