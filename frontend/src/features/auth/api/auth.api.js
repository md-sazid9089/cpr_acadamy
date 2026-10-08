import apiClient from '@/lib/api-client';

/**
 * Auth data access.
 *
 * The backend enforces single-device login: a successful login invalidates any
 * token issued to a different X-Device-Id (sent by the api-client).
 */

/**
 * Admins must also send the pass from the staff access page (`gatePass`).
 *
 * @param {{ mobile: string, password: string, rememberMe?: boolean, gatePass?: string }} credentials
 */
export async function login({ mobile, password, rememberMe, gatePass }) {
  const { data } = await apiClient.post(
    '/auth/login',
    { mobile, password, rememberMe: Boolean(rememberMe) },
    gatePass ? { headers: { 'X-Admin-Gate': gatePass } } : undefined,
  );
  return data;
}

/** Staff access page: trades the access key for a pass that lets this device sign in as an admin. */
export async function openAdminGate(key) {
  const { data } = await apiClient.post('/auth/admin-gate', { key });
  return data;
}

/** @param {Object} payload Registration form values. Sends an OTP by SMS. */
export async function register(payload) {
  const { data } = await apiClient.post('/auth/register', {
    fullName: payload.fullName,
    mobile: payload.mobile,
    email: payload.email || '',
    bmdcNumber: payload.bmdcNumber || '',
    institution: payload.institution,
    interest: payload.interest,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    acceptTerms: true,
  });
  return data;
}

/**
 * Verifies the signup code. The account becomes `awaiting_approval` and the
 * response carries a session so the pending screen can poll its status.
 *
 * @param {{ mobile: string, otp: string }} args
 */
export async function verifyOtp({ mobile, otp }) {
  const { data } = await apiClient.post('/auth/otp/verify', { mobile, otp });
  return data;
}

/** @param {string} mobile */
export async function resendOtp(mobile) {
  const { data } = await apiClient.post('/auth/otp/resend', { mobile });
  return data;
}

/** Poll target for the pending-approval screen (requires the pending session). */
export async function fetchApprovalStatus() {
  const { data } = await apiClient.get('/auth/approval-status');
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get('/auth/me');
  return data;
}

/** `identity` is `{ mobile }` or `{ email }`; the code is sent by SMS or email to match. */
export async function forgotPassword(identity) {
  const { data } = await apiClient.post('/auth/password/forgot', identity);
  return data;
}

export async function resetPassword({ mobile, email, otp, password, confirmPassword }) {
  const { data } = await apiClient.post('/auth/password/reset', { mobile, email, otp, password, confirmPassword });
  return data;
}

/** Releases the device lock server-side; local state is cleared by the caller. */
export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // The session may already be gone; signing out locally is what matters.
  }
  return { ok: true };
}
