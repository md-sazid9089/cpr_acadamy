import { randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { ensure } from '../http.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const uploadBodyLimit = Math.ceil(MAX_IMAGE_BYTES * 1.4);
const dataUrl = z.string().max(uploadBodyLimit).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/);
const imageTypes = {
  jpeg: { extension: 'jpg', mime: 'image/jpeg', signature: bytes => bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) },
  png: { extension: 'png', mime: 'image/png', signature: bytes => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { extension: 'webp', mime: 'image/webp', signature: bytes => bytes.subarray(0, 4).equals(Buffer.from('RIFF')) && bytes.subarray(8, 12).equals(Buffer.from('WEBP')) },
};

function uploadsPath() {
  return resolve(process.cwd(), 'public', 'uploads');
}

// `cloudinary://<api_key>:<api_secret>@<cloud_name>` — parsed by hand rather than
// relying on the SDK's implicit process.env.CLOUDINARY_URL pickup, so the
// credential flows through this app's usual explicit config object like everything else.
function configureCloudinary(cloudinaryUrl) {
  const parsed = new URL(cloudinaryUrl);
  cloudinary.config({ cloud_name: parsed.hostname, api_key: parsed.username, api_secret: parsed.password, secure: true });
}

/** Shared by every upload route: validate, then store to Cloudinary or local disk. */
async function storeImage(config, dataUrlValue) {
  const [, type, encoded] = dataUrlValue.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/) || [];
  const definition = imageTypes[type];
  const bytes = Buffer.from(encoded, 'base64');
  ensure(bytes.length > 0 && bytes.length <= MAX_IMAGE_BYTES, 413, 'IMAGE_TOO_LARGE', 'Images must be 5 MB or smaller.');
  ensure(definition?.signature(bytes), 400, 'INVALID_IMAGE', 'The selected file is not a valid image.');

  if (config?.cloudinaryUrl) {
    configureCloudinary(config.cloudinaryUrl);
    const result = await cloudinary.uploader.upload(dataUrlValue, {
      folder: 'cpr-academy/uploads',
      public_id: randomUUID(),
      resource_type: 'image',
    });
    return { url: result.secure_url };
  }

  // No Cloudinary account configured (local dev/test) — same validated bytes, kept on disk instead.
  await mkdir(uploadsPath(), { recursive: true });
  const filename = `${randomUUID()}.${definition.extension}`;
  await writeFile(resolve(uploadsPath(), filename), bytes, { flag: 'wx' });
  return { url: `/api/media/${filename}` };
}

export function mediaRoutes(route, config) {
  route('POST', '/admin/uploads/images', { auth: 'admin', bodyLimit: uploadBodyLimit, body: z.object({ data: dataUrl }).strict() }, async request => storeImage(config, request.body.data));

  // Same validation/storage as the admin uploader, but for a student attaching a
  // payment screenshot to their own invoice — a narrower, tighter-throttled route
  // rather than widening the admin one to another auth policy.
  route('POST', '/uploads/payment-screenshot', { auth: 'active', bodyLimit: uploadBodyLimit, rateLimit: { max: 20, timeWindow: '15 minutes' }, body: z.object({ data: dataUrl }).strict() }, async request => storeImage(config, request.body.data));

  // Named ':filename', not ':id' — a bare param called "id" is auto-validated as a
  // UUID by the route framework, but this value is "<uuid>.<ext>", which isn't one.
  route('GET', '/media/:filename', {}, async request => {
    const filename = basename(request.params.filename);
    ensure(/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename), 404, 'NOT_FOUND', 'Image not found.');
    const path = resolve(uploadsPath(), filename);
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
