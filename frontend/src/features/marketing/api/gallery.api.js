import apiClient from '@/lib/api-client';

/** Published gallery photos, grouped by section: `[{ section, photos }]`. */
export async function fetchGallery() {
  const { data } = await apiClient.get('/gallery');
  return data;
}
