import apiClient from '@/lib/api-client';

/**
 * Payments. Online gateways are not configured yet, so every purchase is a
 * `manual` payment: the student pays the academy directly and an administrator
 * reconciles it against the invoice, which activates the enrolment. The
 * client never reports a "paid" state itself.
 */

/**
 * @param {{ courseSlug: string, method: string, planId?: string, idempotencyKey: string }} payload
 * `idempotencyKey` must stay the same across retries of one purchase so a
 * double-click cannot create two invoices.
 */
export async function initiatePayment({ courseSlug, method, planId, idempotencyKey }) {
  const { data } = await apiClient.post(
    '/payments/initiate',
    { courseSlug, method, ...(planId ? { planId } : {}) },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return data;
}

export async function fetchPayment(paymentId) {
  const { data } = await apiClient.get(`/payments/${paymentId}`);
  return data;
}

export async function fetchInvoice(invoiceId) {
  const { data } = await apiClient.get(`/invoices/${invoiceId}`);
  return data;
}
