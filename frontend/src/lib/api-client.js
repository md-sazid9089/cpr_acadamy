import axios from 'axios';
import { FORCED_LOGOUT_REASONS } from '@/constants';
import { getAccessToken, getDeviceId, handleForcedLogout } from '@/lib/auth';

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401 || status === 419) {
      handleForcedLogout(SESSION_ENDING_CODES[code] ?? FORCED_LOGOUT_REASONS.TOKEN_EXPIRED);
    }

    // TODO: add a refresh-token retry here once the backend exposes /auth/refresh.
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
