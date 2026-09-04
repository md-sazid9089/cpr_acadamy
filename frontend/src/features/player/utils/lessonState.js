/**
 * Lesson state machine and the date formatters that depend on it.
 *
 * `getLessonState` is the only place a lesson's status is decided. Every
 * component reads from here so a row, the nav buttons and the content pane can
 * never disagree about whether a lesson is locked.
 */

/** All batch times are quoted in Bangladesh Standard Time. */
const TIME_ZONE = 'Asia/Dhaka';

/**
 * Resolve a lesson's display state.
 *
 * Order matters:
 *   1. the active lesson always wins, so the user is never stranded on a row
 *      that renders as locked;
 *   2. an unreleased lesson is locked even if the record says completed;
 *   3. then completed;
 *   4. otherwise available.
 *
 * @param {{ id: string, completed?: boolean, releaseAt?: string }} lesson
 * @param {string} activeLessonId
 * @param {Date} [now]
 * @returns {'active' | 'completed' | 'available' | 'locked'}
 */
export function getLessonState(lesson, activeLessonId, now = new Date()) {
  if (!lesson) return 'locked';
  if (lesson.id === activeLessonId) return 'active';
  if (lesson.releaseAt && new Date(lesson.releaseAt) > now) return 'locked';
  if (lesson.completed) return 'completed';
  return 'available';
}

/**
 * Has this lesson's release time passed?
 *
 * Deliberately independent of `getLessonState`: that function promotes the
 * active lesson to 'active' before testing the release date, which is right for
 * a sidebar row (the user is never stranded on a row that reads as locked) but
 * wrong for the content pane, which must still refuse to play an unreleased
 * lesson the user has navigated directly to.
 */
export function isReleased(lesson, now = new Date()) {
  if (!lesson) return false;
  if (!lesson.releaseAt) return true;
  return new Date(lesson.releaseAt) <= now;
}

// Built once rather than per call: these run for every row the lesson sidebar
// renders, and constructing an Intl formatter is the expensive half of the work.
const DAY_SHORT = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
});
const DAY_LONG = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
});
const CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** '24 Jan' — used on the disabled Next button. */
export function formatUnlockDayShort(iso) {
  if (!iso) return '';
  return DAY_SHORT.format(new Date(iso));
}

/** '24 Jan, 8:00 PM' — used on the locked lesson row's meta line. */
export function formatUnlockShort(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return `${DAY_SHORT.format(date)}, ${CLOCK.format(date).toUpperCase()}`;
}

/** '24 January, 8:00 PM' — used on the locked content pane. */
export function formatUnlockLong(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return `${DAY_LONG.format(date)}, ${CLOCK.format(date).toUpperCase()}`;
}

/** 118 -> '1 h 58 m'; 45 -> '45 m'. */
export function formatModuleDuration(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} m`;
  return rest ? `${hours} h ${rest} m` : `${hours} h`;
}

/** Flatten the outline into lesson order, tagging each with its module. */
export function flattenLessons(outline) {
  if (!outline?.modules) return [];
  return outline.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id, moduleTitle: module.title })),
  );
}
