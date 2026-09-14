import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaArrowDown, FaCheckDouble, FaChevronDown, FaMagnifyingGlass, FaThumbtack, FaBell, FaRotateRight } from 'react-icons/fa6';
import { useNotices } from './api/dashboard.queries.js';
import { EMPTY_READ_NOTICES, useNoticeReadStore } from './notice-read-store.js';
import { NOTICE_PAGE_SIZE, isNoticeUnread, relativeNoticeTime, selectNotices } from './notices.js';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { useAuthStore } from '@/lib/auth';
import './Notices.css';

export default function Notices() {
  const { data: notices = [], isLoading, isError, refetch, isFetching } = useNotices();
  const userId = useAuthStore((state) => state.user?.id);
  const readNotices = useNoticeReadStore((state) => state.accounts[userId] ?? EMPTY_READ_NOTICES);
  const markRead = useNoticeReadStore((state) => state.markRead);
  const markUnread = useNoticeReadStore((state) => state.markUnread);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(NOTICE_PAGE_SIZE);
  const [expandedId, setExpandedId] = useState(null);
  const filtered = selectNotices(notices, { search, category, unreadOnly, readNotices });
  const visible = filtered.slice(0, visibleCount);
  const unreadCount = notices.filter((notice) => isNoticeUnread(notice, readNotices)).length;
  const categories = [...new Set(notices.map((notice) => notice.category || 'General'))].sort();
  const hasFilters = Boolean(search || category || unreadOnly);

  function resetFilters() {
    setSearch('');
    setCategory('');
    setUnreadOnly(false);
    setVisibleCount(NOTICE_PAGE_SIZE);
  }

  function openNotice(notice) {
    if (expandedId === notice.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(notice.id);
    markRead(userId, [notice]);
    if (unreadOnly) setUnreadOnly(false);
  }

  return (
    <div className="notice-page">
      <nav aria-label="Breadcrumb" className="notice-breadcrumb">
        <Link to="/dashboard">Dashboard</Link><span aria-hidden="true">/</span><span aria-current="page">Notices</span>
      </nav>
      <div className="notice-heading">
        <div className="notice-title">
          <Link to="/dashboard" className="notice-icon-button" aria-label="Back to dashboard" title="Back to dashboard"><FaArrowLeft aria-hidden="true" /></Link>
          <div>
            <h1>Notices</h1>
            {!isLoading && !isError && <p role="status">{notices.length} {notices.length === 1 ? 'notice' : 'notices'} · {unreadCount} unread</p>}
          </div>
        </div>
        <button type="button" className="notice-action" disabled={!unreadCount || isLoading || isError} onClick={() => markRead(userId, notices)}>
          <FaCheckDouble aria-hidden="true" />Mark all as read
        </button>
      </div>
      <section aria-label="Notice list" className="notice-list">
        <div className="notice-toolbar">
          <label className="notice-search">
            <FaMagnifyingGlass aria-hidden="true" />
            <input type="search" aria-label="Search notices" placeholder="Search notices" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(NOTICE_PAGE_SIZE); }} />
          </label>
          <select aria-label="Notice category" value={category} onChange={(event) => { setCategory(event.target.value); setVisibleCount(NOTICE_PAGE_SIZE); }}>
            <option value="">All categories</option>
            {categories.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <label className="notice-unread-filter"><input type="checkbox" checked={unreadOnly} onChange={(event) => { setUnreadOnly(event.target.checked); setVisibleCount(NOTICE_PAGE_SIZE); }} />Unread only</label>
        </div>
        {isLoading ? <ContentSkeleton label="Loading notices" /> : isError ? (
          <div className="notice-empty" role="alert">
            <FaBell aria-hidden="true" /><h2>Notices could not be loaded</h2><p>Please try again.</p>
            <button type="button" className="notice-action" disabled={isFetching} onClick={() => refetch()}><FaRotateRight aria-hidden="true" />Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="notice-empty">
            <FaBell aria-hidden="true" />
            <h2>{notices.length === 0 ? 'No notices yet' : unreadOnly && !search && !category ? "You're all caught up" : 'No matching notices'}</h2>
            <p>{notices.length === 0 ? 'No announcements have been published.' : unreadOnly && !search && !category ? 'There are no unread announcements.' : 'No announcements match these filters.'}</p>
            {hasFilters && <button type="button" className="notice-action" onClick={resetFilters}>Clear filters</button>}
          </div>
        ) : (
          <>
            <ul className="notice-rows">
              {visible.map((notice) => {
                const unread = isNoticeUnread(notice, readNotices);
                const expanded = expandedId === notice.id;
                const date = new Date(notice.publishedAt);
                const validDate = Number.isFinite(date.getTime());
                return (
                  <li key={notice.id} className={`notice-row ${unread ? 'notice-row--unread' : ''}`}>
                    <h2>
                      <button type="button" className="notice-row-toggle" aria-expanded={expanded} aria-controls={`notice-body-${notice.id}`} onClick={() => openNotice(notice)}>
                        <span className={`notice-dot ${unread ? 'notice-dot--unread' : ''}`} aria-hidden="true" />
                        <span className="notice-row-content">
                          <span className="notice-row-title">{unread && <span className="sr-only">Unread: </span>}{notice.pinned && <FaThumbtack aria-label="Pinned" />}{notice.title}</span>
                          {!expanded && <span className="notice-preview">{notice.body}</span>}
                          <span className="notice-meta"><span>{notice.category || 'General'}</span><time dateTime={validDate ? date.toISOString() : undefined} title={validDate ? date.toLocaleString() : undefined}>{relativeNoticeTime(notice.publishedAt)}</time></span>
                        </span>
                        <FaChevronDown aria-hidden="true" className={expanded ? 'notice-chevron--open' : ''} />
                      </button>
                    </h2>
                    <div id={`notice-body-${notice.id}`} hidden={!expanded} className="notice-body">
                      <p>{notice.body}</p>
                      <button type="button" className="notice-action" onClick={() => { markUnread(userId, notice.id); setExpandedId(null); }}>Mark as unread</button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="notice-list-footer">
              <p role="status">{visible.length < filtered.length ? `Showing ${visible.length} of ${filtered.length}` : hasFilters ? `${filtered.length} matching ${filtered.length === 1 ? 'notice' : 'notices'}` : 'All announcements shown.'}</p>
              {visible.length < filtered.length && <button type="button" className="notice-action" onClick={() => setVisibleCount((count) => count + NOTICE_PAGE_SIZE)}><FaArrowDown aria-hidden="true" />Load more</button>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
