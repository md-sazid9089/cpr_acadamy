import { useMemo } from 'react';
import { flattenLessons, getLessonState } from '../utils/lessonState.js';

/**
 * Previous / Next targets for the active lesson.
 *
 * Next walks forward past any locked lesson and lands on the first one the
 * student can actually open. When everything ahead is locked there is no target
 * and `nextLockedAt` carries the release date of the next lesson in order, so
 * the button can say when it opens instead of going dead without explanation.
 *
 * @param {object} outline
 * @param {string} activeLessonId
 * @param {Date} [now]
 */
export function useLessonNavigation(outline, activeLessonId, now = new Date()) {
  // `now` is a Date; depend on its value so a new object each render does not
  // invalidate the memo on every pass.
  const nowMs = now.getTime();

  return useMemo(() => {
    const lessons = flattenLessons(outline);
    const index = lessons.findIndex((lesson) => lesson.id === activeLessonId);

    if (index === -1) {
      return {
        lessons,
        activeIndex: -1,
        activeLesson: null,
        activeModuleId: null,
        previousLesson: null,
        nextLesson: null,
        nextLockedAt: null,
      };
    }

    const reference = new Date(nowMs);
    const activeLesson = lessons[index];

    // Previous walks back to the closest lesson that is not locked.
    let previousLesson = null;
    for (let i = index - 1; i >= 0; i -= 1) {
      if (getLessonState(lessons[i], activeLessonId, reference) !== 'locked') {
        previousLesson = lessons[i];
        break;
      }
    }

    let nextLesson = null;
    for (let i = index + 1; i < lessons.length; i += 1) {
      if (getLessonState(lessons[i], activeLessonId, reference) !== 'locked') {
        nextLesson = lessons[i];
        break;
      }
    }

    // Nothing openable ahead — surface when the very next lesson opens.
    const nextInOrder = lessons[index + 1] ?? null;
    const nextLockedAt = !nextLesson && nextInOrder ? nextInOrder.releaseAt : null;

    return {
      lessons,
      activeIndex: index,
      activeLesson,
      activeModuleId: activeLesson.moduleId,
      previousLesson,
      nextLesson,
      nextLockedAt,
    };
  }, [outline, activeLessonId, nowMs]);
}
