import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { noticeVersion } from './notices.js';

export const EMPTY_READ_NOTICES = Object.freeze({});

export const useNoticeReadStore = create(persist((set) => ({
  accounts: {},
  markRead: (userId, notices) => {
    if (!userId) return;
    set((state) => ({
      accounts: {
        ...state.accounts,
        [userId]: {
          ...state.accounts[userId],
          ...Object.fromEntries(notices.map((notice) => [notice.id, noticeVersion(notice)])),
        },
      },
    }));
  },
  markUnread: (userId, noticeId) => {
    if (!userId) return;
    set((state) => {
      const readNotices = { ...state.accounts[userId] };
      delete readNotices[noticeId];
      return { accounts: { ...state.accounts, [userId]: readNotices } };
    });
  },
}), { name: 'cpr-notice-read-v1', partialize: (state) => ({ accounts: state.accounts }) }));