import apiClient from '@/lib/api-client';

/** Reads a picked file as a `data:` URL for the API's own upload routes. */
export function readAsDataUrl(file, errorMessage) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(errorMessage));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file and returns its stored URL. The API first signs an upload for the browser to
 * send straight to Cloudinary: on Vercel a request to the API cannot be larger than 4.5 MB, so
 * the file must not pass through it. Without Cloudinary (local development) the API answers
 * `{ mode: 'server' }` and the file goes through the API's own upload route instead.
 */
export async function uploadFile({ file, signaturePath, signatureBody, serverUpload }) {
  const { data: plan } = await apiClient.post(signaturePath, signatureBody);
  if (plan.mode !== 'cloudinary') return serverUpload();
  const form = new FormData();
  for (const [key, value] of Object.entries(plan.fields)) form.append(key, String(value));
  form.append('file', file);
  let response;
  try {
    // Plain fetch, not apiClient: the student's session token must never be sent to Cloudinary.
    response = await fetch(plan.uploadUrl, { method: 'POST', body: form });
  } catch {
    throw new Error('The upload could not reach the file server. Check your connection and try again.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url) {
    throw new Error(result?.error?.message ? `Upload failed: ${result.error.message}` : 'Upload failed. Please try again.');
  }
  return result.secure_url;
}
