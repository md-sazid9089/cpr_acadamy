import { deliverSms } from './sms.js';
import { deliverEmail } from './email.js';
import { timingSafeEqual } from 'node:crypto';
import { finalizeExpiredAttempts } from './modules/exams.js';

export async function runMaintenance(database, config, testSink, emailTestSink) {
  await database.query('INSERT INTO worker_heartbeat(id,beat_at) VALUES (1,now()) ON CONFLICT(id) DO UPDATE SET beat_at=now()');
  await finalizeExpiredAttempts(database);
  await database.query("UPDATE enrollments SET status='expired' WHERE status='active' AND expires_at<=now()");
  await database.query('DELETE FROM rate_buckets WHERE resets_at<now()');
  await database.query("DELETE FROM sessions WHERE refresh_expires_at<now()-interval '7 days'");
  await database.query("DELETE FROM otp_challenges WHERE expires_at<now()-interval '1 day'");
  // Delivered or abandoned messages carry no payload any more and are only history.
  await database.query("DELETE FROM sms_outbox WHERE status<>'pending' AND created_at<now()-interval '7 days'");
  await database.query("DELETE FROM email_outbox WHERE status<>'pending' AND created_at<now()-interval '7 days'");
  await deliverSms(database, config, testSink);
  await deliverEmail(database, config, emailTestSink);
}

export function startWorker(database, config, logger, { persistent = false } = {}) {
  let current = null;
  const tick = () => {
    if (current) return;
    current = runMaintenance(database, config).catch(error => logger.error({ code: error.code, errorType: error.name }, 'Maintenance failed')).finally(() => { current = null; });
  };
  const timer = setInterval(tick, 10000);
  if (!persistent) timer.unref();
  tick();
  return async () => { clearInterval(timer); await current; };
}
/**
 * WORKER_MODE=serverless, after a response has been sent. Messages a write may have queued (an OTP,
 * a password-reset email) go out straight away; the rest of the maintenance runs at most once a
 * minute across every instance, claimed atomically through the heartbeat row.
 */
export async function maintainAfterRequest(database, config, method, testSink, emailTestSink) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    await deliverSms(database, config, testSink);
    await deliverEmail(database, config, emailTestSink);
  }
  const claimed = await database.query("UPDATE worker_heartbeat SET beat_at=now() WHERE id=1 AND beat_at<now()-interval '60 seconds' RETURNING id");
  if (claimed.rows.length === 0 && (await database.query('SELECT 1 FROM worker_heartbeat WHERE id=1')).rows.length > 0) return false;
  await runMaintenance(database, config, testSink, emailTestSink);
  return true;
}

/** Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"; with no secret configured nothing gets in. */
export function isCronAuthorized(config, header) {
  if (!config.cronSecret || typeof header !== 'string') return false;
  const expected = Buffer.from(`Bearer ${config.cronSecret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
