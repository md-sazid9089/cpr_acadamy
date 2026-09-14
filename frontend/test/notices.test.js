import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { NOTICE_PAGE_SIZE, isNoticeUnread, noticeVersion, relativeNoticeTime, selectNotices } from '../src/features/student-dashboard/notices.js';

const notices = [
  { id: 'old', title: 'Welcome', body: 'Academy news', category: 'General', publishedAt: '2026-09-01T10:00:00Z', pinned: true },
  { id: 'new', title: 'Exam schedule', body: 'Medicine on Monday', category: 'Exam', publishedAt: '2026-09-14T10:00:00Z' },
  { id: 'class', title: 'Class update', body: 'New timetable', category: 'Class', publishedAt: '2026-09-13T10:00:00Z' },
];

test('notices sort pinned first and newest first without mutating the feed', () => {
  assert.deepEqual(selectNotices([...notices].reverse()).map((notice) => notice.id), ['old', 'new', 'class']);
  assert.equal(notices[0].id, 'old');
});

test('notice search, category and unread filters compose before pagination', () => {
  assert.deepEqual(selectNotices(notices, { search: ' MEDICINE ', category: 'Exam' }).map((notice) => notice.id), ['new']);
  assert.equal(selectNotices(notices, { search: 'missing' }).length, 0);
  assert.equal(selectNotices(notices, { category: 'Payment' }).length, 0);
  const readNotices = { new: noticeVersion(notices[1]) };
  assert.equal(selectNotices(notices, { unreadOnly: true, readNotices }).length, 2);
  const many = Array.from({ length: 25 }, (_, index) => ({ ...notices[1], id: String(index) }));
  assert.equal(selectNotices(many).slice(0, NOTICE_PAGE_SIZE).length, 10);
  assert.equal(selectNotices(many).slice(20, 30).length, 5);
});

test('read notices stay read until their content changes', () => {
  const notice = notices[0];
  const readNotices = { [notice.id]: noticeVersion(notice) };
  assert.equal(isNoticeUnread(notice), true);
  assert.equal(isNoticeUnread(notice, readNotices), false);
  assert.equal(isNoticeUnread({ ...notice, body: 'Updated news' }, readNotices), true);
  assert.equal(isNoticeUnread(notice, {}), true);
});

test('recent notice dates are relative and invalid dates are safe', () => {
  const now = Date.parse('2026-09-15T10:00:00Z');
  assert.equal(relativeNoticeTime('2026-09-15T09:59:45Z', now), 'Just now');
  assert.equal(relativeNoticeTime('2026-09-15T08:00:00Z', now), '2 hours ago');
  assert.equal(relativeNoticeTime('2026-09-13T10:00:00Z', now), '2 days ago');
  assert.match(relativeNoticeTime(notices[0].publishedAt, now), /2026/);
  assert.equal(relativeNoticeTime('invalid', now), 'Date unavailable');
});

test('notice read state is persisted and isolated by account', async () => {
  const saved = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
      removeItem: (key) => saved.delete(key),
    },
  };
  try {
    const { useNoticeReadStore } = await import('../src/features/student-dashboard/notice-read-store.js');
    useNoticeReadStore.getState().markRead('student-a', notices);
    assert.equal(isNoticeUnread(notices[0], useNoticeReadStore.getState().accounts['student-a']), false);
    assert.equal(isNoticeUnread(notices[0], useNoticeReadStore.getState().accounts['student-b']), true);
    const persisted = saved.get('cpr-notice-read-v1');
    useNoticeReadStore.setState({ accounts: {} });
    saved.set('cpr-notice-read-v1', persisted);
    await useNoticeReadStore.persist.rehydrate();
    assert.equal(isNoticeUnread(notices[0], useNoticeReadStore.getState().accounts['student-a']), false);
    useNoticeReadStore.getState().markUnread('student-a', notices[0].id);
    assert.equal(isNoticeUnread(notices[0], useNoticeReadStore.getState().accounts['student-a']), true);
    assert.equal(isNoticeUnread(notices[1], useNoticeReadStore.getState().accounts['student-a']), false);
  } finally {
    delete globalThis.window;
  }
});

test('notice feed requests all server pages and forwards cancellation', async () => {
  const source = readFileSync(new URL('../src/features/student-dashboard/api/dashboard.api.js', import.meta.url), 'utf8');
  const mock = `
    export const requests = [];
    const feed = Array.from({length: 55}, (_, index) => ({id: String(index)}));
    const apiClient = {get: async (path, options) => {
      requests.push({path, ...options});
      return {data: feed.slice(options.params.offset, options.params.offset + options.params.limit)};
    }};
  `;
  const module = await import(`data:text/javascript;base64,${Buffer.from(source.replace("import apiClient from '@/lib/api-client';", mock)).toString('base64')}`);
  const controller = new AbortController();
  assert.equal((await module.fetchNotices({ signal: controller.signal })).length, 55);
  assert.deepEqual(module.requests.map((request) => request.params.offset), [0, 50]);
  assert.ok(module.requests.every((request) => request.signal === controller.signal));
});

test('notice page keeps one heading and list surface with no duplicate dashboard menu', () => {
  const source = readFileSync(new URL('../src/features/student-dashboard/Notices.jsx', import.meta.url), 'utf8');
  assert.equal((source.match(/<h1>/g) ?? []).length, 1);
  assert.doesNotMatch(source, /DashboardPanel|DashboardPageHeader|Notice Board/);
  assert.match(source, /aria-expanded=\{expanded\}/);
  assert.match(source, /Search notices/);
  assert.match(source, /Load more/);
  const layout = readFileSync(new URL('../src/components/layout/DashboardLayout.jsx', import.meta.url), 'utf8');
  assert.match(layout, /!isCoursesPage && !isNoticesPage/);
});