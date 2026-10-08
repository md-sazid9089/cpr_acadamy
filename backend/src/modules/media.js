import { randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { ensure } from '../http.js';
import { uploadsPath } from '../uploads.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const uploadBodyLimit = Math.ceil(MAX_IMAGE_BYTES * 1.4);
const dataUrl = z.string().max(uploadBodyLimit).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/);
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const pdfBodyLimit = Math.ceil(MAX_PDF_BYTES * 1.4);
const pdfDataUrl = z.string().max(pdfBodyLimit).regex(/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/);
const imageTypes = {
  jpeg: { extension: 'jpg', mime: 'image/jpeg', signature: bytes => bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) },
  png: { extension: 'png', mime: 'image/png', signature: bytes => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { extension: 'webp', mime: 'image/webp', signature: bytes => bytes.subarray(0, 4).equals(Buffer.from('RIFF')) && bytes.subarray(8, 12).equals(Buffer.from('WEBP')) },
};


// `cloudinary://<api_key>:<api_secret>@<cloud_name>` — parsed by hand rather than
// relying on the SDK's implicit process.env.CLOUDINARY_URL pickup, so the
// credential flows through this app's usual explicit config object like everything else.
function configureCloudinary(cloudinaryUrl) {
  const parsed = new URL(cloudinaryUrl);
  cloudinary.config({ cloud_name: parsed.hostname, api_key: parsed.username, api_secret: parsed.password, secure: true });
}

/** Shared by every upload route: validate, then store to Cloudinary or local disk. */
async function storeImage(config, dataUrlValue, folder = 'cpr-academy/uploads') {
  const [, type, encoded] = dataUrlValue.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/) || [];
  const definition = imageTypes[type];
  const bytes = Buffer.from(encoded, 'base64');
  ensure(bytes.length > 0 && bytes.length <= MAX_IMAGE_BYTES, 413, 'IMAGE_TOO_LARGE', 'Images must be 5 MB or smaller.');
  ensure(definition?.signature(bytes), 400, 'INVALID_IMAGE', 'The selected file is not a valid image.');

  if (config?.cloudinaryUrl) {
    configureCloudinary(config.cloudinaryUrl);
    const result = await cloudinary.uploader.upload(dataUrlValue, {
      folder,
      public_id: randomUUID(),
      resource_type: 'image',
    });
    return { url: result.secure_url };
  }

  // No Cloudinary account configured (local dev/test) — same validated bytes, kept on disk instead.
  ensure(!config?.vercel, 503, 'UPLOADS_NOT_CONFIGURED', 'File uploads need Cloudinary on this server. Set CLOUDINARY_URL.');
  await mkdir(uploadsPath(config), { recursive: true });
  const filename = `${randomUUID()}.${definition.extension}`;
  await writeFile(resolve(uploadsPath(config), filename), bytes, { flag: 'wx' });
  return { url: `/api/media/${filename}` };
}

/** Lecture-notes PDF: validated, then stored on Cloudinary (or local disk without it). */
async function storePdf(config, dataUrlValue) {
  const bytes = Buffer.from(dataUrlValue.slice(dataUrlValue.indexOf(',') + 1), 'base64');
  ensure(bytes.length > 0 && bytes.length <= MAX_PDF_BYTES, 413, 'PDF_TOO_LARGE', 'PDFs must be 10 MB or smaller.');
  ensure(bytes.subarray(0, 5).equals(Buffer.from('%PDF-')), 400, 'INVALID_PDF', 'The selected file is not a valid PDF.');

  if (config?.cloudinaryUrl) {
    configureCloudinary(config.cloudinaryUrl);
    // 'raw' keeps the file exactly as uploaded; Cloudinary would otherwise treat a PDF as a multi-page image.
    const result = await cloudinary.uploader.upload(dataUrlValue, {
      folder: 'cpr-academy/notes',
      public_id: `${randomUUID()}.pdf`,
      resource_type: 'raw',
    });
    return { url: result.secure_url };
  }

  ensure(!config?.vercel, 503, 'UPLOADS_NOT_CONFIGURED', 'File uploads need Cloudinary on this server. Set CLOUDINARY_URL.');
  await mkdir(uploadsPath(config), { recursive: true });
  const filename = `${randomUUID()}.pdf`;
  await writeFile(resolve(uploadsPath(config), filename), bytes, { flag: 'wx' });
  return { url: `/api/media/${filename}` };
}

const uploadTargets = {
  // Cloudinary checks the bytes are really one of these image formats before accepting the file.
  image: { resourceType: 'image', folder: 'cpr-academy/uploads', extension: '', allowedFormats: 'jpg,png,webp' },
  // 'raw' keeps the PDF exactly as uploaded; Cloudinary would otherwise treat it as a multi-page image.
  pdf: { resourceType: 'raw', folder: 'cpr-academy/notes', extension: '.pdf', allowedFormats: null },
  // Students' payment screenshots live apart from the academy's own images, so a screenshot URL can
  // only ever point at something a student uploaded as a screenshot (see isOwnScreenshotUrl).
  screenshot: { resourceType: 'image', folder: 'cpr-academy/payments', extension: '', allowedFormats: 'jpg,png,webp' },
};

/**
 * Lets the browser send a file straight to Cloudinary. A serverless function cannot take a
 * request body over 4.5 MB, so large images and lecture PDFs never pass through this API.
 * The signature fixes the folder, file name and (for images) the allowed formats, so the
 * browser can only upload what this call allowed. Without Cloudinary, the browser falls
 * back to the upload routes below.
 */
function signUpload(config, kind) {
  if (!config?.cloudinaryUrl) return { mode: 'server' };
  configureCloudinary(config.cloudinaryUrl);
  const target = uploadTargets[kind];
  const { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret } = cloudinary.config();
  const params = {
    folder: target.folder,
    public_id: `${randomUUID()}${target.extension}`,
    timestamp: Math.floor(Date.now() / 1000),
    // A signature stays valid for about an hour; without this, re-using it would replace the file
    // behind a URL that has already been submitted or reviewed.
    overwrite: 'false',
    ...(target.allowedFormats ? { allowed_formats: target.allowedFormats } : {}),
  };
  return {
    mode: 'cloudinary',
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${target.resourceType}/upload`,
    fields: { ...params, api_key: apiKey, signature: cloudinary.utils.api_sign_request(params, apiSecret) },
  };
}

export function mediaRoutes(route, config) {
  route('POST', '/admin/uploads/signature', { auth: 'admin', rateLimit: { max: 60, timeWindow: '1 minute' }, body: z.object({ kind: z.enum(['image', 'pdf']) }).strict() }, async request => signUpload(config, request.body.kind));
  route('POST', '/uploads/payment-screenshot/signature', { auth: 'active', rateLimit: { max: 20, timeWindow: '15 minutes' }, body: z.object({}).strict() }, async () => signUpload(config, 'screenshot'));

  route('POST', '/admin/uploads/images', { auth: 'admin', bodyLimit: uploadBodyLimit, rateLimit: { max: 60, timeWindow: '1 minute' }, body: z.object({ data: dataUrl }).strict() }, async request => storeImage(config, request.body.data));

  route('POST', '/admin/uploads/pdf', { auth: 'admin', bodyLimit: pdfBodyLimit, rateLimit: { max: 30, timeWindow: '1 minute' }, body: z.object({ data: pdfDataUrl }).strict() }, async request => storePdf(config, request.body.data));

  // Same validation/storage as the admin uploader, but for a student attaching a
  // payment screenshot to their own invoice — a narrower, tighter-throttled route
  // rather than widening the admin one to another auth policy.
  route('POST', '/uploads/payment-screenshot', { auth: 'active', bodyLimit: uploadBodyLimit, rateLimit: { max: 20, timeWindow: '15 minutes' }, body: z.object({ data: dataUrl }).strict() }, async request => storeImage(config, request.body.data, 'cpr-academy/payments'));

  // Named ':filename', not ':id' — a bare param called "id" is auto-validated as a
  // UUID by the route framework, but this value is "<uuid>.<ext>", which isn't one.
  route('GET', '/media/:filename', {}, async request => {
    const filename = basename(request.params.filename);
    ensure(/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename), 404, 'NOT_FOUND', 'Image not found.');
    const path = resolve(uploadsPath(config), filename);
    try {
      const info = await stat(path);
      ensure(info.isFile() && info.size <= MAX_IMAGE_BYTES, 404, 'NOT_FOUND', 'Image not found.');
      const mime = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[extname(filename)];
      return new Response(await readFile(path), { headers: { 'content-type': mime, 'cache-control': 'public, max-age=31536000, immutable' } });
    } catch (error) {
      if (error.code === 'ENOENT') ensure(false, 404, 'NOT_FOUND', 'Image not found.');
      throw error;
    }
  });
}
