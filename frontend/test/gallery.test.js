import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('public gallery cards visibly pair each event name with its photo count', () => {
  const gallery = read('../src/features/marketing/Gallery.jsx');
  assert.match(gallery, /export function GalleryEventCard/);
  assert.match(gallery, /\{name\}/);
  assert.match(gallery, /\{event\.photos\.length\}/);
  assert.match(gallery, /min-w-0 flex-1 truncate text-left/);

  const admin = read('../src/features/admin/upload/GalleryTab.jsx');
  assert.match(admin, /Event name \(shown on the public gallery\)/);
  assert.equal(admin.includes('Event name (only admins see this)'), false);
});
