import apiClient from '@/lib/api-client';

/**
 * Public course catalogue. Facet filters travel as comma-separated query
 * values; the backend splits them.
 */

function facet(list) {
  return list?.length ? list.join(',') : undefined;
}

/**
 * @param {Object} [params]
 * @param {string} [params.category]     'FCPS' | 'BCS' | 'MBBS' | 'ALL'
 * @param {string} [params.group]        BATCH_GROUPS id.
 * @param {string[]} [params.batchTypes]
 * @param {string[]} [params.sessions]
 * @param {string[]} [params.branches]
 * @param {string} [params.search]
 */
export async function fetchCourses(params = {}) {
  const { data } = await apiClient.get('/courses', {
    params: {
      category: params.category && params.category !== 'ALL' ? params.category : undefined,
      group: params.group || undefined,
      search: params.search?.trim() || undefined,
      batchTypes: facet(params.batchTypes),
      sessions: facet(params.sessions),
      branches: facet(params.branches),
      limit: 100,
    },
  });
  return data;
}

export async function fetchFeaturedCourses() {
  const { data } = await apiClient.get('/courses', { params: { featured: 'true', limit: 12 } });
  return data;
}

/** @param {string} slug */
export async function fetchCourseBySlug(slug) {
  const { data } = await apiClient.get(`/courses/${encodeURIComponent(slug)}`);
  return data;
}

/** @param {string} courseId Creates the pending enrolment and returns where to pay. */
export async function enrollInCourse(courseId) {
  const { data } = await apiClient.post(`/courses/${courseId}/enroll`);
  return data;
}
