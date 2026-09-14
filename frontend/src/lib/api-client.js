import axios from 'axios';
import { FORCED_LOGOUT_REASONS } from '@/constants';
import { getAccessToken, getDeviceId, handleForcedLogout, useAuthStore } from '@/lib/auth';

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

    // An expired access token is transparently exchanged once; anything else
    // that ends the session logs the user out. A 401 on the login form itself
    // (INVALID_CREDENTIALS) is an ordinary error and must not trigger either.
    if (status === 401 && code === 'TOKEN_EXPIRED' && !config._retried) {
      try {
        const token = await refreshSession();
        config._retried = true;
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
        return apiClient.request(config);
      } catch {
        handleForcedLogout(FORCED_LOGOUT_REASONS.TOKEN_EXPIRED);
      }
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
  return {
    status: error.response?.status ?? 0,
    code: data?.code ?? 'NETWORK_ERROR',
    message:
      data?.message ??
      error.message ??
      'Something went wrong. Please check your connection and try again.',
    /** @type {Record<string, string>} field -> message, for RHF setError. */
    fieldErrors: data?.errors ?? {},
  };
}

export default apiClient;
