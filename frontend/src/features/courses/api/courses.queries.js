import { useMutation, useQuery } from '@tanstack/react-query';
import {
  enrollInCourse,
  fetchCatalog,
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
  catalog: () => ['courses', 'catalog'],
};

/** Published categories and batch groups with their course counts. */
export function useCatalog() {
  return useQuery({
    queryKey: courseKeys.catalog(),
    queryFn: fetchCatalog,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCourses(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => fetchCourses(params),
    enabled,
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
