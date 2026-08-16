import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ACCOUNT_STATUS,
  FORCED_LOGOUT_EVENT,
  FORCED_LOGOUT_REASONS,
  ROLES,
  STORAGE_KEYS,
} from '@/constants';

const isBrowser = typeof window !== 'undefined';

/**
 * A stable per-browser id sent as `X-Device-Id`. The backend pins one active
 * session per user to one device id; a login from a different device
 * invalidates the previous token.
 */
export function getDeviceId() {
  if (!isBrowser) return 'server';
  let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!id) {
    id = crypto.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }
  return id;
}

const initialState = {
  /** @type {import('@/types').User | null} */
  user: null,
  /** @type {string | null} */
  accessToken: null,
  /** @type {string | null} */
  refreshToken: null,
  /** Mobile number awaiting OTP entry, carried between Register and VerifyOtp. */
  pendingMobile: null,
  /** Set when the backend ended this session from elsewhere. */
  forcedLogoutReason: null,
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      isAuthenticated: () => Boolean(get().accessToken && get().user),

      /** Only fully approved accounts may reach protected routes. */
      isApproved: () => get().user?.status === ACCOUNT_STATUS.ACTIVE,

      hasRole: (role) => !role || get().user?.role === role,

      isAdmin: () => get().user?.role === ROLES.ADMIN,

      /** Where a user should land after a successful, approved login. */
      homePath: () => (get().user?.role === ROLES.ADMIN ? '/admin' : '/dashboard'),

      setPendingMobile: (mobile) => set({ pendingMobile: mobile }),

      /** @param {{ user: import('@/types').User, accessToken: string, refreshToken?: string }} session */
      setSession: ({ user, accessToken, refreshToken = null }) =>
        set({ user, accessToken, refreshToken, forcedLogoutReason: null, pendingMobile: null }),

      setUser: (user) => set({ user }),

      clearForcedLogout: () => set({ forcedLogoutReason: null }),

      logout: () => set({ ...initialState }),

      /**
       * Called when the backend rejects our token because the account signed in
       * elsewhere (or was suspended). Keeps a reason around so the login screen
       * can explain why the user was kicked out.
       */
      forceLogout: (reason = FORCED_LOGOUT_REASONS.ANOTHER_DEVICE) =>
        set({ ...initialState, forcedLogoutReason: reason }),
    }),
    {
      name: STORAGE_KEYS.AUTH,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        pendingMobile: state.pendingMobile,
      }),
    },
  ),
);

/** Read the token outside React (used by the axios request interceptor). */
export function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

/**
 * Bridge from the axios interceptor (non-React) to the store. Dispatches a DOM
 * event too, so any component can react to a session being revoked.
 */
export function handleForcedLogout(reason = FORCED_LOGOUT_REASONS.ANOTHER_DEVICE) {
  useAuthStore.getState().forceLogout(reason);
  if (isBrowser) {
    window.dispatchEvent(new CustomEvent(FORCED_LOGOUT_EVENT, { detail: { reason } }));
  }
}

/**
 * Cross-tab sync: if another tab logs out or logs in as someone else, mirror it
 * here. Registered once from providers.jsx.
 */
export function watchAuthAcrossTabs() {
  if (!isBrowser) return () => {};
  const handler = (event) => {
    if (event.key !== STORAGE_KEYS.AUTH) return;
    const nextToken = (() => {
      try {
        return JSON.parse(event.newValue || 'null')?.state?.accessToken ?? null;
      } catch {
        return null;
      }
    })();
    if (!nextToken && useAuthStore.getState().accessToken) {
      useAuthStore.getState().logout();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
