import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// login-errors.js imports '@/constants'; point that at the real file so it runs under plain Node.
const constantsUrl = new URL('../src/constants/index.js', import.meta.url).href;
const source = readFileSync(new URL('../src/features/auth/login-errors.js', import.meta.url), 'utf8').replace("from '@/constants'", `from '${constantsUrl}'`);
const { loginErrorMessage } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('wrong credentials and unknown accounts share one message', () => {
  assert.equal(loginErrorMessage({ code: 'INVALID_CREDENTIALS' }), 'Mobile number or password is incorrect.');
  assert.equal(loginErrorMessage({ code: 'SOME_OTHER_CODE' }), 'Something went wrong. Please try again later.');
  assert.equal(loginErrorMessage(null), 'Something went wrong. Please try again later.');
});

test('rate limiting and inactive accounts get actionable messages', () => {
  assert.equal(loginErrorMessage({ code: 'RATE_LIMITED' }), 'Too many attempts. Please try again later.');
  assert.equal(loginErrorMessage({ code: 'ACCOUNT_NOT_ACTIVE' }), 'Your account is not active. Please contact support.');
});

test('the account status behind a refusal picks the specific explanation', () => {
  assert.equal(loginErrorMessage({ code: 'ACCOUNT_NOT_ACTIVE', reason: 'suspended' }), 'Your account has been suspended. Contact support.');
  assert.equal(loginErrorMessage({ code: 'ACCOUNT_NOT_ACTIVE', reason: 'rejected' }), 'Your registration was not approved. Contact support.');
  assert.equal(loginErrorMessage({ code: 'OTP_REQUIRED', reason: 'otp_pending' }), 'Please verify your mobile number before signing in.');
  assert.equal(loginErrorMessage({ code: 'ACCOUNT_NOT_ACTIVE', reason: 'awaiting_approval' }), 'Your account is under review. Please wait for admin approval.');
  // An unknown status falls back to the code's generic message.
  assert.equal(loginErrorMessage({ code: 'ACCOUNT_NOT_ACTIVE', reason: 'mystery' }), 'Your account is not active. Please contact support.');
});

test('network failures surface the interceptor message before the generic fallback', () => {
  assert.equal(loginErrorMessage({ userMessage: 'Server is not responding. Please try again.' }), 'Server is not responding. Please try again.');
  assert.equal(loginErrorMessage({ userMessage: 'Please check your internet connection.' }), 'Please check your internet connection.');
});
