import { ACCOUNT_STATUS, ROLES } from '@/constants';
import { sleep } from '@/lib/utils';
// import apiClient from '@/lib/api-client';

/**
 * Auth data access, mocked for now.
 *
 * TODO: replace each body with the real endpoint —
 *   POST /auth/login, /auth/register, /auth/otp/verify, /auth/otp/resend,
 *   POST /auth/password/forgot, /auth/password/reset, POST /auth/logout,
 *   GET  /auth/me
 * The backend is expected to enforce single-device login: a successful login
 * invalidates any token issued to a different X-Device-Id.
 */

/** Two demo accounts so protected routes can be exercised before the API lands. */
const MOCK_USERS = {
  '01711111111': {
    id: 'u-1',
    fullName: 'Dr. Rahim Uddin',
    mobile: '01711111111',
    role: ROLES.STUDENT,
    status: ACCOUNT_STATUS.ACTIVE,
    institution: 'Dhaka Medical College',
    bmdcNumber: 'A-12345',
    createdAt: '2025-06-01T10:00:00.000Z',
  },
  '01799999999': {
    id: 'u-2',
    fullName: 'Academy Admin',
    mobile: '01799999999',
    role: ROLES.ADMIN,
    status: ACCOUNT_STATUS.ACTIVE,
    createdAt: '2025-01-01T10:00:00.000Z',
  },
  // Registered, OTP verified, still waiting for an administrator.
  '01722222222': {
    id: 'u-3',
    fullName: 'Dr. Pending Account',
    mobile: '01722222222',
    role: ROLES.STUDENT,
    status: ACCOUNT_STATUS.AWAITING_APPROVAL,
    createdAt: '2025-09-10T10:00:00.000Z',
  },
};

/** @param {{ mobile: string, password: string }} credentials */
export async function login({ mobile }) {
  await sleep(600);

  const user = MOCK_USERS[mobile];
  if (!user) {
    throw {
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'No account matches that mobile number and password.',
      fieldErrors: {},
    };
  }

  return {
    user,
    accessToken: `mock-token-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
  };
}

/** @param {Object} payload Registration form values. */
export async function register(payload) {
  await sleep(700);
  // The API sends an OTP by SMS and returns nothing sensitive.
  return { ok: true, mobile: payload.mobile, otpSentAt: new Date().toISOString() };
}

/** @param {{ mobile: string, otp: string }} args */
export async function verifyOtp({ mobile, otp }) {
  await sleep(600);

  if (otp === '000000') {
    throw { status: 400, code: 'INVALID_OTP', message: 'That code is incorrect or has expired.' };
  }

  // Verification never grants access on its own — an admin still has to approve.
  return {
    ok: true,
    user: {
      id: `u-${mobile.slice(-4)}`,
      fullName: 'New Student',
      mobile,
      role: ROLES.STUDENT,
      status: ACCOUNT_STATUS.AWAITING_APPROVAL,
      createdAt: new Date().toISOString(),
    },
  };
}

/** @param {string} mobile */
export async function resendOtp(mobile) {
  await sleep(400);
  return { ok: true, mobile, otpSentAt: new Date().toISOString() };
}

/** Poll target for the pending-approval screen. */
export async function fetchApprovalStatus(mobile) {
  await sleep(500);
  // TODO: GET /auth/approval-status?mobile=… — returns the current ACCOUNT_STATUS.
  return { status: ACCOUNT_STATUS.AWAITING_APPROVAL, mobile };
}

export async function forgotPassword(mobile) {
  await sleep(500);
  return { ok: true, mobile };
}

export async function resetPassword({ mobile, otp, password }) {
  await sleep(600);
  return { ok: true, mobile, otp: Boolean(otp), passwordChanged: Boolean(password) };
}

export async function logout() {
  await sleep(200);
  // TODO: POST /auth/logout so the backend releases the device lock.
  return { ok: true };
}
