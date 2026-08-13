import { useQuery } from '@tanstack/react-query';
import {
  fetchMyCourses,
  fetchPaymentHistory,
  fetchProgressSummary,
  fetchUpcomingExams,
} from './dashboard.api.js';

export const dashboardKeys = {
  myCourses: ['dashboard', 'my-courses'],
  progress: ['dashboard', 'progress'],
  upcomingExams: ['dashboard', 'upcoming-exams'],
  payments: ['dashboard', 'payments'],
};

export function useMyCourses() {
  return useQuery({ queryKey: dashboardKeys.myCourses, queryFn: fetchMyCourses });
}

export function useProgressSummary() {
  return useQuery({ queryKey: dashboardKeys.progress, queryFn: fetchProgressSummary });
}

export function useUpcomingExams() {
  return useQuery({ queryKey: dashboardKeys.upcomingExams, queryFn: fetchUpcomingExams });
}

export function usePaymentHistory() {
  return useQuery({ queryKey: dashboardKeys.payments, queryFn: fetchPaymentHistory });
}
