import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('student dashboard header is opaque without changing public navigation backgrounds', () => {
  const source = read('../src/components/layout/Navbar.jsx');
  assert.ok(source.includes("isStudent && (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) ? 'bg-white dark:bg-stone-900' : 'bg-transparent'"));
});

test('navbar theme and mobile menu controls reserve 44px touch targets', () => {
  assert.match(read('../src/components/layout/ThemeToggle.jsx'), /h-11 w-11 shrink-0/);
  assert.match(read('../src/components/layout/Navbar.jsx'), /min-h-11 min-w-11/);
});

test('invoice quantity column reserves room for its heading on narrow screens', () => {
  const source = read('../src/features/payments/Invoice.jsx');
  assert.ok(source.includes("<colgroup><col /><col style={{ width: '3rem' }} /><col style={{ width: '30%' }} /></colgroup>"));
});