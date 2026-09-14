import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

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