/**
 * After a new deploy, a tab opened earlier still asks for the old page files, which no longer exist,
 * so opening a lazily loaded page (Contact, the dashboards...) fails and the router shows "Page not found".
 * Vite reports that failure as a `vite:preloadError` event: reload once to pick up the new version.
 * A short guard stops a reload loop if the file is genuinely missing; then the error shows as before.
 */
const RELOADED_AT = 'cpr-stale-deploy-reload';
const GUARD_MS = 10_000;

export function reloadOnStaleDeploy() {
  window.addEventListener('vite:preloadError', (event) => {
    let last = 0;
    try { last = Number(sessionStorage.getItem(RELOADED_AT)) || 0; } catch { /* storage blocked: still reload once below */ }
    if (Date.now() - last < GUARD_MS) return;
    try { sessionStorage.setItem(RELOADED_AT, String(Date.now())); } catch { /* ignore */ }
    event.preventDefault();
    window.location.reload();
  });
}
