import assert from 'node:assert/strict';
import { createServer as httpServer } from 'node:http';
import { after, before, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { createServer } from 'vite';

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = (server) => `http://127.0.0.1:${server.address().port}`;
let upstream, vite, site;

before(async () => {
  upstream = httpServer((_req, res) => res.writeHead(500).end());
  await listen(upstream);
  vite = await createServer({
    logLevel: 'silent',
    ssr: { resolve: { externalConditions: ['node', 'module-sync'] } },
    server: { middlewareMode: true, hmr: false, watch: null, proxy: { '/api': { target: origin(upstream) } } },
  });
  site = httpServer(vite.middlewares);
  await listen(site);
});

after(async () => {
  await vite?.close();
  for (const server of [site, upstream]) {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
  }
});

test('login distinguishes a missing mobile or password from a malformed number', async () => {
  const { loginSchema } = await vite.ssrLoadModule('/src/features/auth/schemas/auth.schemas.js');
  const errors = (mobile, password) => loginSchema.safeParse({ mobile, password }).error.flatten().fieldErrors;
  const empty = errors('  ', '');
  assert.equal(empty.mobile[0], 'Enter your mobile number');
  assert.equal(empty.password[0], 'Enter your password');
  assert.match(errors('123', 'password').mobile[0], /valid Bangladeshi mobile/);
  assert.deepEqual(Object.keys(errors('01712345678', '')), ['password']);
  assert.deepEqual(Object.keys(errors('', 'password')), ['mobile']);
});

test('only active access can show an enrolled badge or a link to the course hub', async () => {
  const { default: Action } = await vite.ssrLoadModule('/src/features/courses/components/CourseAccessAction.jsx');
  const { activeCourseIds } = await vite.ssrLoadModule('/src/features/courses/hooks/useCourseEnrollment.js');
  const course = { id: 'course', slug: 'batch' };
  const render = (enrollment, badge = false) => renderToStaticMarkup(createElement(StaticRouter, { location: '/' },
    createElement(Action, { course, enrollment, badge })));
  const active = { activeIds: activeCourseIds([{ courseId: course.id, status: 'active' }]) };
  const none = { activeIds: activeCourseIds(['expired', 'pending_payment'].map((status) => ({ courseId: course.id, status }))) };
  assert.match(render(active, true), />Enrolled ✓<\/span>/);
  assert.match(render(active), /href="\/dashboard\/course\/batch"[^>]*>Continue Learning/);
  assert.match(render(none), />Enrol<\/button>/);
  assert.match(render({ ...none, checking: true }), /disabled[^>]*>Checking access/);
  assert.match(render({ ...none, retry() {} }), />Retry access check<\/button>/);
});

test('offline, timeout and service-specific errors keep useful messages on every form', async () => {
  const { normalizeError } = await vite.ssrLoadModule('/src/lib/api-client.js');
  const { applyServerErrors } = await vite.ssrLoadModule('/src/lib/form-errors.js');
  const errors = [
    [{ request: {}, code: 'ERR_NETWORK' }, 'Please check your internet connection.'],
    [{ request: {}, code: 'ECONNABORTED' }, 'Server is not responding. Please try again.'],
    [{ response: { status: 504 } }, 'Server is not responding. Please try again.'],
    [{ response: { status: 503, data: { code: 'EMAIL_UNAVAILABLE', message: 'Use your mobile instead.' } } }, 'Use your mobile instead.'],
  ];
  for (const [error, expected] of errors) {
    const normalized = normalizeError(error);
    assert.equal(normalized.message, expected);
    assert.equal(applyServerErrors(normalized, () => {}, []), expected);
  }
});

test('a stopped backend behind the real Vite proxy is distinct from an application 500', async () => {
  const { apiClient } = await vite.ssrLoadModule('/src/lib/api-client.js');
  const request = () => apiClient.get(`${origin(site)}/api/health`);
  await assert.rejects(request, { status: 500, message: 'Something went wrong. Please try again later.' });
  await new Promise((resolve) => upstream.close(resolve));
  await assert.rejects(request, { status: 502, code: 'UPSTREAM_UNAVAILABLE', message: 'Server is not responding. Please try again.' });
});
