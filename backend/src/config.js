import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const databaseMode = env.DATABASE_MODE || (production ? 'postgres' : 'pglite');
  const port = Number(env.PORT || 3001);
  const smsMode = env.SMS_MODE || 'disabled';
  const emailMode = env.EMAIL_MODE || 'disabled';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  if (!['postgres', 'pglite'].includes(databaseMode)) throw new Error('Invalid DATABASE_MODE');
  if (production && databaseMode !== 'postgres') throw new Error('Production requires PostgreSQL');
  if (databaseMode === 'postgres' && !env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (production && (env.TOKEN_SECRET?.length ?? 0) < 32) throw new Error('TOKEN_SECRET must contain at least 32 characters');
  if (production && !env.CORS_ORIGINS) throw new Error('CORS_ORIGINS is required');
  // Without a trusted proxy every client shares one rate-limit bucket, so production must opt in or out explicitly.
  if (production && !['true', 'false'].includes(env.TRUST_PROXY)) throw new Error('TRUST_PROXY must be set to true (behind a proxy that sets X-Forwarded-For) or false');
  // Who runs the background worker (OTP/email delivery, exam finalisation, cleanup). Production must choose
  // explicitly: nothing delivers SMS or finalises abandoned exams unless one of the two actually runs.
  // On Vercel there is no long-lived process for a timer to run in, so the work runs after requests
  // and from a scheduled cron call instead ('serverless').
  const vercel = Boolean(env.VERCEL);
  const workerMode = env.WORKER_MODE || (vercel ? 'serverless' : production ? '' : 'embedded');
  if (!['embedded', 'external', 'serverless'].includes(workerMode)) {
    throw new Error(production ? 'WORKER_MODE must be set to embedded (the web process runs the worker), external (a separate `npm run worker` service) or serverless (Vercel)' : 'Invalid WORKER_MODE');
  }
  if (vercel && production && workerMode === 'embedded') throw new Error('WORKER_MODE=embedded does not work on Vercel: use serverless');
  if (workerMode === 'serverless' && production && (env.CRON_SECRET?.length ?? 0) < 16) {
    throw new Error('WORKER_MODE=serverless needs CRON_SECRET (at least 16 characters) so only the scheduled job can run maintenance');
  }
  // Each serverless instance opens its own pool, so keep it small and point DATABASE_URL at a pooled endpoint.
  const databasePoolMax = Number(env.DATABASE_POOL_MAX || (vercel ? 3 : 10));
  if (!Number.isInteger(databasePoolMax) || databasePoolMax < 1 || databasePoolMax > 50) throw new Error('DATABASE_POOL_MAX must be a whole number from 1 to 50');
  // Skipping the OTP step means nobody proves they own the number they sign up with: anyone can register
  // someone else's number, and a repeat registration reveals that a number is already taken.
  // Production only allows it when the operator acknowledges that explicitly.
  if (production && env.SKIP_PHONE_VERIFICATION === 'true' && env.ACKNOWLEDGE_UNVERIFIED_MOBILES !== 'true') {
    throw new Error('SKIP_PHONE_VERIFICATION=true leaves mobile numbers unverified. Set it to false, or set ACKNOWLEDGE_UNVERIFIED_MOBILES=true to run production that way on purpose');
  }
  const trustedProxyHops = Number(env.TRUST_PROXY_HOPS || 1);
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 1 || trustedProxyHops > 10) throw new Error('TRUST_PROXY_HOPS must be a whole number from 1 to 10');
  if (!['disabled', 'webhook', 'test', 'console'].includes(smsMode)) throw new Error('Invalid SMS_MODE');
  if (smsMode === 'test' && env.NODE_ENV !== 'test') throw new Error('Test SMS is only allowed in tests');
  if (smsMode === 'console' && production) throw new Error('Console SMS is only allowed outside production');
  if (smsMode === 'webhook' && (!env.SMS_WEBHOOK_URL?.startsWith('https://') || !env.SMS_WEBHOOK_TOKEN)) {
    throw new Error('SMS webhook requires HTTPS and an authentication token');
  }
  if (!['disabled', 'resend', 'test', 'console'].includes(emailMode)) throw new Error('Invalid EMAIL_MODE');
  if (emailMode === 'test' && env.NODE_ENV !== 'test') throw new Error('Test email is only allowed in tests');
  if (emailMode === 'console' && production) throw new Error('Console email is only allowed outside production');
  if (emailMode === 'resend' && (!env.RESEND_API_KEY?.startsWith('re_') || !env.EMAIL_FROM)) {
    throw new Error('Resend email requires RESEND_API_KEY and EMAIL_FROM');
  }
  return {
    production,
    host: env.HOST || '127.0.0.1',
    port,
    databaseMode,
    databaseUrl: env.DATABASE_URL,
    databasePoolMax,
    vercel,
    cronSecret: env.CRON_SECRET || null,
    pglitePath: env.PGLITE_PATH || '.local/database',
    tokenSecret: env.TOKEN_SECRET || randomBytes(32).toString('hex'),
    ephemeralSecret: !env.TOKEN_SECRET,
    corsOrigins: (env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:4194').split(',').map(value => value.trim()),
    trustProxy: env.TRUST_PROXY === 'true',
    trustedProxyHops,
    workerMode,
    smsMode,
    smsWebhookUrl: env.SMS_WEBHOOK_URL,
    smsWebhookToken: env.SMS_WEBHOOK_TOKEN,
    emailMode,
    resendApiKey: env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM,
    // Image uploads go to Cloudinary when this is set; otherwise they fall back to
    // local disk (test/dev without a Cloudinary account configured).
    cloudinaryUrl: env.CLOUDINARY_URL || null,
    // Where the local-disk fallback keeps uploads; defaults to ./public/uploads.
    uploadDir: env.UPLOAD_DIR ? resolve(env.UPLOAD_DIR) : null,
    // Temporary switch to let new signups skip OTP entry and go straight to the
    // approval queue, logged in. Flip back to 'false' to re-require SMS verification.
    skipPhoneVerification: env.SKIP_PHONE_VERIFICATION === 'true',
    accessSeconds: 3600,
    refreshSeconds: 30 * 86400,
    // Admin sessions carry more blast radius (payments, scores, approvals), so they expire sooner and must reauthenticate more often.
    adminRefreshSeconds: 7 * 86400,
  };
}