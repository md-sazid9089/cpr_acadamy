// Applies the stored theme before first paint so dark mode never flashes white.
// Kept as an external file (not an inline <script>) so the CSP script-src can
// stay free of 'unsafe-inline'.
(function () {
  try {
    var stored = JSON.parse(localStorage.getItem('cpr-theme') || 'null');
    var mode = stored && stored.state && stored.state.theme;
    if (!mode || mode === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.toggle('dark', mode === 'dark');
  } catch (e) {
    /* no-op */
  }
})();
