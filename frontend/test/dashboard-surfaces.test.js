import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import postcss from 'postcss';

const readSource = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('dashboard heading does not add top padding inside the layout', () => {
  const overview = readSource('../src/features/student-dashboard/Overview.jsx');
  const wrapper = overview.match(/return \(\s*<div className="([^"]+)"/)[1];
  assert.equal(/(?:^|\s)(?:\w+:)*p(?:t|y)?-/.test(wrapper), false);
  assert.ok(wrapper.includes('px-4 pb-4 sm:px-8 sm:pb-8 md:px-10 md:pb-10'));
});

test('dashboard tile borders use the global blue palette in both themes', () => {
  const overview = readSource('../src/features/student-dashboard/Overview.jsx');
  assert.ok(overview.includes('ui-card group dashboard-menu-card'));
  const styles = postcss.parse(readSource('../src/index.css'));
  for (const [selector, color] of [
    ['.dashboard-content .dashboard-menu-card', '--blue-500'],
    ['.dark .dashboard-content .dashboard-menu-card', '--blue-400'],
  ]) {
    const declarations = new Map();
    styles.walkRules(selector, (rule) => {
      rule.walkDecls((declaration) => declarations.set(declaration.prop, declaration.value));
    });
    assert.equal(declarations.get('border-color'), `var(${color})`);
  }
});

test('dashboard tiles keep three desktop columns and allow labels to wrap', () => {
  const overview = readSource('../src/features/student-dashboard/Overview.jsx');
  assert.ok(overview.includes('grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3'));
  assert.equal(/(?:lg|xl|2xl):grid-cols-/.test(overview), false);
  assert.ok(overview.includes('min-h-[135px] min-w-0'));
  assert.ok(overview.includes('w-full break-words'));
  assert.equal(overview.includes('overflow-hidden'), false);
});

test('dashboard cards have translucent backgrounds without fading their content', () => {
  const styles = postcss.parse(readSource('../src/index.css'));
  for (const [selector, color] of [
    ['.dashboard-content .ui-card', '--white'],
    ['.dark .dashboard-content .ui-card', '--blue-900'],
  ]) {
    const declarations = new Map();
    styles.walkRules(selector, (rule) => {
      rule.walkDecls((declaration) => declarations.set(declaration.prop, declaration.value));
    });
    assert.equal(declarations.get('background-color'), `color-mix(in srgb, var(${color}) 35%, transparent)`);
    assert.equal(declarations.has('opacity'), false);
    assert.equal(declarations.has('backdrop-filter'), false);
  }
});

test('both dashboard layouts opt in and the overview no longer masks the molecules', () => {
  const layout = readSource('../src/components/layout/DashboardLayout.jsx');
  assert.equal((layout.match(/<main className="dashboard-content /g) ?? []).length, 2);
  const overview = readSource('../src/features/student-dashboard/Overview.jsx');
  const wrapper = overview.match(/return \(\s*<div className="([^"]+)"/)[1];
  assert.equal(/bg-/.test(wrapper), false);
  assert.equal(overview.includes('radial-gradient'), false);
  assert.ok(overview.includes('className="ui-card group'));
  assert.ok(readSource('../src/features/student-dashboard/components/DashboardPanel.jsx').includes("'ui-card overflow-hidden"));
});