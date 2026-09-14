export const NOTICE_PAGE_SIZE = 10;

export function noticeVersion(notice) {
  return JSON.stringify([notice.publishedAt, notice.title, notice.body, notice.category]);
}

export function isNoticeUnread(notice, readNotices = {}) {
  return readNotices[notice.id] !== noticeVersion(notice);
}

export function selectNotices(notices, { search = '', category = '', unreadOnly = false, readNotices = {} } = {}) {
  const query = search.trim().toLocaleLowerCase();
  return notices.filter((notice) => (
    (!category || (notice.category || 'General') === category)
    && (!unreadOnly || isNoticeUnread(notice, readNotices))
    && (!query || `${notice.title} ${notice.body} ${notice.category || 'General'}`.toLocaleLowerCase().includes(query))
  )).sort((first, second) => Number(Boolean(second.pinned)) - Number(Boolean(first.pinned))
    || (Date.parse(second.publishedAt) || 0) - (Date.parse(first.publishedAt) || 0));
}

export function relativeNoticeTime(value, now = Date.now()) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'Date unavailable';
  const seconds = Math.round((timestamp - now) / 1000);
  if (Math.abs(seconds) < 60) return 'Just now';
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(seconds) < 3600) return formatter.format(Math.trunc(seconds / 60), 'minute');
  if (Math.abs(seconds) < 86400) return formatter.format(Math.trunc(seconds / 3600), 'hour');
  if (Math.abs(seconds) < 604800) return formatter.format(Math.trunc(seconds / 86400), 'day');
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(timestamp);
}