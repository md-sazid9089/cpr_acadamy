import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

/** A self-contained, HMAC-signed, time-limited token — for URLs that must carry their own auth (e.g. a <video src>) since they can't send an Authorization header. */
export function signContentToken(payload, secret, ttlSeconds) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 })).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export function verifyContentToken(token, secret) {
  const [body, signature] = String(token).split('.');
  if (!body || !signature) return null;
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  const [algorithm, salt, hash] = (encoded ?? '').split(':');
  if (algorithm !== 'scrypt' || !salt || !/^[a-f0-9]{128}$/.test(hash ?? '')) return false;
  const derived = await scrypt(password, salt, 64);
  return timingSafeEqual(derived, Buffer.from(hash, 'hex'));
}

export function newToken() {
  return randomBytes(32).toString('base64url');
}

export function digestToken(token, secret) {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function publicUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    mobile: row.mobile,
    email: row.email ?? '',
    role: row.role,
    status: row.status,
    institution: row.institution,
    bmdcNumber: row.bmdc_number,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
  };
}