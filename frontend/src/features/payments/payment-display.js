export function shortInvoiceNumber(invoiceNo) {
  const value = String(invoiceNo ?? '');
  if (value.length <= 24) return value || 'Invoice';
  const prefix = value.match(/^CPR-\d{4}-/i)?.[0] ?? '';
  const reference = value.slice(prefix.length);
  return `${prefix}${reference.slice(0, 4)}...${reference.slice(-4)}`;
}