import { deliverSms } from './sms.js';
import { finalizeExpiredAttempts } from './modules/exams.js';

export async function runMaintenance(database, config, testSink) {
  await finalizeExpiredAttempts(database);
  await database.query("UPDATE enrollments SET status='expired' WHERE status='active' AND expires_at<=now()");
  await database.query('DELETE FROM rate_buckets WHERE resets_at<now()');
  await database.query("DELETE FROM sessions WHERE refresh_expires_at<now()-interval '7 days'");
  await database.query("DELETE FROM otp_challenges WHERE expires_at<now()-interval '1 day'");
  await deliverSms(database, config, testSink);
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