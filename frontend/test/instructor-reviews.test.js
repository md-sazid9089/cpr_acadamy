import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import * as React from 'react';
import * as runtime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

function renderReviews({ auth = {}, publicResult = { data: { total: 0, average: 0, reviews: [] } }, ownResult = {} } = {}) {
  const source = readFileSync(new URL('../src/features/courses/components/InstructorReviews.jsx', import.meta.url), 'utf8');
  const code = transformSync(source, { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  const module = { exports: {} };
  const queries = [];
  const dependencies = {
    react: React,
    'react/jsx-runtime': runtime,
    'react-router-dom': { useLocation: () => ({ pathname: '/courses/fcps/test-course' }) },
    'react-icons/fa6': Object.fromEntries(['FaStar', 'FaRegStar', 'FaTrashCan', 'FaArrowLeft', 'FaArrowRight'].map(name => [name, () => null])),
    '@/components/ui/Button.jsx': { __esModule: true, default: ({ children, to, disabled, type, title, 'aria-label': label }) => React.createElement(to ? 'a' : 'button', { href: to, disabled, type, title, 'aria-label': label }, children) },
    '@/components/ui/Spinner.jsx': { __esModule: true, default: ({ label }) => React.createElement('p', { role: 'status' }, label) },
    '@/hooks/useAuth': { useAuth: () => auth },
    '@/lib/utils': { formatDate: () => '14 Sep 2026' },
    '@tanstack/react-query': {
      useQuery: options => { queries.push(options); return options.queryKey[0] === 'instructor-reviews' ? publicResult : ownResult; },
      useMutation: () => ({ isPending: false }),
      useQueryClient: () => ({}),
    },
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => dependencies[name] ?? {} });
  return { html: renderToStaticMarkup(React.createElement(module.exports.default, { slug: 'test-course' })), queries };
}

const student = { user: { id: 'student-1' }, isAuthenticated: true, isApproved: true };

test('review empty state does not invent ratings and offers guest sign-in', () => {
  const { html, queries } = renderReviews();
  assert.match(html, /No instructor reviews yet/);
  assert.match(html, /Sign in to review/);
  assert.doesNotMatch(html, /out of 5 stars/);
  assert.equal(Boolean(queries[1].enabled), false);
});

test('enrolled students receive five accessible rating choices and bounded feedback', () => {
  const { html, queries } = renderReviews({ auth: student, ownResult: { data: { canReview: true, review: null } } });
  assert.equal((html.match(/type="radio"/g) ?? []).length, 5);
  assert.match(html, /aria-label="5 stars"/);
  assert.match(html, /maxLength="2000"/);
  assert.match(html, /Your name and review will be public/);
  assert.match(html, /Submit review/);
  assert.equal(queries[1].queryKey[2], 'student-1');
});

test('unenrolled students cannot submit, while existing reviews remain deletable after expiry', () => {
  const blocked = renderReviews({ auth: student, ownResult: { data: { canReview: false, review: null } } }).html;
  assert.match(blocked, /Only students with an active enrollment/);
  assert.doesNotMatch(blocked, /<form/);
  const existing = renderReviews({ auth: student, ownResult: { data: { canReview: false, review: { id: 'review', rating: 4, feedback: 'Clear teaching' } } } }).html;
  assert.match(existing, /Delete review/);
  assert.match(existing, /<fieldset disabled/);
  assert.doesNotMatch(existing, /Update review/);
});

test('public reviews display averages, pagination, and escaped student feedback', () => {
  const { html } = renderReviews({ publicResult: { data: { total: 6, average: 4.5, reviews: [{ id: 'review', rating: 5, studentName: 'Test Student', feedback: '<script>alert(1)</script>', updatedAt: '2026-09-14T00:00:00Z' }] } } });
  assert.match(html, /4.5 \/ 5/);
  assert.match(html, /6 reviews/);
  assert.match(html, /Next reviews/);
  assert.match(html, /Page 1 of 2/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('review request failures have retry controls instead of an empty-state claim', () => {
  const { html } = renderReviews({ publicResult: { isError: true } });
  assert.match(html, /Reviews could not be loaded/);
  assert.match(html, /Try again/);
  assert.doesNotMatch(html, /No instructor reviews yet/);
});