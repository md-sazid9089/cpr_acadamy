import { randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { z } from 'zod';
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

export function mediaRoutes(route) {
  route('POST', '/admin/uploads/images', { auth: 'admin', bodyLimit: uploadBodyLimit, body: z.object({ data: dataUrl }).strict() }, async request => {
    const [, type, encoded] = request.body.data.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/) || [];
    const definition = imageTypes[type];
    const bytes = Buffer.from(encoded, 'base64');
    ensure(bytes.length > 0 && bytes.length <= MAX_IMAGE_BYTES, 413, 'IMAGE_TOO_LARGE', 'Images must be 5 MB or smaller.');
    ensure(definition?.signature(bytes), 400, 'INVALID_IMAGE', 'The selected file is not a valid image.');
    await mkdir(uploadsPath(), { recursive: true });
    const filename = `${randomUUID()}.${definition.extension}`;
    await writeFile(resolve(uploadsPath(), filename), bytes, { flag: 'wx' });
    return { url: `/api/media/${filename}` };
  });

  route('GET', '/media/:id', {}, async request => {
    const filename = basename(request.params.id);
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
