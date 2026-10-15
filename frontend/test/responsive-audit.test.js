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

test('navbar mobile menu control reserves a 44px touch target', () => {
  // The theme toggle is disabled (it renders nothing), so only the menu button remains.
  assert.match(read('../src/components/layout/Navbar.jsx'), /min-h-11 min-w-11/);
});

test('the receipt table fits a phone: full width, no forced minimum, amounts right-aligned', () => {
  const source = read('../src/features/payments/PaymentFlow.jsx');
  const table = source.slice(source.indexOf('<table'), source.indexOf('</table>'));
  assert.ok(table.includes('className="w-full text-sm"'));
  assert.equal(/min-w-\[/.test(table), false);
  assert.ok(table.includes('text-right tabular-nums'));
});