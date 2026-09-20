import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { stat } from 'node:fs/promises';

const backgrounds = ['1149786_5650', 'Kerfin7-NEA-2128', '1103999_7626'];
const posters = ['postera', 'posterb', 'posterc', 'posterd', 'postere', 'posterf'];

for (const name of backgrounds) {
  const source = fileURLToPath(new URL(`../public/assets/bg/${name}.jpg`, import.meta.url));
  for (const width of [768, 1920]) {
    const target = fileURLToPath(new URL(`../public/assets/bg/${name}-${width}.webp`, import.meta.url));
    await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(target);
    const { size } = await stat(target);
    console.log(`${name}-${width}.webp: ${Math.round(size / 1024)} KB`);
  }
}

// Promotional photography is reused by the hero carousel, gallery and course
// fallbacks. Keep JPEG originals as a universal fallback; ship responsive WebP
// derivatives to browsers that support them.
for (const name of posters) {
  const source = fileURLToPath(new URL(`../public/assets/carousel/${name}.jpeg`, import.meta.url));
  for (const width of [480, 960]) {
    const target = fileURLToPath(new URL(`../public/assets/carousel/${name}-${width}.webp`, import.meta.url));
    await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(target);
    const { size } = await stat(target);
    console.log(`${name}-${width}.webp: ${Math.round(size / 1024)} KB`);
  }
}
