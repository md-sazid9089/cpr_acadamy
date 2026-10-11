import apiClient from '@/lib/api-client';

/** Home page hero posters that are switched on, in order: `[{ id, imageUrl, title, link }]`. */
export async function fetchHeroSlides() {
  const { data } = await apiClient.get('/hero-slides');
  return data;
}

/** The Gallery page: `{ hero: { imageUrl, alt } | null, events: [{ id, name, coverUrl, photos: [{ id, imageUrl }] }] }`. */
export async function fetchGalleryPage() {
  const { data } = await apiClient.get('/gallery/page');
  return data;
}

/** Home page student reviews that are switched on, in order: `[{ id, name, role, quote, rating }]`. */
export async function fetchHomeReviews() {
  const { data } = await apiClient.get('/home-reviews');
  return data;
}
