import axios from 'axios';
import { FORCED_LOGOUT_REASONS } from '@/constants';
import { adoptStoredSession, getAccessToken, getDeviceId, handleForcedLogout, useAuthStore } from '@/lib/auth';
import { describeApiError } from '@/lib/form-errors';

const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '/api';

/** The single axios instance every feature api module must use. */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Single-device login: the backend compares this against the device that
  // currently owns the session and 401s if they differ.
  config.headers['X-Device-Id'] = getDeviceId();
  return config;
});

/**
 * Backend error codes that mean "this session is no longer valid". Anything in
 * here logs the user out locally instead of surfacing a generic error.
 */
const SESSION_ENDING_CODES = {
  SESSION_REVOKED: FORCED_LOGOUT_REASONS.ANOTHER_DEVICE,
  DEVICE_MISMATCH: FORCED_LOGOUT_REASONS.ANOTHER_DEVICE,
  TOKEN_EXPIRED: FORCED_LOGOUT_REASONS.TOKEN_EXPIRED,
  ACCOUNT_SUSPENDED: FORCED_LOGOUT_REASONS.ACCOUNT_SUSPENDED,
};

// One refresh in flight at a time; concurrent 401s all wait on the same promise.
let refreshing = null;

function refreshSession() {
  refreshing ??= (async () => {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) throw new Error('No refresh token');
    const { data } = await axios.post(
      `${BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json', 'X-Device-Id': getDeviceId() }, timeout: 15000 },
    );
    useAuthStore.getState().setSession(data);
    return data.accessToken;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const config = error.config ?? {};

    // Another tab of this browser may already have refreshed (which revokes the tokens this request used).
    // Adopt its session and retry rather than treating that as being signed in somewhere else.
    const usedToken = String(config.headers?.Authorization ?? '').replace(/^Bearer /, '');
    const rotatedElsewhere = status === 401 && ['TOKEN_EXPIRED', 'SESSION_REVOKED'].includes(code) && !config._retried && usedToken;

    // An expired access token is transparently exchanged once; anything else
    // that ends the session logs the user out. A 401 on the login form itself
    // (INVALID_CREDENTIALS) is an ordinary error and must not trigger either.
    if (rotatedElsewhere && await adoptStoredSession(usedToken, { wait: false })) {
      config._retried = true;
      config.headers = { ...config.headers, Authorization: `Bearer ${getAccessToken()}` };
      return apiClient.request(config);
    } else if (status === 401 && code === 'TOKEN_EXPIRED' && !config._retried) {
      try {
        const token = await refreshSession();
        config._retried = true;
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
        return apiClient.request(config);
      } catch (refreshError) {
        if (isNetworkFailure(refreshError) || refreshError.response?.status >= 500) {
          return Promise.reject(normalizeError(refreshError));
        }
        // Two tabs refreshing at once: the loser is told its refresh token is spent while the winner's
        // response is still in flight. Give the winner a moment to store the new session before giving up.
        const adopted = await adoptStoredSession(usedToken);
        if (adopted) {
          config._retried = true;
          config.headers = { ...config.headers, Authorization: `Bearer ${adopted}` };
          return apiClient.request(config);
        }
        handleForcedLogout(FORCED_LOGOUT_REASONS.TOKEN_EXPIRED);
      }
    } else if (rotatedElsewhere && await adoptStoredSession(usedToken)) {
      config._retried = true;
      config.headers = { ...config.headers, Authorization: `Bearer ${getAccessToken()}` };
      return apiClient.request(config);
    } else if (status === 401 && SESSION_ENDING_CODES[code]) {
      handleForcedLogout(SESSION_ENDING_CODES[code]);
    } else if (status === 401 && code === 'UNAUTHENTICATED' && getAccessToken()) {
      handleForcedLogout(FORCED_LOGOUT_REASONS.TOKEN_EXPIRED);
    }

    return Promise.reject(normalizeError(error));
  },
);

/** Flatten an axios error into a predictable shape for the UI layer. */
export function normalizeError(error) {
  const data = error.response?.data;
  const status = error.response?.status ?? 0;
  const code = data?.code ?? (status ? 'HTTP_ERROR' : 'NETWORK_ERROR');
  const userMessage = transportMessage(error, status);
  const summary = userMessage ?? data?.message ?? 'Something went wrong. Please try again later.';
  /** @type {Record<string, string>} field -> message, for RHF setError. */
  const fieldErrors = data?.errors ?? {};
  return {
    status,
    code,
    userMessage,
    /** Machine-readable detail from the server, e.g. which account status blocked a login. */
    reason: data?.reason,
    // Says which field and why when the server named one, so every screen that shows `message` is specific.
    message: describeApiError(code, summary, fieldErrors),
    summary,
    fieldErrors,
  };
}

function transportMessage(error, status) {
  const unavailable = 'Server is not responding. Please try again.';
  if (isNetworkFailure(error)) {
    return ['ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED'].includes(error.code)
      ? unavailable : 'Please check your internet connection.';
  }
  if (status === 502 || status === 504) return unavailable;
  if (status === 503) {
    const data = error.response?.data;
    if (!data?.code || data.code === 'SERVICE_UNAVAILABLE') return unavailable;
    if (data.message) return; // Keep actionable service errors (e.g. an alternative to SMS).
  }
  if (status >= 500) return 'Something went wrong. Please try again later.';
}

/** True when the request never got an answer from the server (offline, DNS, refused, timed out). */
export function isNetworkFailure(error) {
  return !error.response && Boolean(error.request);
}

export default apiClient;
