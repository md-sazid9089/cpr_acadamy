import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';

const isBrowser = typeof window !== 'undefined';

function systemPrefersDark() {
  return isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Resolve 'system' into the concrete mode currently in effect. */
export function resolveTheme(theme) {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function applyTheme(theme) {
  if (!isBrowser) return;
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark');
}

/**
 * Theme store. Persisted under STORAGE_KEYS.THEME, which the inline script in
 * index.html reads before first paint to avoid a flash of the wrong theme.
 */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      /** @type {'light' | 'dark' | 'system'} */
      theme: 'light',

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next = resolveTheme(get().theme) === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

/**
 * Keep the document in sync when the OS theme changes while 'system' is chosen.
 * Called once from providers.jsx; returns an unsubscribe function.
 */
export function watchSystemTheme() {
  if (!isBrowser) return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (useThemeStore.getState().theme === 'system') applyTheme('system');
  };
  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
}
