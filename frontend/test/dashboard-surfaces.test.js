import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import postcss from 'postcss';

const readSource = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

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