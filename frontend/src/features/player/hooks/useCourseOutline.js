import { useQuery } from '@tanstack/react-query';
import { MOCK_OUTLINE, MOCK_PROGRESS } from '../mock/outline.js';
// import apiClient from '@/lib/api-client';

/**
 * Flip to false once the endpoints exist; the commented request under each
 * branch is the whole swap.
 */
const USE_MOCK = true;

/** Mock latency, so the skeleton states are actually exercised in dev. */
const MOCK_DELAY_MS = 400;

function delay(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_DELAY_MS);
  });
}

async function fetchCourseOutline(courseSlug) {
  if (USE_MOCK) return delay(MOCK_OUTLINE);
  // const { data } = await apiClient.get(`/courses/${courseSlug}/outline`);
  // return data;
  throw new Error('Course outline endpoint not wired yet.');
}

async function fetchCourseProgress(courseSlug) {
  if (USE_MOCK) return delay(MOCK_PROGRESS);
  // const { data } = await apiClient.get(`/courses/${courseSlug}/progress`);
  // return data;
  throw new Error('Course progress endpoint not wired yet.');
}

/** Structure of the course: modules, lessons, types, release dates. */
export function useCourseOutline(courseSlug) {
  return useQuery({
    queryKey: ['course-outline', courseSlug],
    queryFn: () => fetchCourseOutline(courseSlug),
    enabled: Boolean(courseSlug),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Completion counters. Deliberately a separate cache key from the outline:
 * progress changes far more often than structure, and the sidebar ticks and
 * the progress header both read this one query rather than counting locally.
 */
export function useCourseProgress(courseSlug) {
  return useQuery({
    queryKey: ['course-progress', courseSlug],
    queryFn: () => fetchCourseProgress(courseSlug),
    enabled: Boolean(courseSlug),
    staleTime: 60 * 1000,
  });
}
