import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// catalog.js imports '@/constants'; point that at the real file so the helpers run under plain Node.
const constantsUrl = new URL('../src/constants/index.js', import.meta.url).href;
const source = readFileSync(new URL('../src/features/courses/catalog.js', import.meta.url), 'utf8').replace("from '@/constants'", `from '${constantsUrl}'`);
const { batchCards, batchGroupTitle, catalogCategories, categoryFromSlug, categoryLabel, categorySlug } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { BATCH_GROUPS } = await import(constantsUrl);

const catalog = [
  { category: 'BCS', batchGroup: '47th BCS', count: 2 },
  { category: 'Dental', batchGroup: 'BDS Part-1', count: 1 },
  { category: 'Dental', batchGroup: null, count: 3 },
  { category: 'FCPS', batchGroup: 'fcps-p1-medicine', count: 4 },
  { category: 'FCPS', batchGroup: 'FCPS Night Batch', count: 1 },
];

test('built-in categories keep their slugs and labels; new ones get readable ones', () => {
  assert.equal(categorySlug('FCPS'), 'fcps');
  assert.equal(categorySlug('Dental Surgery'), 'dental-surgery');
  assert.equal(categoryLabel('BCS'), 'BCS (Health) Preparation');
  assert.equal(categoryLabel('Dental'), 'Dental');
  assert.deepEqual(catalogCategories(catalog), ['FCPS', 'BCS', 'MBBS', 'Dental']);
  assert.equal(categoryFromSlug('dental', catalogCategories(catalog)), 'Dental');
  assert.equal(categoryFromSlug('dental-surgery', ['Dental Surgery']), 'Dental Surgery');
  assert.equal(categoryFromSlug('unknown', catalogCategories(catalog)), 'ALL');
});

test('batch cards keep the built-in groups and add every new group and ungrouped category', () => {
  const cards = batchCards(catalog);
  const builtIn = cards.filter((card) => !card.id.includes(':'));
  assert.deepEqual(builtIn.map((card) => card.id), BATCH_GROUPS.map((group) => group.id), 'every built-in group keeps its card and order');
  assert.equal(builtIn.find((card) => card.id === 'fcps-p1-medicine').count, 4);
  const added = cards.filter((card) => card.id.includes(':')).map(({ label, note, href, count }) => ({ label, note, href, count }));
  assert.deepEqual(added, [
    { label: 'FCPS Night Batch', note: categoryLabel('FCPS'), href: '/batches?group=FCPS%20Night%20Batch', count: 1 },
    { label: '47th BCS', note: 'BCS (Health) Preparation', href: '/batches?group=47th%20BCS', count: 2 },
    { label: 'BDS Part-1', note: 'Dental', href: '/batches?group=BDS%20Part-1', count: 1 },
    { label: 'Dental', note: 'All Dental batches', href: '/batches?category=Dental', count: 4 },
  ]);
  assert.equal(batchGroupTitle('fcps-p1-medicine'), 'FCPS P-I Medicine');
  assert.equal(batchGroupTitle('47th BCS'), '47th BCS');
  assert.equal(batchCards([]).length, BATCH_GROUPS.length, 'with nothing published, the page looks as it did');
});
