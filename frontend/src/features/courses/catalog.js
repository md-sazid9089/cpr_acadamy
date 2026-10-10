import { BATCH_GROUPS, CATEGORY_LABELS, CATEGORY_SLUGS, COURSE_CATEGORIES } from '@/constants';

/**
 * Categories and batch groups as the public site shows them. The three built-in
 * categories and the BATCH_GROUPS list keep their fixed slugs, labels and order;
 * anything an admin typed under "Other" is added from the published catalog.
 */

/** URL segment for `/courses/:category`: the fixed slug, else the name lower-cased with dashes. */
export function categorySlug(category) {
  if (!category) return 'fcps';
  return CATEGORY_SLUGS[category] ?? category.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Heading for a category: the built-in description, else the name the admin chose. */
export function categoryLabel(category) {
  return CATEGORY_LABELS[category] ?? category;
}

/** Built-in categories first, then made-up ones A–Z. */
export function sortCategories(categories) {
  const builtIn = COURSE_CATEGORIES.filter((category) => categories.includes(category));
  const custom = categories.filter((category) => !COURSE_CATEGORIES.includes(category)).sort((a, b) => a.localeCompare(b));
  return [...builtIn, ...custom];
}

/** Every category with a published course, plus the built-in three. */
export function catalogCategories(catalog = []) {
  return sortCategories([...new Set([...COURSE_CATEGORIES, ...catalog.map((row) => row.category)])]);
}

/** Resolve a `/courses/:category` segment against the known categories ('ALL' when it matches none). */
export function categoryFromSlug(slug, categories = COURSE_CATEGORIES) {
  if (!slug) return 'ALL';
  let wanted = slug.toLowerCase();
  try {
    wanted = decodeURIComponent(wanted);
  } catch {
    // A stray '%' in a hand-typed URL: compare the segment as it is.
  }
  return categories.find((category) => categorySlug(category) === wanted) ?? 'ALL';
}

/**
 * Cards for the Batches landing page, in order:
 *  1. the built-in groups (always shown, as before),
 *  2. each made-up batch group that has a published course, labelled with its category,
 *  3. one card per category whose published courses include some outside any batch group
 *     (a brand-new category usually starts this way); it lists the whole category.
 * Each card: { id, label, note?, href, count }.
 */
export function batchCards(catalog = []) {
  const known = new Set(BATCH_GROUPS.map((group) => group.id));
  const groupCount = {};
  const categoryCount = {};
  const ungrouped = new Set();
  const customGroups = new Map();
  for (const { category, batchGroup, count } of catalog) {
    categoryCount[category] = (categoryCount[category] ?? 0) + count;
    if (!batchGroup) {
      ungrouped.add(category);
      continue;
    }
    groupCount[batchGroup] = (groupCount[batchGroup] ?? 0) + count;
    if (!known.has(batchGroup) && !customGroups.has(batchGroup)) customGroups.set(batchGroup, category);
  }

  const builtIn = BATCH_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    note: group.note,
    href: `/batches?group=${encodeURIComponent(group.id)}`,
    count: groupCount[group.id] ?? 0,
  }));
  const order = sortCategories([...new Set([...customGroups.values(), ...ungrouped])]);
  const custom = [...customGroups.entries()]
    .sort(([nameA, categoryA], [nameB, categoryB]) => order.indexOf(categoryA) - order.indexOf(categoryB) || nameA.localeCompare(nameB))
    .map(([name, category]) => ({
      id: `group:${name}`,
      label: name,
      note: categoryLabel(category),
      href: `/batches?group=${encodeURIComponent(name)}`,
      count: groupCount[name],
    }));
  const categories = order.filter((category) => ungrouped.has(category)).map((category) => ({
    id: `category:${category}`,
    label: categoryLabel(category),
    note: `All ${category} batches`,
    href: `/batches?category=${encodeURIComponent(category)}`,
    count: categoryCount[category],
  }));
  return [...builtIn, ...custom, ...categories];
}

/** Heading for a `/batches?group=` value: the built-in label, else the admin's own name. */
export function batchGroupTitle(group) {
  return BATCH_GROUPS.find((item) => item.id === group)?.label ?? group;
}
