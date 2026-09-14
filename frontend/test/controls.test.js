import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import postcss from 'postcss';
import theme from '../tailwind.config.js';

const styles = postcss.parse(readFileSync(new URL('../src/index.css', import.meta.url), 'utf8'));

function declarations(selector) {
  const values = new Map();
  styles.walkRules(selector, rule => {
    if (rule.parent.type !== 'atrule') {
      rule.walkDecls(declaration => values.set(declaration.prop, declaration.value));
    } else if (rule.parent.name === 'layer') {
      rule.walkDecls(declaration => values.set(declaration.prop, declaration.value));
    }
  });
  return values;
}

test('control family uses centralized radius and touch-size tokens', () => {
  const tokens = declarations(':root');
  for (const [name, value] of Object.entries({
    'radius-control': '11px', 'radius-card': '16px', 'radius-image': '12px',
    'radius-pill': '9999px', 'control-height-large': '54px',
    'control-height-medium': '48px', 'control-height-small': '38px', 'control-gap': '12px',
  })) assert.equal(tokens.get(`--${name}`), value);
  assert.equal(theme.theme.extend.borderRadius.lg, 'var(--radius-control)');
  assert.equal(theme.theme.extend.borderRadius['2xl'], 'var(--radius-card)');
});

test('buttons grow with their labels and retain the mobile touch floor', () => {
  const base = declarations('.ui-button');
  assert.equal(base.get('height'), 'auto');
  assert.equal(base.get('min-height'), 'var(--control-height-medium)');
  assert.equal(base.get('line-height'), '1.5');
  assert.equal(base.get('font-size'), '15px');
  assert.equal(declarations(".ui-button[data-size='lg']").get('font-size'), '16px');
  assert.equal(declarations(".ui-button[data-size='sm']").get('font-size'), '13px');
  assert.equal(declarations(".ui-button[data-size='sm']").has('min-height'), false);
  const compactContexts = [];
  styles.walkDecls('min-height', declaration => {
    if (declaration.value === 'var(--control-height-small)') compactContexts.push(declaration.parent.parent.params);
  });
  assert.deepEqual(compactContexts, ['(min-width: 640px) and (pointer: fine) and (hover: hover)']);
});

test('action groups stack full-width with a twelve-pixel gap by default', () => {
  const group = declarations('.button-group');
  assert.equal(group.get('flex-direction'), 'column');
  assert.equal(group.get('gap'), 'var(--control-gap)');
  assert.equal(declarations('.button-group > .ui-button').get('width'), '100%');
});