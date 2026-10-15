/**
 * Manual payment settings for the student payment page.
 *
 * The academy's wallet numbers are not stored in the database, so they come from the build
 * settings (Vercel → frontend → Environment Variables) and fall back to a placeholder.
 * Set VITE_BKASH_NUMBER and VITE_NAGAD_NUMBER to the real receiving numbers.
 */
export const WALLETS = [
  {
    id: 'bkash',
    name: 'বিকাশ',
    sub: 'bKash · Send Money',
    number: import.meta.env?.VITE_BKASH_NUMBER || '01700-000000',
    accountType: 'পার্সোনাল',
    app: 'বিকাশ',
    // Tailwind needs whole class names, so each wallet carries its own.
    nameClass: 'text-accent-600 dark:text-accent-300',
    dotClass: 'bg-accent-500',
    selectedClass: 'border-accent-500 ring-2 ring-accent-50 dark:ring-accent-950',
    headClass: 'bg-accent-500',
  },
  {
    id: 'nagad',
    name: 'নগদ',
    sub: 'Nagad · Send Money',
    number: import.meta.env?.VITE_NAGAD_NUMBER || '01800-000000',
    accountType: 'পার্সোনাল',
    app: 'নগদ',
    nameClass: 'text-brand-600 dark:text-brand-300',
    dotClass: 'bg-brand-500',
    selectedClass: 'border-brand-500 ring-2 ring-brand-50 dark:ring-brand-950',
    headClass: 'bg-brand-500',
  },
];

export const walletById = (id) => WALLETS.find((wallet) => wallet.id === id) ?? null;

/**
 * A short code the student can type into the bKash or Nagad reference field, derived from the
 * invoice number so no two open invoices share one. The admin sees the same code on the
 * Transaction approval list, which is how a statement line is matched back to an invoice.
 */
export function paymentReference(invoiceNo) {
  const tail = String(invoiceNo ?? '').replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase();
  return tail ? `CPR-${tail}` : '';
}

const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Bengali digits typed on a Bangla keyboard become the ASCII digits the API expects. */
export const toEnglishDigits = (value) => String(value ?? '').replace(/[০-৯]/g, (digit) => BENGALI_DIGITS.indexOf(digit));

/** '+880 17…' / '৮৮০১৭…' -> '017…'; keeps only digits. */
export function cleanMobile(value) {
  const digits = toEnglishDigits(value).replace(/\D/g, '');
  return digits.startsWith('880') ? `0${digits.slice(3)}` : digits;
}

/** The same rule the API applies, so the student is never refused after submitting. */
export const isValidMobile = (value) => /^01[3-9]\d{8}$/.test(value);

/** Transaction IDs are shown and stored upper case; a bank reference may carry hyphens. */
export const cleanTransactionId = (value) => toEnglishDigits(value).toUpperCase().replace(/[^A-Z0-9-]/g, '');

/** bKash and Nagad IDs are 10 characters; the range is wider so a bank reference still passes. */
export const isValidTransactionId = (value) => /^[A-Z0-9][A-Z0-9-]{5,19}$/.test(value);
