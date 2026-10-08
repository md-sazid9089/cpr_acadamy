import apiClient from '@/lib/api-client';
import { readAsDataUrl, uploadFile } from '@/lib/uploads';

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

export async function fetchPaymentHistoryPage(params, signal) {
  const { data } = await apiClient.get('/me/payment-history', { params, signal });
  return data;
}

/** Attaches the student's own transaction ID, paying mobile, and an optional screenshot to a pending invoice. */
export async function submitPaymentProof({ id, transactionId, payerMobile, screenshotUrl }) {
  const { data } = await apiClient.post(`/payments/${id}/proof`, { transactionId, payerMobile, screenshotUrl: screenshotUrl || '' });
  return data;
}

/** @param {File} file A JPEG/PNG/WebP screenshot, 5 MB or smaller. Returns the stored image URL. */
export async function uploadPaymentScreenshot(file) {
  if (!file?.type || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.');
  return uploadFile({
    file,
    signaturePath: '/uploads/payment-screenshot/signature',
    signatureBody: {},
    serverUpload: async () => {
      const data = await readAsDataUrl(file, 'The image could not be read.');
      return (await apiClient.post('/uploads/payment-screenshot', { data })).data.url;
    },
  });
}
