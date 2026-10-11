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

const bangladeshMobile = /^01[3-9]\d{8}$/;

/**
 * Sends one SMS through Reve. Reve wants its keys in the query string of a GET, so the whole URL is a secret:
 * it is never logged, and every error thrown from here carries only a status code or an error class,
 * never the URL or anything from the response body.
 */
export async function sendWithReve(config, { mobile, message }) {
  if (!bangladeshMobile.test(mobile)) throw new Error('Reve SMS: not a Bangladesh mobile number');
  const query = Object.entries({
    apikey: config.reveSmsApiKey,
    secretkey: config.reveSmsSecretKey,
    callerID: config.reveSmsCallerId,
    toUser: `88${mobile}`, // Reve takes the number with the country code, 8801XXXXXXXXX
    messageContent: message,
  }).map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('&');
  let response;
  try {
    response = await fetch(`${config.reveSmsBaseUrl}/sendtext?${query}`, { method: 'GET', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) });
  } catch (error) {
    throw new Error(`Reve SMS request failed (${String(error.cause?.code ?? error.name).replace(/[^A-Za-z0-9_]/g, '').slice(0, 40)})`);
  }
  if (!response.ok) throw new Error(`Reve SMS HTTP ${response.status}`);
  // A refusal still comes back as HTTP 200: {"Status":"108","Text":"REJECTD"}. Only Status "0" means it was accepted.
  const status = String((await response.json().catch(() => null))?.Status ?? '');
  if (status !== '0') throw new Error(`Reve SMS rejected (status ${/^-?\d{1,4}$/.test(status) ? status : 'unreadable'})`);
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
        } else if (config.smsMode === 'reve') {
          await sendWithReve(config, payload);
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
      } catch (error) {
        // The reason only (a status code or error class): never the message, the number or the provider URL.
        if (config.smsMode !== 'test') console.error('SMS delivery failed:', error.message);
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