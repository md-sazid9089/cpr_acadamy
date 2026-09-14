import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import { buildSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
function loadComponent(filename) {
  const result = buildSync({
  entryPoints: [fileURLToPath(new URL(`../src/components/ui/${filename}`, import.meta.url))],
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  packages: 'external',
  define: { 'import.meta.env': '{}' },
  alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
});
  const sandbox = { module: { exports: {} }, require };
  vm.runInNewContext(result.outputFiles[0].text, sandbox);
  return sandbox.module.exports;
}
const { default: ContentSkeleton, PageSkeleton, Skeleton } = loadComponent('Skeleton.jsx');
const { default: Table } = loadComponent('Table.jsx');

test('skeleton layouts expose a single loading status with decorative placeholders', () => {
  for (const variant of ['list', 'cards', 'table', 'exam', 'form', 'detail', 'dashboard']) {
    const html = renderToStaticMarkup(React.createElement(ContentSkeleton, { variant }));
    assert.equal((html.match(/role="status"/g) ?? []).length, 1);
    assert.ok(html.includes('aria-busy="true"'));
    assert.ok(html.includes('aria-hidden="true"'));
    assert.ok(html.includes(`data-skeleton="${variant}"`));
    assert.ok(!html.includes('<svg'));
    assert.ok(!html.includes('<button'));
    assert.ok(!html.includes('<input'));
  }
});

test('skeleton animation respects reduced motion and page layouts remain bounded', () => {
  const placeholder = renderToStaticMarkup(React.createElement(Skeleton));
  assert.ok(placeholder.includes('motion-safe:animate-pulse'));
  assert.ok(placeholder.includes('dark:bg-'));
  const page = renderToStaticMarkup(React.createElement(PageSkeleton));
  assert.ok(page.includes('max-w-7xl'));
  assert.ok(!page.includes('min-h-screen'));
  assert.ok(page.includes('Loading page'));
});

test('loading tables retain headers and replace data with five noninteractive rows', () => {
  const props = {
    columns: [{ key: 'name', header: 'Student' }, { key: 'mark', header: 'Marks', align: 'right' }],
    rows: [{ id: 'private', name: 'Hidden student', mark: 90 }],
    isLoading: true,
    onRowClick: () => assert.fail('Loading rows must not be interactive'),
  };
  const html = renderToStaticMarkup(React.createElement(Table, props));
  assert.ok(html.includes('Student</th>'));
  assert.ok(html.includes('Marks</th>'));
  assert.equal((html.match(/<tr aria-hidden="true">/g) ?? []).length, 5);
  assert.ok(html.includes('Loading table'));
  assert.ok(!html.includes('Hidden student'));
  assert.ok(!html.includes('Nothing here yet'));
  const loaded = renderToStaticMarkup(React.createElement(Table, { ...props, isLoading: false }));
  assert.ok(loaded.includes('Hidden student'));
  assert.ok(!loaded.includes('Loading table'));
  const empty = renderToStaticMarkup(React.createElement(Table, { ...props, rows: [], isLoading: false }));
  assert.ok(empty.includes('Nothing here yet'));
});