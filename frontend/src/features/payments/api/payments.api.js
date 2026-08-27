import { sleep } from '@/lib/utils';
// import apiClient from '@/lib/api-client';

/**
 * Payments, mocked.
 * TODO: POST /payments/initiate (returns a gateway redirect URL for
 * bKash/Nagad/Rocket), GET /payments/:id, GET /invoices/:id.
 * Never trust a client-reported "paid" state — confirmation must come from the
 * gateway callback the backend verifies.
 */

export async function initiatePayment({ courseSlug, method, amount }) {
  await sleep(700);
  return {
    ok: true,
    paymentId: `pay_${Date.now()}`,
    courseSlug,
    method,
    amount,
    // TODO: the real response carries `redirectUrl` to the gateway.
    redirectUrl: null,
  };
}

export async function fetchInvoice(invoiceId) {
  await sleep(400);
  return {
    id: invoiceId,
    invoiceNo: 'CPR-2025-001842',
    issuedAt: '2025-12-28T09:12:00.000Z',
    status: 'paid',
    method: 'bkash',
    transactionId: 'BKH8ZQ11X4',
    billedTo: {
      name: 'Dr. Rahim Uddin',
      mobile: '01711111111',
      institution: 'Dhaka Medical College',
    },
    lines: [
      {
        id: 'line-1',
        description: 'FCPS Part-1 Medicine — January Batch (6 months)',
        quantity: 1,
        unitPrice: 18000,
      },
    ],
    discount: 4500,
    total: 13500,
  };
}
