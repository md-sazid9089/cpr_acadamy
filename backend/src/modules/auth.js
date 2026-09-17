import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { one } from '../db.js';
import { hashPassword, verifyPassword, newToken, digestToken, publicUser } from '../security.js';
import { ensure, mobile, password, text, throttle, audit } from '../http.js';
import { enqueueSms, requireSms } from '../sms.js';

const otpInput = z.object({ mobile, otp: z.string().regex(/^\d{6}$/) });
const registration = z.object({
  mobile, password, fullName: text.min(2).max(100), institution: text.max(120),
  bmdcNumber: z.string().trim().max(30).optional(), email: z.union([z.string().email().max(254), z.literal('')]).optional(),
  interest: z.enum(['FCPS', 'BCS', 'MBBS']), acceptTerms: z.literal(true),
  confirmPassword: z.string().optional(),
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

  async function issueOtp(transaction, user, purpose) {
    const previous = await one(transaction, 'SELECT * FROM otp_challenges WHERE user_id=$1 AND purpose=$2 FOR UPDATE', [user.id, purpose]);
    ensure(!previous || Date.now() - new Date(previous.sent_at).getTime() >= 60000, 429, 'OTP_COOLDOWN', 'Wait one minute before requesting another code.');
    const code = String(randomInt(1000000)).padStart(6, '0');
    await transaction.query(`INSERT INTO otp_challenges(user_id,purpose,code_hash,expires_at) VALUES ($1,$2,$3,now()+interval '10 minutes')
      ON CONFLICT(user_id,purpose) DO UPDATE SET code_hash=EXCLUDED.code_hash,attempts=0,expires_at=EXCLUDED.expires_at,sent_at=now(),consumed_at=NULL`,
    [user.id, purpose, digestToken(`${user.id}:${purpose}:${code}`, secret)]);
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
    requireSms(config);
    await throttle(database, config, 'register', request.ip, 5);
    const data = request.body;
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

  for (const [path, purpose] of [['/auth/otp/resend', 'registration'], ['/auth/password/forgot', 'reset']]) {
    route('POST', path, { body: z.object({ mobile }).strict(), rateLimit: { max: 10, timeWindow: '15 minutes' } }, async request => {
      requireSms(config);
      await throttle(database, config, purpose, request.body.mobile, 5);
      await database.transaction(async transaction => {
        const user = await one(transaction, 'SELECT * FROM users WHERE mobile=$1 FOR UPDATE', [request.body.mobile]);
        if (user && (purpose === 'registration' ? user.status === 'otp_pending' : Boolean(user.mobile_verified_at))) {
          await issueOtp(transaction, user, purpose);
        }
      });
      return { ok: true, mobile: request.body.mobile, otpSentAt: new Date().toISOString() };
    });
  }

  route('POST', '/auth/password/reset', { body: otpInput.extend({ password, confirmPassword: z.string().optional() }).strict().refine(data => data.confirmPassword === undefined || data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' }) }, async request => {
    await throttle(database, config, 'reset-verify', request.body.mobile, 10);
    const hash = await hashPassword(request.body.password);
    const success = await database.transaction(async transaction => {
      const user = await one(transaction, 'SELECT * FROM users WHERE mobile=$1 FOR UPDATE', [request.body.mobile]);
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