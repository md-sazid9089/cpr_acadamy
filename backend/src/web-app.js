import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { ApiError, throttle } from './http.js';

const bodyLimit = 1048576;

async function readBody(request, limit = bodyLimit) {
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  // Browsers send body-less POST/DELETE with an empty stream and no content type.
  if (!size) return undefined;
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Use application/json.');
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'BAD_REQUEST', 'Request body must be valid JSON.');
  }
}

export function createWebApp({ database, config, logger }) {
  const routes = [];
  const log = logger || { error() {}, warn() {}, info() {} };
  const app = {
    log,
    route(definition) {
      routes.push({ ...definition, segments: definition.url.split('/').filter(Boolean) });
      routes.sort((left, right) => left.segments.filter(segment => segment.startsWith(':')).length - right.segments.filter(segment => segment.startsWith(':')).length);
    },
    async close() {},
    async handle(webRequest) {
      const id = randomUUID();
      const headers = new Headers({
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-request-id': id,
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'referrer-policy': 'no-referrer',
        'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
        vary: 'Origin',
      });
      if (config.production) headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
      const origin = webRequest.headers.get('origin');
      if (origin && config.corsOrigins.includes(origin)) {
        headers.set('access-control-allow-origin', origin);
        headers.set('access-control-allow-methods', 'GET, HEAD, POST, PATCH, DELETE, OPTIONS');
        headers.set('access-control-allow-headers', 'Content-Type, Authorization, X-Device-Id, Idempotency-Key');
        headers.set('access-control-expose-headers', 'X-Request-Id, Retry-After');
      }
      let status = 200;
      let sent = false;
      let payload;
      const reply = {
        code(value) { status = value; return this; },
        header(name, value) { headers.set(name, String(value)); return this; },
        send(value) { sent = true; payload = value; return this; },
      };
      const respond = value => {
        if (value instanceof Response) {
          const responseHeaders = new Headers(headers);
          value.headers.forEach((headerValue, name) => responseHeaders.set(name, headerValue));
          return new Response(webRequest.method === 'HEAD' || status === 204 ? null : value.body, { status, headers: responseHeaders });
        }
        return new Response(webRequest.method === 'HEAD' || status === 204 ? null : JSON.stringify(value ?? null), { status, headers });
      };
      try {
        if (origin && !config.corsOrigins.includes(origin)) throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'Origin is not allowed.');
        if (webRequest.method === 'OPTIONS') {
          status = 204;
          return respond();
        }
        const url = new URL(webRequest.url);
        const segments = url.pathname.split('/').filter(Boolean);
        const method = webRequest.method === 'HEAD' ? 'GET' : webRequest.method;
        const matches = routes.filter(route => route.segments.length === segments.length && route.segments.every((segment, index) => segment.startsWith(':') || segment === segments[index]));
        const route = matches.find(candidate => candidate.method === method);
        if (!route) {
          if (matches.length) {
            headers.set('allow', [...new Set(matches.map(candidate => candidate.method).concat('OPTIONS'))].join(', '));
            throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Method is not allowed.');
          }
          throw new ApiError(404, 'NOT_FOUND', 'Endpoint not found.');
        }
        const params = {};
        route.segments.forEach((segment, index) => {
          if (segment.startsWith(':')) {
            try { params[segment.slice(1)] = decodeURIComponent(segments[index]); }
            catch { throw new ApiError(400, 'BAD_REQUEST', 'Invalid path encoding.'); }
          }
        });
        const ip = config.trustProxy ? webRequest.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown' : 'unknown';
        const request = { id, method, url: url.pathname, headers: Object.fromEntries(webRequest.headers), params, query: Object.fromEntries(url.searchParams), ip, log };
        const limit = route.config?.rateLimit || { max: 300, timeWindow: '1 minute' };
        const duration = typeof limit.timeWindow === 'number' ? Math.ceil(limit.timeWindow / 1000) : Number.parseInt(limit.timeWindow, 10) * (limit.timeWindow.includes('hour') ? 3600 : limit.timeWindow.includes('minute') ? 60 : 1);
        if (!['/api/health', '/api/ready'].includes(route.url)) {
          await throttle(database, config, `http:${route.method}:${route.url}`, ip, limit.max, duration);
        }
        request.body = await readBody(webRequest, route.config?.bodyLimit);
        await route.preHandler?.(request, reply);
        const result = await route.handler(request, reply);
        return respond(sent ? payload : result);
      } catch (error) {
        let body;
        if (error instanceof ZodError) {
          status = 400;
          body = { code: 'VALIDATION_ERROR', message: 'Please check the submitted fields.', errors: Object.fromEntries(error.issues.map(issue => [issue.path.join('.'), issue.message])) };
        } else if (error instanceof ApiError) {
          status = error.statusCode;
          body = { code: error.code, message: error.message };
        } else if (['23505', '23503', '23514'].includes(error.code)) {
          status = 409;
          body = { code: 'CONFLICT', message: 'This change conflicts with an existing record or constraint.' };
        } else {
          status = 500;
          log.error({ requestId: id, code: error.code, errorType: error.name }, 'Request failed');
          body = { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' };
        }
        if (status === 429) headers.set('retry-after', String(error.retryAfter || 60));
        return respond({ ...body, requestId: id });
      }
    },
    async inject(input) {
      const options = typeof input === 'string' ? { url: input } : input;
      const headers = new Headers(options.headers);
      if (options.payload !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');
      const response = await app.handle(new Request(new URL(options.url, 'http://localhost'), {
        method: options.method || 'GET', headers,
        body: options.payload === undefined ? undefined : JSON.stringify(options.payload),
      }));
      const body = await response.text();
      return { statusCode: response.status, headers: Object.fromEntries(response.headers), body, json: () => JSON.parse(body) };
    },
  };
  return app;
}
