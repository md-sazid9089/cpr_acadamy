import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changePassword,
  createComplaint,
  fetchAccountProfile,
  fetchComplaint,
  fetchComplaints,
  fetchDevices,
  fetchMyCourses,
  fetchPaymentHistory,
  fetchProgressSummary,
  fetchSubscriptionBatches,
  fetchSubscriptionPlans,
  fetchSubscriptions,
  fetchUpcomingExams,
  replyToComplaint,
  requestDeviceVerification,
  updateAccountProfile,
} from './dashboard.api.js';

export const dashboardKeys = {
  myCourses: ['dashboard', 'my-courses'],
  progress: ['dashboard', 'progress'],
  upcomingExams: ['dashboard', 'upcoming-exams'],
  payments: ['dashboard', 'payments'],
  subscriptionBatches: ['dashboard', 'subscription-batches'],
  subscriptions: (batchId) => ['dashboard', 'subscriptions', batchId],
  subscriptionPlans: (batchId) => ['dashboard', 'subscription-plans', batchId],
  accountProfile: ['dashboard', 'account-profile'],
  devices: ['dashboard', 'devices'],
  complaints: ['dashboard', 'complaints'],
  complaint: (id) => ['dashboard', 'complaints', id],
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

export function useSubscriptionBatches() {
  return useQuery({
    queryKey: dashboardKeys.subscriptionBatches,
    queryFn: fetchSubscriptionBatches,
  });
}

export function useSubscriptions(batchId) {
  return useQuery({
    queryKey: dashboardKeys.subscriptions(batchId),
    queryFn: () => fetchSubscriptions(batchId),
    enabled: Boolean(batchId),
  });
}

export function useSubscriptionPlans(batchId) {
  return useQuery({
    queryKey: dashboardKeys.subscriptionPlans(batchId),
    queryFn: () => fetchSubscriptionPlans(batchId),
    enabled: Boolean(batchId),
  });
}

export function useAccountProfile() {
  return useQuery({ queryKey: dashboardKeys.accountProfile, queryFn: fetchAccountProfile });
}

/** Writes the patched profile straight into the cache — no refetch needed. */
export function useUpdateAccountProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAccountProfile,
    onSuccess: (profile) => queryClient.setQueryData(dashboardKeys.accountProfile, profile),
  });
}

export function useDevices() {
  return useQuery({ queryKey: dashboardKeys.devices, queryFn: fetchDevices });
}

export function useRequestDeviceVerification() {
  return useMutation({ mutationFn: requestDeviceVerification });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}

export function useComplaints() {
  return useQuery({ queryKey: dashboardKeys.complaints, queryFn: fetchComplaints });
}

export function useComplaint(id) {
  return useQuery({
    queryKey: dashboardKeys.complaint(id),
    queryFn: () => fetchComplaint(id),
    enabled: Boolean(id),
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComplaint,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dashboardKeys.complaints }),
  });
}

/** Seeds the thread cache with the server's copy so the new reply shows at once. */
export function useReplyToComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replyToComplaint,
    onSuccess: (complaint) => {
      queryClient.setQueryData(dashboardKeys.complaint(complaint.id), complaint);
      queryClient.invalidateQueries({ queryKey: dashboardKeys.complaints });
    },
  });
}
