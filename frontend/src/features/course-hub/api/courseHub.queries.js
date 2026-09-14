import { useQuery } from '@tanstack/react-query';
import {
  fetchCourseVideos,
  fetchCourseExams,
  fetchCourseSchedule,
} from './courseHub.api.js';

export const courseHubKeys = {
  videos: (slug) => ['course-hub', 'videos', slug],
  exams: (slug) => ['course-hub', 'exams', slug],
  schedule: (slug) => ['course-hub', 'schedule', slug],
};

/** Videos for the At a Glance tab, grouped by date. */
export function useCourseVideos(slug) {
  return useQuery({
    queryKey: courseHubKeys.videos(slug),
    queryFn: () => fetchCourseVideos(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

/** SBA and MCQ exams for the Exam tab. */
export function useCourseExams(slug) {
  return useQuery({
    queryKey: courseHubKeys.exams(slug),
    queryFn: () => fetchCourseExams(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

/** Routine rows for the Schedule tab. */
export function useCourseSchedule(slug) {
  return useQuery({
    queryKey: courseHubKeys.schedule(slug),
    queryFn: () => fetchCourseSchedule(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}
