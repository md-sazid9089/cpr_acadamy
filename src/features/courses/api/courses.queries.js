import { useMutation, useQuery } from '@tanstack/react-query';
import {
  enrollInCourse,
  fetchCourseBySlug,
  fetchCourses,
  fetchFeaturedCourses,
} from './courses.api.js';

/** Query key factory — keeps invalidation call sites honest. */
export const courseKeys = {
  all: ['courses'],
  list: (params) => ['courses', 'list', params ?? {}],
  featured: () => ['courses', 'featured'],
  detail: (slug) => ['courses', 'detail', slug],
};

export function useCourses(params) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => fetchCourses(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedCourses() {
  return useQuery({
    queryKey: courseKeys.featured(),
    queryFn: fetchFeaturedCourses,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCourse(slug) {
  return useQuery({
    queryKey: courseKeys.detail(slug),
    queryFn: () => fetchCourseBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useEnroll() {
  return useMutation({ mutationFn: enrollInCourse });
}
