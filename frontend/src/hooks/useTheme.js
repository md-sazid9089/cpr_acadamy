import { useThemeStore, resolveTheme } from '@/lib/theme';

/** Theme value plus the toggle, for the navbar switch. */
export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return {
    theme,
    resolved: resolveTheme(theme),
    isDark: resolveTheme(theme) === 'dark',
    setTheme,
    toggleTheme,
  };
}
