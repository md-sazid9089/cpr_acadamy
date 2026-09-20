import { z } from 'zod';
import { one } from './db.js';
import { digestToken } from './security.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function ensure(condition, status, code, message) {
  if (!condition) throw new ApiError(status, code, message);
}

export const uuid = z.string().uuid();
export const text = z.string().trim().min(1).max(200);
export const mobile = z.string().regex(/^01[3-9]\d{8}$/, 'Enter a valid Bangladesh mobile number');
export const password = z.string().min(10).max(128);
export const pageQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).max(100000).default(0) });

export function installRoutes(app, database, config, contract) {
  async function authenticate(request, policy) {
    const token = request.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    ensure(token, 401, 'UNAUTHENTICATED', 'Please sign in.');
    const session = await one(database, `SELECT s.*, u.status, u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.access_hash=$1`, [digestToken(token, config.tokenSecret)]);
    ensure(session && !session.revoked_at, 401, 'SESSION_REVOKED', 'This session is no longer active.');
    ensure(session.device_id === request.headers['x-device-id'], 401, 'DEVICE_MISMATCH', 'Sign in again on this device.');
    ensure(new Date(session.expires_at).getTime() > Date.now(), 401, 'TOKEN_EXPIRED', 'Your session has expired.');
    ensure(session.status !== 'suspended', 401, 'ACCOUNT_SUSPENDED', 'This account is suspended.');
    if (policy !== 'pending') ensure(session.status === 'active', 403, 'ACCOUNT_NOT_ACTIVE', 'Administrator approval is required.');
    if (policy === 'admin') ensure(session.role === 'admin', 403, 'FORBIDDEN', 'Administrator access is required.');
    request.auth = session;
  }

  return function route(method, url, options, handler) {
    const path = `/api${url}`.replace(/:([A-Za-z]+)/g, '{$1}');
    const operation = { operationId: `${method.toLowerCase()}_${url.replace(/[^a-zA-Z0-9]+/g, '_')}`,
      tags: [url.split('/')[1]], security: options.auth ? [{ bearerAuth: [], deviceId: [] }] : [],
      responses: { 200: { description: 'Successful response' }, 400: { description: 'Validation error' }, 401: { description: 'Missing or invalid session' }, 403: { description: 'Insufficient access' }, 409: { description: 'Conflicting state' }, 503: { description: 'Dependency unavailable' } },
      parameters: [...url.matchAll(/:([A-Za-z]+)/g)].map(match => ({ name: match[1], in: 'path', required: true, schema: { type: 'string' } })),
    };
    if (options.body) operation.requestBody = { required: true, content: { 'application/json': { schema: zodToJsonSchema(options.body, { target: 'openApi3', $refStrategy: 'none' }) } } };
    if (options.query) {
      const querySchema = zodToJsonSchema(options.query, { target: 'openApi3', $refStrategy: 'none' });
      operation.parameters.push(...Object.entries(querySchema.properties || {}).map(([name, schema]) => ({ name, in: 'query', required: querySchema.required?.includes(name) || false, schema })));
    }
    if (url === '/payments/initiate') operation.parameters.push({ name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string', minLength: 8, maxLength: 128 } });
    contract.paths[path] ??= {};
    contract.paths[path][method.toLowerCase()] = operation;
    app.route({
      method,
      url: `/api${url}`,
      config: { rateLimit: options.rateLimit ?? { max: 300, timeWindow: '1 minute' }, bodyLimit: options.bodyLimit },
      preHandler: async request => {
        if (options.auth) await authenticate(request, options.auth);
        for (const [name, value] of Object.entries(request.params ?? {})) {
          if (name === 'id' || name.endsWith('Id')) uuid.parse(value);
        }
        if (options.body) request.body = options.body.parse(request.body);
        if (options.query) request.query = options.query.parse(request.query);
      },
      handler,
    });
  };
}

export async function audit(database, actorId, action, entityId, details = {}) {
  await database.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES ($1,$2,$3,$4)', [actorId, action, entityId, JSON.stringify(details)]);
}

export async function throttle(database, config, scope, identity, max = 10, seconds = 900) {
  const key = digestToken(`${scope}:${identity}`, config.tokenSecret);
  const bucket = await one(database, `INSERT INTO rate_buckets(key,resets_at) VALUES ($1,now()+$2*interval '1 second')
    ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_buckets.resets_at<=now() THEN 1 ELSE rate_buckets.hits+1 END,
    resets_at=CASE WHEN rate_buckets.resets_at<=now() THEN EXCLUDED.resets_at ELSE rate_buckets.resets_at END RETURNING hits,resets_at`, [key, seconds]);
  if (bucket.hits > max) {
    const error = new ApiError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.');
    error.retryAfter = Math.max(1, Math.ceil((new Date(bucket.resets_at).getTime() - Date.now()) / 1000));
    throw error;
  }
}
