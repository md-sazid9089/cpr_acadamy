import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { shortInvoiceNumber } from '../src/features/payments/payment-display.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('invoice display numbers keep the year and reference ends without changing short IDs', () => {
  assert.equal(shortInvoiceNumber('CPR-2026-C6AF0000-1111-2222-3333-0000000054AB'), 'CPR-2026-C6AF...54AB');
  assert.equal(shortInvoiceNumber('CPR-2026-0123'), 'CPR-2026-0123');
  assert.equal(shortInvoiceNumber(null), 'Invoice');
});

test('history retains full invoice references and offers view actions, filters, sorting and pagination', () => {
  const source = read('../src/features/student-dashboard/PaymentHistory.jsx');
  assert.ok(source.includes('title={payment.invoiceNo}'));
  assert.ok(source.includes('shortInvoiceNumber(payment.invoiceNo)'));
  assert.ok(source.includes('title="View invoice"'));
  assert.ok(source.includes('<tfoot>'));
  assert.ok(source.includes('Object.entries(data.totals)'));
  assert.ok(source.includes('aria-label="Payment pagination"'));
  assert.ok(source.includes('type="date"'));
  assert.ok(source.includes('amount-desc'));
  assert.ok(source.includes('No payments in this date range'));
  assert.equal(source.includes('CardHeader'), false);
});

test('invoice uses the shared address, labelled institution, logo and separate recorded dates', () => {
  const source = read('../src/features/payments/Invoice.jsx');
  assert.ok(source.includes('{CONTACT.address}'));
  assert.ok(read('../src/components/layout/Footer.jsx').includes('CONTACT.address'));
  assert.ok(source.includes('Institution: {invoice.billedTo.institution}'));
  assert.ok(source.includes('cpr-logo.png'));
  assert.ok(source.includes('invoice.issuedAt'));
  assert.ok(source.includes('invoice.paidAt &&'));
  assert.ok(source.includes('invoice.invoiceNo'));
});

test('invoice print rules remove shell chrome and preserve a white document with dark text', () => {
  const styles = read('../src/features/payments/payments.css');
  assert.ok(styles.includes('@media print'));
  for (const selector of ['header', 'nav', 'footer', 'button', 'canvas', '.invoice-toolbar', '.invoice-payment-notice']) assert.ok(styles.includes(`body:has(.invoice-print-layout) ${selector}`));
  assert.ok(styles.includes('break-inside: avoid'));
  assert.ok(styles.includes('display: table-header-group'));
  assert.ok(styles.includes('color: var(--n-900) !important'));
});

test('payment table keeps its positioned accessible caption inside the scroll region', () => {
  const styles = read('../src/features/payments/payments.css');
  assert.match(styles, /\.payment-table-scroll \{ position: relative; overflow-x: auto;/);
});