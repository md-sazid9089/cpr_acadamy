import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('navbar header is opaque everywhere, not just on the student dashboard', () => {
  // Was previously bg-transparent on every public route (home, batches, about, ...),
  // which let scrolling content show through the sticky bar. Header background is
  // now unconditionally opaque, so there's no route-conditional transparency left
  // to assert against.
  const source = read('../src/components/layout/Navbar.jsx');
  assert.match(source, /<header className="sticky top-0 z-40 border-b border-transparent bg-white dark:bg-stone-900">/);
  assert.ok(!source.includes('bg-transparent'));
});

test('navbar theme and mobile menu controls reserve 44px touch targets', () => {
  assert.match(read('../src/components/layout/ThemeToggle.jsx'), /h-11 w-11 shrink-0/);
  assert.match(read('../src/components/layout/Navbar.jsx'), /min-h-11 min-w-11/);
});

test('invoice quantity column reserves room for its heading on narrow screens', () => {
  const source = read('../src/features/payments/Invoice.jsx');
  assert.ok(source.includes("<colgroup><col /><col style={{ width: '3rem' }} /><col style={{ width: '30%' }} /></colgroup>"));
});