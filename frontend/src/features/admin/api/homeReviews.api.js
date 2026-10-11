import apiClient from '@/lib/api-client';

// Home page reviews ("শিক্ষার্থীদের বিশ্বাসের গল্প!"), managed on the admin Reviews page.

export async function fetchAdminHomeReviews() {
  const { data } = await apiClient.get('/admin/home-reviews');
  return data;
}

export async function createHomeReview(input) {
  const { data } = await apiClient.post('/admin/home-reviews', input);
  return data;
}

export async function updateHomeReview({ id, ...updates }) {
  const { data } = await apiClient.patch(`/admin/home-reviews/${id}`, updates);
  return data;
}

export async function reorderHomeReviews(ids) {
  const { data } = await apiClient.put('/admin/home-reviews/order', { ids });
  return data;
}

export async function deleteHomeReview(id) {
  const { data } = await apiClient.delete(`/admin/home-reviews/${id}`);
  return data;
}
