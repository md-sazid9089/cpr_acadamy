import { useQuery } from '@tanstack/react-query';
import { fetchAdminCourses } from '../api/admin.api.js';
import { BATCH_GROUPS, CATEGORY_LABELS, COURSE_CATEGORIES } from '@/constants';

/** Select value that reveals a free-text box for a brand-new name. */
export const OTHER = '__other__';

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Category and batch-group choices for the admin course forms: the built-in
 * lists plus every custom name an existing course already uses, so a category
 * or group typed in once via "Other" is offered in the dropdown from then on.
 */
export function useCatalogOptions() {
  const { data: courses = [] } = useQuery({ queryKey: ['admin', 'courses'], queryFn: fetchAdminCourses });

  const customCategories = [...new Set(courses.map((course) => course.category))]
    .filter((category) => category && !COURSE_CATEGORIES.includes(category))
    .sort((a, b) => a.localeCompare(b));
  const categories = [
    ...COURSE_CATEGORIES.map((value) => ({ value, label: `${value} — ${CATEGORY_LABELS[value]}` })),
    ...customCategories.map((value) => ({ value, label: value })),
  ];

  const groupsFor = (category) => {
    const builtIn = BATCH_GROUPS.filter((group) => group.category === category).map((group) => ({
      value: group.id,
      label: group.note ? `${group.label} ${group.note}` : group.label,
    }));
    const known = new Set(BATCH_GROUPS.map((group) => group.id));
    const custom = [...new Set(courses.filter((course) => course.category === category).map((course) => course.batchGroup))]
      .filter((group) => group && !known.has(group))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }));
    return [...builtIn, ...custom];
  };

  return { categories, groupsFor };
}

/**
 * Resolves a select value (possibly OTHER plus typed text) to what gets saved.
 * A typed name matching an existing option reuses it, so "fcps" does not
 * create a second FCPS.
 */
export function resolveChoice(selected, typed, options) {
  if (selected !== OTHER) return selected;
  const name = typed.trim();
  const match = options.find((option) => sameName(option.value, name) || sameName(option.label, name));
  return match ? match.value : name;
}

/** Display label for a stored batch group: built-in label, else the custom name itself. */
export function batchGroupLabel(id) {
  return BATCH_GROUPS.find((group) => group.id === id)?.label ?? id;
}
