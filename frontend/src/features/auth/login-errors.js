import { ACCOUNT_STATUS } from '@/constants';

/** Backend codes that carry a plain, actionable message instead of the server's own text. */
const LOGIN_MESSAGES = {
  INVALID_CREDENTIALS: 'Mobile number or password is incorrect.',
  ACCOUNT_NOT_ACTIVE: 'Your account is not active. Please contact support.',
  OTP_REQUIRED: 'Please verify your mobile number first.',
  RATE_LIMITED: 'Too many attempts. Please try again later.',
};

/** The account status behind a refused sign-in, each with its own explanation. */
const BLOCKED_STATUS_MESSAGES = {
  [ACCOUNT_STATUS.AWAITING_APPROVAL]: 'Your account is under review. Please wait for admin approval.',
  [ACCOUNT_STATUS.OTP_PENDING]: 'Please verify your mobile number before signing in.',
  [ACCOUNT_STATUS.SUSPENDED]: 'Your account has been suspended. Contact support.',
  [ACCOUNT_STATUS.REJECTED]: 'Your registration was not approved. Contact support.',
};

/**
 * What to show under the form when sign-in fails. Never the raw axios/server text
 * ("Request failed with status code 500", "timeout of 20000ms exceeded").
 */
export function loginErrorMessage(error) {
  const blockedByStatus = BLOCKED_STATUS_MESSAGES[error?.reason];
  if (blockedByStatus) return blockedByStatus;
  const serverMessage = LOGIN_MESSAGES[error?.code];
  if (serverMessage) return serverMessage;
  if (error?.userMessage) return error.userMessage;
  return 'Something went wrong. Please try again later.';
}
