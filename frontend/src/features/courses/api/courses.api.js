import { sleep } from '@/lib/utils';
import { MOCK_COURSES, MOCK_CURRICULUM } from './mock-courses.js';
// import apiClient from '@/lib/api-client';

/**
 * Course data access. Every function currently resolves mock data after a short
 * delay so loading states are exercised.
 *
 * TODO: swap each body for the real request, e.g.
 *   const { data } = await apiClient.get('/courses', { params });
 *   return data;
 */

/** @param {{ category?: string, search?: string }} [params] */
export async function fetchCourses(params = {}) {
  await sleep(350);

  const { category, search } = params;
  let courses = [...MOCK_COURSES];

  if (category && category !== 'ALL') {
    courses = courses.filter((course) => course.category === category);
  }

  if (search) {
    const needle = search.toLowerCase();
    courses = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(needle) ||
        course.subtitle.toLowerCase().includes(needle),
    );
  }

  return courses;
}

export async function fetchFeaturedCourses() {
  await sleep(250);
  return MOCK_COURSES.filter((course) => course.isFeatured);
}

/** @param {string} slug */
export async function fetchCourseBySlug(slug) {
  await sleep(300);
  const course = MOCK_COURSES.find((item) => item.slug === slug);
  if (!course) {
    throw { status: 404, code: 'COURSE_NOT_FOUND', message: 'This course could not be found.' };
  }
  return { ...course, curriculum: MOCK_CURRICULUM };
}

/** @param {string} courseId */
export async function enrollInCourse(courseId) {
  await sleep(400);
  // TODO: POST /courses/:id/enroll — returns the checkout/invoice payload.
  return { ok: true, courseId, redirectTo: '/dashboard/payments' };
}
