import apiClient from '@/lib/api-client';

// Admin Upload page: home hero posters, the Gallery page's hero photo and its events.
// Success collage posts still use the gallery endpoints in admin.api.js.

export async function fetchAdminHeroSlides() {
  const { data } = await apiClient.get('/admin/hero-slides');
  return data;
}

export async function createHeroSlide(input) {
  const { data } = await apiClient.post('/admin/hero-slides', input);
  return data;
}

export async function updateHeroSlide({ id, ...updates }) {
  const { data } = await apiClient.patch(`/admin/hero-slides/${id}`, updates);
  return data;
}

export async function reorderHeroSlides(ids) {
  const { data } = await apiClient.put('/admin/hero-slides/order', { ids });
  return data;
}

export async function deleteHeroSlide(id) {
  const { data } = await apiClient.delete(`/admin/hero-slides/${id}`);
  return data;
}

export async function fetchAdminGalleryHero() {
  const { data } = await apiClient.get('/admin/gallery-hero');
  return data.hero;
}

export async function saveGalleryHero(input) {
  const { data } = await apiClient.put('/admin/gallery-hero', input);
  return data.hero;
}

export async function fetchAdminGalleryEvents() {
  const { data } = await apiClient.get('/admin/gallery-events');
  return data;
}

export async function createGalleryEvent(input = {}) {
  const { data } = await apiClient.post('/admin/gallery-events', input);
  return data;
}

export async function updateGalleryEvent({ id, ...updates }) {
  const { data } = await apiClient.patch(`/admin/gallery-events/${id}`, updates);
  return data;
}

export async function reorderGalleryEvents(ids) {
  const { data } = await apiClient.put('/admin/gallery-events/order', { ids });
  return data;
}

export async function deleteGalleryEvent(id) {
  const { data } = await apiClient.delete(`/admin/gallery-events/${id}`);
  return data;
}

export async function addGalleryEventPhoto({ eventId, imageUrl }) {
  const { data } = await apiClient.post(`/admin/gallery-events/${eventId}/photos`, { imageUrl });
  return data;
}

export async function setGalleryEventCover({ eventId, photoId }) {
  const { data } = await apiClient.patch(`/admin/gallery-events/${eventId}/photos/${photoId}`, { isCover: true });
  return data;
}

export async function deleteGalleryEventPhoto({ eventId, photoId }) {
  const { data } = await apiClient.delete(`/admin/gallery-events/${eventId}/photos/${photoId}`);
  return data;
}
