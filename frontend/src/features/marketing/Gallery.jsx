import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaImages } from 'react-icons/fa6';
import { fetchGalleryPage } from './api/siteMedia.api.js';
import PhotoLightbox from './components/PhotoLightbox.jsx';
import MolecularBackground from '@/components/ui/backgrounds/MolecularBackground.jsx';
import ResponsiveImage, { localWebpSrcSet } from '@/components/ui/ResponsiveImage.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';

/** Gallery page: one big hero photo, then a card per event that opens its photos in a viewer. Managed on the admin Upload page. */
export default function Gallery() {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['marketing', 'gallery-page'],
    queryFn: fetchGalleryPage,
  });
  const [open, setOpen] = useState(null); // { event, index }

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <ContentSkeleton label="Loading gallery" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page py-16">
        <EmptyState
          variant="error"
          title="Couldn't load the gallery"
          description={error?.message || 'Something went wrong. Please try again.'}
          onRetry={refetch}
          isFetching={isFetching}
        />
      </div>
    );
  }

  const events = data?.events ?? [];
  // Without a chosen hero photo, the first event's cover stands in.
  const hero = data?.hero ?? (events[0] ? { imageUrl: events[0].coverUrl, alt: events[0].name } : null);

  if (!hero && !events.length) {
    return (
      <div className="container-page py-16">
        <EmptyState title="Photos coming soon" description="Check back soon to see photos from our classes and events." />
      </div>
    );
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-surface-light dark:bg-surface-dark">
      <MolecularBackground />

      <section className="relative py-10 sm:py-14">
        <div className="container-page relative z-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-normal text-brand-900 sm:text-4xl lg:text-5xl dark:text-white">
            Photo Gallery
          </h1>
          {hero && (
            <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-[6px] rounded-br-[56px] border border-stone-200 sm:mt-8">
              <ResponsiveImage
                src={hero.imageUrl}
                webpSrcSet={localWebpSrcSet(hero.imageUrl)}
                sizes="(min-width: 1024px) 768px, 92vw"
                alt={hero.alt || 'CPR Medical Academy'}
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {events.length > 0 && (
        <section aria-label="Events" className="relative flex-1 bg-surface-subtle py-10 sm:py-14 dark:bg-surface-dark-subtle">
          <div className="container-page relative z-10">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setOpen({ event, index: Math.max(0, event.photos.findIndex((photo) => photo.imageUrl === event.coverUrl)) })}
                  aria-label={`${event.name || 'Event'}, ${event.photos.length} photos`}
                  className="group relative aspect-[16/11] overflow-hidden rounded-image border border-stone-200 bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-surface-dark"
                >
                  <ResponsiveImage
                    src={event.coverUrl}
                    webpSrcSet={localWebpSrcSet(event.coverUrl)}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-brand-900/70 px-2 py-0.5 text-xs font-semibold text-white">
                    <FaImages aria-hidden="true" className="h-3 w-3" />
                    {event.photos.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {open && (
        <PhotoLightbox
          photos={open.event.photos}
          startIndex={open.index}
          label={open.event.name || 'Event photos'}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
