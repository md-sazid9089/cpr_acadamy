import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { ensure } from './http.js';
import { one } from './db.js';

function key(secret) {
  return createHash('sha256').update(`sms:${secret}`).digest();
}

export function encryptMessage(payload, secret) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret), nonce);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString('base64');
}

export function decryptMessage(payload, secret) {
  const bytes = Buffer.from(payload, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key(secret), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
}

export function requireSms(config) {
  ensure(config.smsMode !== 'disabled', 503, 'SMS_UNAVAILABLE', 'SMS delivery is not configured. Please contact the academy.');
}

export async function enqueueSms(transaction, config, user, message, expiresSeconds = 600) {
  await transaction.query(`INSERT INTO sms_outbox(user_id,payload,expires_at) VALUES ($1,$2,now()+$3*interval '1 second')`, [user.id, encryptMessage({ mobile: user.mobile, message }, config.tokenSecret), expiresSeconds]);
}

export async function deliverSms(database, config, testSink) {
  if (config.smsMode === 'disabled') return;
  for (let count = 0; count < 10; count += 1) {
    const found = await database.transaction(async transaction => {
      const message = await one(transaction, `SELECT * FROM sms_outbox WHERE status='pending' AND next_attempt_at<=now() ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED`);
      if (!message) return false;
      if (new Date(message.expires_at).getTime() <= Date.now()) {
        await transaction.query("UPDATE sms_outbox SET status='failed',payload='' WHERE id=$1", [message.id]);
        return true;
      }
      try {
        const payload = { ...decryptMessage(message.payload, config.tokenSecret), idempotencyKey: message.id };
        if (config.smsMode === 'test') {
          if (!testSink) throw new Error('Missing test SMS sink');
          await testSink(payload);
        } else if (config.smsMode === 'console') {
          console.info(`[SMS → ${payload.mobile}] ${payload.message}`);
        } else {
          const response = await fetch(config.smsWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.smsWebhookToken}` },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000),
            redirect: 'error',
          });
          if (!response.ok) throw new Error('SMS provider rejected delivery');
        }
        await transaction.query("UPDATE sms_outbox SET status='sent',payload='' WHERE id=$1", [message.id]);
      } catch {
        await transaction.query(`UPDATE sms_outbox SET attempts=attempts+1,
          status=CASE WHEN attempts>=4 THEN 'failed' ELSE 'pending' END,
          payload=CASE WHEN attempts>=4 THEN '' ELSE payload END,
          next_attempt_at=now()+interval '30 seconds' WHERE id=$1`, [message.id]);
      }
      return true;
    });
    if (!found) break;
  }
}