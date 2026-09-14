import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import postcss from 'postcss';
import theme from '../tailwind.config.js';

const styles = postcss.parse(readFileSync(new URL('../src/index.css', import.meta.url), 'utf8'));
const tokens = new Map();
styles.walkRules(':root', rule => rule.walkDecls(declaration => tokens.set(declaration.prop, declaration.value)));
postcss.parse(readFileSync(new URL('../public/theme-tokens.css', import.meta.url), 'utf8'))
  .walkRules(':root', rule => rule.walkDecls(declaration => tokens.set(declaration.prop, declaration.value)));

function value(name) {
  const color = tokens.get(name.startsWith('--') ? name : `--color-${name}`);
  assert.ok(color, `Missing color token: ${name}`);
  return color.startsWith('var(') ? value(color.slice(4, -1)) : color.toLowerCase();
}

function luminance(color) {
  assert.match(color, /^#[0-9a-f]{6}$/i);
  const channels = color.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
  const linear = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground, background) {
  const levels = [luminance(value(foreground)), luminance(value(background))].sort((left, right) => right - left);
  return (levels[0] + 0.05) / (levels[1] + 0.05);
}

test('blue and warm stone roles remain centralized', () => {
  const expected = {
    blue: '--blue-500', 'blue-deep': '--blue-700', display: '--blue-800',
    red: '--red', 'red-deep': '--red-text', urgency: '--red-50',
    'neutral-badge': '--blue-100', body: '--n-900',
    secondary: '--n-700', muted: '--n-500', section: '--n-100', page: '--n-50', border: '--n-200',
  };
  for (const [name, color] of Object.entries(expected)) assert.equal(value(name), value(color));
  assert.equal(value('brand-600'), value('blue'));
  assert.equal(value('brand-700'), value('blue-deep'));
  assert.match(theme.theme.colors.brand[600], /var\(--color-brand-600\)/);
  assert.match(theme.theme.extend.borderColor.DEFAULT, /var\(--color-border\)/);
  assert.equal(theme.theme.extend.boxShadow.DEFAULT, 'none');
});

test('small-text foreground and background pairs meet WCAG AA', () => {
  for (const [foreground, background] of [
    ['white', 'blue'], ['white', 'blue-deep'], ['white', 'red-deep'],
    ['body', 'page'], ['secondary', 'page'], ['display', 'page'],
    ['blue-deep', 'neutral-badge'], ['red-deep', 'urgency'],
    ['brand-200', 'dark'], ['white', 'dark-panel'],
  ]) {
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background} must meet 4.5:1`);
  }
});

test('poster red is reserved for large bold white labels, not small text', () => {
  assert.ok(contrast('white', 'red') >= 3);
  assert.ok(contrast('white', 'red') < 4.5);
  assert.match(theme.theme.extend.textColor.accent[500], /var\(--color-red-deep\)/);
});

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    return entry.isDirectory() ? sourceFiles(path) : /\.(jsx?|css|svg|html)$/.test(entry.name) ? [path] : [];
  });
}

test('site source has no hardcoded colour literals or retired palette utilities', () => {
  const files = [
    ...sourceFiles(new URL('../src/', import.meta.url)),
    ...sourceFiles(new URL('../scripts/bg-src/', import.meta.url)),
    new URL('../index.html', import.meta.url),
    new URL('../../watermark-footer.html', import.meta.url),
  ];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source.replace(/url\(#[^)]+\)/g, ''), /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/i, file.pathname);
    assert.doesNotMatch(source, /\b(?:bg|text|border|divide|ring|from|via|to|fill|stroke)-(?:slate|gray|zinc|gold|amber|yellow|orange|cyan|indigo|emerald|green|purple|violet)-\d+/, file.pathname);
    assert.doesNotMatch(source, /(?:^|[\s'"`])(?:[\w-]+:)*(?:drop-shadow|shadow)(?:-[\w[\]-]+)?(?:[\s'"`]|$)/, file.pathname);
  }
});

test('colour variables resolve to canonical root tokens', () => {
  for (const [name] of tokens) {
    if (name.startsWith('--color-')) assert.match(value(name), /^#[\da-f]{6}$/i, name);
  }
  const canonical = postcss.parse(readFileSync(new URL('../public/theme-tokens.css', import.meta.url), 'utf8'));
  let count = 0;
  canonical.walkDecls(declaration => {
    assert.equal(declaration.parent.selector, ':root');
    assert.match(declaration.value, /^#[\da-f]{6}$/i);
    count += 1;
  });
  assert.equal(count, 18);
});

test('caption token contrast limitation remains explicit', () => {
  assert.ok(contrast('muted', 'white') >= 4.5);
  assert.ok(contrast('muted', 'page') >= 4.5);
  assert.ok(contrast('muted', 'section') < 4.5);
});