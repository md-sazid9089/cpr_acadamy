import { ensure } from './http.js';
import { one } from './db.js';
import { encryptMessage, decryptMessage } from './sms.js';

export function requireEmail(config) {
  ensure(config.emailMode !== 'disabled', 503, 'EMAIL_UNAVAILABLE', 'Email delivery is not configured. Please use your mobile number instead.');
}

export async function enqueueEmail(transaction, config, user, { subject, text, html }, expiresSeconds = 600) {
  await transaction.query(`INSERT INTO email_outbox(user_id,payload,expires_at) VALUES ($1,$2,now()+$3*interval '1 second')`,
    [user.id, encryptMessage({ to: user.email, subject, text, html }, config.tokenSecret), expiresSeconds]);
}

async function sendWithResend(config, payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.resendApiKey}`, 'Idempotency-Key': payload.idempotencyKey },
    body: JSON.stringify({ from: config.emailFrom, to: [payload.to], subject: payload.subject, text: payload.text, html: payload.html }),
    signal: AbortSignal.timeout(8000),
    redirect: 'error',
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(`Resend rejected delivery (${response.status}): ${detail.message ?? 'no detail'}`);
  }
}

export async function deliverEmail(database, config, testSink) {
  if (config.emailMode === 'disabled') return;
  for (let count = 0; count < 10; count += 1) {
    const found = await database.transaction(async transaction => {
      const message = await one(transaction, `SELECT * FROM email_outbox WHERE status='pending' AND next_attempt_at<=now() ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED`);
      if (!message) return false;
      if (new Date(message.expires_at).getTime() <= Date.now()) {
        await transaction.query("UPDATE email_outbox SET status='failed',payload='' WHERE id=$1", [message.id]);
        return true;
      }
      try {
        const payload = { ...decryptMessage(message.payload, config.tokenSecret), idempotencyKey: message.id };
        if (config.emailMode === 'test') {
          if (!testSink) throw new Error('Missing test email sink');
          await testSink(payload);
        } else if (config.emailMode === 'console') {
          console.info(`[Email → ${payload.to}] ${payload.subject}\n${payload.text}`);
        } else {
          await sendWithResend(config, payload);
        }
        await transaction.query("UPDATE email_outbox SET status='sent',payload='' WHERE id=$1", [message.id]);
      } catch (error) {
        if (config.emailMode !== 'test') console.error('Email delivery failed:', error.message);
        await transaction.query(`UPDATE email_outbox SET attempts=attempts+1,
          status=CASE WHEN attempts>=4 THEN 'failed' ELSE 'pending' END,
          payload=CASE WHEN attempts>=4 THEN '' ELSE payload END,
          next_attempt_at=now()+interval '30 seconds' WHERE id=$1`, [message.id]);
      }
      return true;
    });
    if (!found) break;
  }
}
