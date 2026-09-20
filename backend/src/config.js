import { randomBytes } from 'node:crypto';

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const databaseMode = env.DATABASE_MODE || (production ? 'postgres' : 'pglite');
  const port = Number(env.PORT || 3001);
  const smsMode = env.SMS_MODE || 'disabled';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  if (!['postgres', 'pglite'].includes(databaseMode)) throw new Error('Invalid DATABASE_MODE');
  if (production && databaseMode !== 'postgres') throw new Error('Production requires PostgreSQL');
  if (databaseMode === 'postgres' && !env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (production && (env.TOKEN_SECRET?.length ?? 0) < 32) throw new Error('TOKEN_SECRET must contain at least 32 characters');
  if (production && !env.CORS_ORIGINS) throw new Error('CORS_ORIGINS is required');
  // Without a trusted proxy every client shares one rate-limit bucket, so production must opt in or out explicitly.
  if (production && !['true', 'false'].includes(env.TRUST_PROXY)) throw new Error('TRUST_PROXY must be set to true (behind a proxy that sets X-Forwarded-For) or false');
  if (!['disabled', 'webhook', 'test', 'console'].includes(smsMode)) throw new Error('Invalid SMS_MODE');
  if (smsMode === 'test' && env.NODE_ENV !== 'test') throw new Error('Test SMS is only allowed in tests');
  if (smsMode === 'console' && production) throw new Error('Console SMS is only allowed outside production');
  if (smsMode === 'webhook' && (!env.SMS_WEBHOOK_URL?.startsWith('https://') || !env.SMS_WEBHOOK_TOKEN)) {
    throw new Error('SMS webhook requires HTTPS and an authentication token');
  }
  return {
    production,
    host: env.HOST || '127.0.0.1',
    port,
    databaseMode,
    databaseUrl: env.DATABASE_URL,
    pglitePath: env.PGLITE_PATH || '.local/database',
    tokenSecret: env.TOKEN_SECRET || randomBytes(32).toString('hex'),
    ephemeralSecret: !env.TOKEN_SECRET,
    corsOrigins: (env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:4194').split(',').map(value => value.trim()),
    trustProxy: env.TRUST_PROXY === 'true',
    smsMode,
    smsWebhookUrl: env.SMS_WEBHOOK_URL,
    smsWebhookToken: env.SMS_WEBHOOK_TOKEN,
    // Temporary switch to let new signups skip OTP entry and go straight to the
    // approval queue, logged in. Flip back to 'false' to re-require SMS verification.
    skipPhoneVerification: env.SKIP_PHONE_VERIFICATION === 'true',
    accessSeconds: 3600,
    refreshSeconds: 30 * 86400,
    // Admin sessions carry more blast radius (payments, scores, approvals), so they expire sooner and must reauthenticate more often.
    adminRefreshSeconds: 7 * 86400,
  };
}