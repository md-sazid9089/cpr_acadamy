import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { one } from '../db.js';
import { hashPassword, verifyPassword, newToken, digestToken, publicUser } from '../security.js';
import { ensure, mobile, password, text, throttle, audit } from '../http.js';
import { enqueueSms, requireSms } from '../sms.js';
import { enqueueEmail, requireEmail } from '../email.js';

const otp = z.string().regex(/^\d{6}$/);
const otpInput = z.object({ mobile, otp });
const emailAddress = z.string().trim().toLowerCase().email().max(254);
const resetIdentity = { mobile: mobile.optional(), email: emailAddress.optional() };
const oneIdentity = [data => (data.mobile === undefined) !== (data.email === undefined), { path: ['mobile'], message: 'Enter either a mobile number or an email address' }];

function resetEmail(code) {
  const text = `Your CPR Academy password reset code is ${code}. It expires in 10 minutes.\n\nIf you did not ask to reset your password, you can ignore this email.`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1c1917;line-height:1.5">
  <p>Your CPR Academy password reset code is:</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#1B3F7D;margin:16px 0">${code}</p>
  <p>It expires in 10 minutes.</p>
  <p style="color:#78716C;font-size:13px">If you did not ask to reset your password, you can ignore this email.</p>
</div>`;
  return { subject: 'Your CPR Academy password reset code', text, html };
}
const registration = z.object({
  mobile, password, fullName: text.min(2).max(100), institution: text.max(120),
  bmdcNumber: z.string().trim().max(30).optional(), email: z.union([z.string().email().max(254), z.literal('')]).optional(),
  interest: z.enum(['FCPS', 'BCS', 'MBBS', 'OTHER']), acceptTerms: z.literal(true),
  confirmPassword: z.string().max(128).optional(),
}).strict().refine(data => data.confirmPassword === undefined || data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export function authRoutes(route, database, config) {
  const secret = config.tokenSecret;
  const dummyHashPromise = hashPassword(newToken());
  const device = request => z.string().min(8).max(200).parse(request.headers['x-device-id']);

  async function issueSession(transaction, user, deviceId) {
    const accessToken = newToken();
    const refreshToken = newToken();
    const refreshSeconds = user.role === 'admin' ? config.adminRefreshSeconds : config.refreshSeconds;
    await transaction.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [user.id]);
    const session = await one(transaction, `INSERT INTO sessions(user_id,device_id,access_hash,refresh_hash,expires_at,refresh_expires_at)
      VALUES ($1,$2,$3,$4,now()+$5*interval '1 second',now()+$6*interval '1 second') RETURNING expires_at`,
    [user.id, deviceId, digestToken(accessToken, secret), digestToken(refreshToken, secret), config.accessSeconds, refreshSeconds]);
    return { user: publicUser(user), accessToken, refreshToken, deviceId, expiresAt: new Date(session.expires_at).getTime() };
  }

  async function findResetUser(transaction, { mobile: phone, email }) {
    if (phone) return one(transaction, 'SELECT * FROM users WHERE mobile=$1 FOR UPDATE', [phone]);
    // Email is not unique, so an address shared by several accounts identifies none of them.
    const { rows } = await transaction.query('SELECT * FROM users WHERE lower(email)=$1 FOR UPDATE', [email]);
    return rows.length === 1 ? rows[0] : null;
  }

  async function issueOtp(transaction, user, purpose, channel = 'sms') {
    const previous = await one(transaction, 'SELECT * FROM otp_challenges WHERE user_id=$1 AND purpose=$2 FOR UPDATE', [user.id, purpose]);
    ensure(!previous || Date.now() - new Date(previous.sent_at).getTime() >= 60000, 429, 'OTP_COOLDOWN', 'Wait one minute before requesting another code.');
    const code = String(randomInt(1000000)).padStart(6, '0');
    await transaction.query(`INSERT INTO otp_challenges(user_id,purpose,code_hash,expires_at) VALUES ($1,$2,$3,now()+interval '10 minutes')
      ON CONFLICT(user_id,purpose) DO UPDATE SET code_hash=EXCLUDED.code_hash,attempts=0,expires_at=EXCLUDED.expires_at,sent_at=now(),consumed_at=NULL`,
    [user.id, purpose, digestToken(`${user.id}:${purpose}:${code}`, secret)]);
    if (channel === 'email') return enqueueEmail(transaction, config, user, resetEmail(code));
    await enqueueSms(transaction, config, user, `Your CPR Academy ${purpose === 'reset' ? 'password reset' : 'verification'} code is ${code}. It expires in 10 minutes.`);
  }

  async function consumeOtp(transaction, user, purpose, code) {
    const challenge = await one(transaction, 'SELECT * FROM otp_challenges WHERE user_id=$1 AND purpose=$2 FOR UPDATE', [user.id, purpose]);
    if (!challenge || challenge.consumed_at || challenge.attempts >= 5 || new Date(challenge.expires_at).getTime() <= Date.now()) return false;
    if (challenge.code_hash !== digestToken(`${user.id}:${purpose}:${code}`, secret)) {
      await transaction.query('UPDATE otp_challenges SET attempts=attempts+1 WHERE user_id=$1 AND purpose=$2', [user.id, purpose]);
      return false;
    }
    await transaction.query('UPDATE otp_challenges SET consumed_at=now() WHERE user_id=$1 AND purpose=$2', [user.id, purpose]);
    return true;
  }

  route('POST', '/auth/register', { body: registration, rateLimit: { max: 5, timeWindow: '15 minutes' } }, async request => {
    const data = request.body;

    // Temporary: OTP verification is disabled, so new accounts skip straight to
    // 'awaiting_approval' (as if the mobile were already verified) and are logged
    // in immediately. Set SKIP_PHONE_VERIFICATION=false to restore the OTP step.
    if (config.skipPhoneVerification) {
      await throttle(database, config, 'register', request.ip, 5);
      const deviceId = device(request);
      const hash = await hashPassword(data.password);
      const session = await database.transaction(async transaction => {
        const user = await one(transaction, `INSERT INTO users(mobile,full_name,password_hash,institution,bmdc_number,email,interest,status,mobile_verified_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,'awaiting_approval',now()) ON CONFLICT(mobile) DO NOTHING RETURNING *`,
        [data.mobile, data.fullName, hash, data.institution, data.bmdcNumber || '', data.email || null, data.interest]);
        return user ? issueSession(transaction, user, deviceId) : null;
      });
      // No user created (duplicate mobile): stay non-committal rather than leak that it exists.
      return session ? { ok: true, ...session } : { ok: true, mobile: data.mobile };
    }

    requireSms(config);
    await throttle(database, config, 'register', request.ip, 5);
    const hash = await hashPassword(data.password);
    await database.transaction(async transaction => {
      const user = await one(transaction, `INSERT INTO users(mobile,full_name,password_hash,institution,bmdc_number,email,interest)
        VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(mobile) DO NOTHING RETURNING *`,
      [data.mobile, data.fullName, hash, data.institution, data.bmdcNumber || '', data.email || null, data.interest]);
      if (user) await issueOtp(transaction, user, 'registration');
    });
    return { ok: true, mobile: data.mobile, otpSentAt: new Date().toISOString() };
  });

  route('POST', '/auth/login', { body: z.object({ mobile, password: z.string().min(1).max(128), rememberMe: z.boolean().optional() }).strict(), rateLimit: { max: 30, timeWindow: '15 minutes' } }, async request => {
    const deviceId = device(request);
    await throttle(database, config, 'login', request.body.mobile);
    const user = await one(database, 'SELECT * FROM users WHERE mobile=$1', [request.body.mobile]);
    const valid = await verifyPassword(request.body.password, user?.password_hash || await dummyHashPromise);
    ensure(valid && user, 401, 'INVALID_CREDENTIALS', 'No account matches that mobile number and password.');
    return database.transaction(async transaction => {
      const current = await one(transaction, 'SELECT * FROM users WHERE id=$1 FOR UPDATE', [user.id]);
      ensure(current.password_hash === user.password_hash, 401, 'INVALID_CREDENTIALS', 'Please sign in again.');
      ensure(!['suspended', 'rejected'].includes(current.status), 403, 'ACCOUNT_NOT_ACTIVE', 'This account cannot sign in.');
      ensure(current.status !== 'otp_pending', 403, 'OTP_REQUIRED', 'Verify your mobile number before signing in.');
      const stamped = await one(transaction, 'UPDATE users SET last_login_at=now() WHERE id=$1 RETURNING *', [current.id]);
      const session = await issueSession(transaction, stamped, deviceId);
      await audit(transaction, user.id, 'auth.login', user.id);
      return session;
    });
  });

  route('POST', '/auth/otp/verify', { body: otpInput, rateLimit: { max: 20, timeWindow: '15 minutes' } }, async request => {
    const deviceId = device(request);
    await throttle(database, config, 'verify', request.body.mobile, 20);
    const result = await database.transaction(async transaction => {
      const user = await one(transaction, 'SELECT * FROM users WHERE mobile=$1 FOR UPDATE', [request.body.mobile]);
      if (!user || user.status !== 'otp_pending' || !await consumeOtp(transaction, user, 'registration', request.body.otp)) return null;
      const updated = await one(transaction, "UPDATE users SET status='awaiting_approval',mobile_verified_at=now() WHERE id=$1 RETURNING *", [user.id]);
      return issueSession(transaction, updated, deviceId);
    });
    ensure(result, 400, 'INVALID_OTP', 'That code is incorrect or has expired.');
    return { ok: true, ...result };
  });

  route('POST', '/auth/otp/resend', { body: z.object({ mobile }).strict(), rateLimit: { max: 10, timeWindow: '15 minutes' } }, async request => {
    requireSms(config);
    await throttle(database, config, 'registration', request.body.mobile, 5);
    await database.transaction(async transaction => {
      const user = await one(transaction, 'SELECT * FROM users WHERE mobile=$1 FOR UPDATE', [request.body.mobile]);
      if (user?.status === 'otp_pending') await issueOtp(transaction, user, 'registration');
    });
    return { ok: true, mobile: request.body.mobile, otpSentAt: new Date().toISOString() };
  });

  route('POST', '/auth/password/forgot', { body: z.object(resetIdentity).strict().refine(...oneIdentity), rateLimit: { max: 10, timeWindow: '15 minutes' } }, async request => {
    const { mobile: phone, email } = request.body;
    if (email) requireEmail(config);
    else requireSms(config);
    await throttle(database, config, 'reset', phone ?? `email:${email}`, 5);
    await database.transaction(async transaction => {
      const user = await findResetUser(transaction, request.body);
      if (user?.mobile_verified_at) await issueOtp(transaction, user, 'reset', email ? 'email' : 'sms');
    });
    // Same answer whether or not an account matched, so the form cannot be used to discover accounts.
    return { ok: true, ...(email ? { email } : { mobile: phone }), otpSentAt: new Date().toISOString() };
  });

  route('POST', '/auth/password/reset', { body: z.object({ ...resetIdentity, otp, password, confirmPassword: z.string().max(128).optional() }).strict().refine(...oneIdentity).refine(data => data.confirmPassword === undefined || data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' }) }, async request => {
    await throttle(database, config, 'reset-verify', request.body.mobile ?? `email:${request.body.email}`, 10);
    const hash = await hashPassword(request.body.password);
    const success = await database.transaction(async transaction => {
      const user = await findResetUser(transaction, request.body);
      if (!user || !await consumeOtp(transaction, user, 'reset', request.body.otp)) return false;
      await transaction.query('UPDATE users SET password_hash=$2 WHERE id=$1', [user.id, hash]);
      await transaction.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [user.id]);
      await audit(transaction, user.id, 'auth.password_reset', user.id);
      return true;
    });
    ensure(success, 400, 'INVALID_OTP', 'That code is incorrect or has expired.');
    return { ok: true, passwordChanged: true };
  });

  route('POST', '/auth/refresh', { body: z.object({ refreshToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict(), rateLimit: { max: 30, timeWindow: '1 minute' } }, async request => {
    const deviceId = device(request);
    return database.transaction(async transaction => {
      const candidate = await one(transaction, 'SELECT user_id FROM sessions WHERE refresh_hash=$1', [digestToken(request.body.refreshToken, secret)]);
      ensure(candidate, 401, 'SESSION_REVOKED', 'Please sign in again.');
      const user = await one(transaction, 'SELECT * FROM users WHERE id=$1 FOR UPDATE', [candidate.user_id]);
      const session = await one(transaction, 'SELECT * FROM sessions WHERE refresh_hash=$1 FOR UPDATE', [digestToken(request.body.refreshToken, secret)]);
      ensure(session && !session.revoked_at && new Date(session.refresh_expires_at).getTime() > Date.now(), 401, 'SESSION_REVOKED', 'Please sign in again.');
      ensure(session.device_id === deviceId, 401, 'DEVICE_MISMATCH', 'Please sign in on this device.');
      ensure(['active', 'awaiting_approval'].includes(user.status), 401, 'ACCOUNT_SUSPENDED', 'This account cannot sign in.');
      return issueSession(transaction, user, deviceId);
    });
  });

  route('POST', '/auth/logout', { auth: 'pending' }, async request => {
    await database.query('UPDATE sessions SET revoked_at=now() WHERE id=$1', [request.auth.id]);
    return { ok: true };
  });
  route('GET', '/auth/me', { auth: 'pending' }, async request => publicUser(await one(database, 'SELECT * FROM users WHERE id=$1', [request.auth.user_id])));
  route('GET', '/auth/approval-status', { auth: 'pending' }, async request => {
    const user = await one(database, 'SELECT status,mobile FROM users WHERE id=$1', [request.auth.user_id]);
    return user;
  });
}