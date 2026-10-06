import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Kept free of app imports: courses.js needs these, and anything that pulls in
// http.js from here would close the http -> db -> migrations -> exams -> courses loop.

export function uploadsPath(config) {
  return config?.uploadDir ?? resolve(process.cwd(), 'public', 'uploads');
}

/** Where a locally stored (no Cloudinary) lecture PDF is recorded. Never served by /media — only through the signed content link. */
export const localPdfPath = /^\/api\/media\/([0-9a-f-]{36}\.pdf)$/;

/** Bytes of a lecture PDF stored on local disk, or null when it is missing. */
export async function readLocalPdf(config, value) {
  const [, filename] = value.match(localPdfPath) || [];
  if (!filename) return null;
  try { return await readFile(resolve(uploadsPath(config), filename)); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
