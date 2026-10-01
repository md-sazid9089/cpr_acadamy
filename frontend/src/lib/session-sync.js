/**
 * Every tab of the browser shares one persisted session, but each keeps its own in-memory copy.
 * When one tab refreshes the tokens, the server revokes the old ones, so a second tab still holding
 * them would be told the session is dead and sign everyone out. These helpers let a tab notice that
 * another tab already holds a newer session and adopt it instead.
 */

/** The session another tab saved, but only when its access token differs from `knownToken`. */
export function newerStoredSession(raw, knownToken) {
  try {
    const state = JSON.parse(raw ?? 'null')?.state;
    if (state?.accessToken && state.user && state.accessToken !== knownToken) {
      return { user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken ?? null };
    }
  } catch {
    // A corrupt entry is treated as "no other session".
  }
  return null;
}

/**
 * Polls `read` (which returns the raw stored value) for a session newer than `knownToken`, because the
 * tab that refreshed may still be waiting for its response when this one fails.
 */
export async function waitForNewerSession(read, knownToken, { attempts = 4, delayMs = 400, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const session = newerStoredSession(read(), knownToken);
    if (session) return session;
    if (attempt < attempts - 1) await sleep(delayMs);
  }
  return null;
}
