import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaChevronDown, FaChevronUp, FaStar, FaTrash } from 'react-icons/fa6';
import {
  addGalleryEventPhoto, createGalleryEvent, deleteGalleryEvent, deleteGalleryEventPhoto, fetchAdminGalleryEvents,
  fetchAdminGalleryHero, reorderGalleryEvents, saveGalleryHero, setGalleryEventCover, updateGalleryEvent,
} from '../api/media.api.js';
import { uploadImage } from '../api/admin.api.js';
import { DeleteButton, DropZone, Problems, SaveOnBlurInput, Section, StatusPill, Switch, uploadEach } from './shared.jsx';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { cn } from '@/lib/utils';

const PHOTO_LIMIT = 60;
const EVENTS_KEY = ['admin', 'gallery-events'];
const HERO_KEY = ['admin', 'gallery-hero'];

/** The Gallery page: its hero photo, then the events (each a card that opens its photos). */
export default function GalleryTab() {
  return (
    <div className="space-y-4">
      <HeroPhoto />
      <Events />
    </div>
  );
}

function useRefreshPage() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    queryClient.invalidateQueries({ queryKey: HERO_KEY });
    queryClient.invalidateQueries({ queryKey: ['marketing', 'gallery-page'] });
  };
}

function HeroPhoto() {
  const refresh = useRefreshPage();
  const [problems, setProblems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { data: hero, isLoading } = useQuery({ queryKey: HERO_KEY, queryFn: fetchAdminGalleryHero });
  const save = useMutation({ mutationKey: ['upload'], mutationFn: saveGalleryHero, onSuccess: refresh, onError: (err) => setProblems([err?.message || 'The photo could not be saved.']) });

  const replace = async ([file]) => {
    if (!file) return;
    setProblems([]);
    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      await save.mutateAsync({ imageUrl, alt: hero?.alt ?? '' });
    } catch (err) {
      setProblems([`${file.name}: ${err?.message || 'could not be uploaded.'}`]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Section
      title="Gallery hero photo"
      description="The big photo at the top of the Gallery page, under the “Photo Gallery” title. Without one, the first event’s cover is used."
      specs={['3:2 landscape', 'At least 1800 × 1200', 'Up to 5 MB']}
    >
      {isLoading ? <ContentSkeleton label="Loading photo" /> : (
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
          {hero ? (
            <img src={hero.imageUrl} alt={hero.alt} className="aspect-[3/2] w-full rounded-[6px] rounded-br-[44px] border border-stone-200 object-cover" />
          ) : (
            <DropZone onFiles={replace} disabled={uploading} multiple={false} title={uploading ? 'Uploading…' : '+ Add the hero photo'} hint="Drop a photo here or click to choose." className="aspect-[3/2]" />
          )}
          <div className="space-y-3">
            {hero && (
              <>
                <SaveOnBlurInput id="gallery-hero-alt" label="Photo description" value={hero.alt} maxLength={300} onSave={(alt) => save.mutate({ imageUrl: hero.imageUrl, alt })} />
                <p className="text-xs text-stone-500 dark:text-brand-200">Read aloud by screen readers. Describe what the photo shows.</p>
                <div className="flex flex-wrap gap-2">
                  <label className={cn('inline-flex min-h-[38px] cursor-pointer items-center rounded-control border border-stone-200 bg-white px-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200', uploading && 'pointer-events-none opacity-50')}>
                    {uploading ? 'Uploading…' : 'Replace photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { replace([...event.target.files]); event.target.value = ''; }} />
                  </label>
                  <DeleteButton text="Remove" label="Remove hero photo" onConfirm={() => save.mutate({ imageUrl: null })} />
                </div>
              </>
            )}
            <Problems items={problems} onDismiss={() => setProblems([])} />
          </div>
        </div>
      )}
    </Section>
  );
}

function Events() {
  const queryClient = useQueryClient();
  const refresh = useRefreshPage();
  const [problems, setProblems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const { data: events = [], isLoading, isError, error, refetch, isFetching } = useQuery({ queryKey: EVENTS_KEY, queryFn: fetchAdminGalleryEvents });
  const fail = (err) => setProblems([err?.message || 'The change could not be saved.']);
  const create = useMutation({ mutationKey: ['upload'], mutationFn: createGalleryEvent, onSuccess: (event) => { setOpenId(event.id); refresh(); }, onError: fail });
  const reorder = useMutation({
    mutationKey: ['upload'],
    mutationFn: reorderGalleryEvents,
    onMutate: (ids) => queryClient.setQueryData(EVENTS_KEY, (list = []) => ids.map((id) => list.find((event) => event.id === id))),
    onSettled: refresh,
    onError: fail,
  });
  const move = (index, delta) => {
    const ids = events.map((event) => event.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <Section
      title="Events"
      description="Each event is one card on the Gallery page. Visitors click a card to browse its photos. The cover photo is the card’s image."
      specs={['Any shape', 'At least 1200 px wide', 'Up to 5 MB each', `Up to ${PHOTO_LIMIT} photos per event`]}
      action={<Button size="sm" onClick={() => create.mutate({})} isLoading={create.isPending}>+ New event</Button>}
    >
      {isLoading ? <ContentSkeleton label="Loading events" /> : isError ? (
        <EmptyState variant="error" title="Couldn't load the events" description={error?.message} onRetry={refetch} isFetching={isFetching} />
      ) : events.length === 0 ? (
        <EmptyState title="No events yet" description="Create an event, add its photos, then switch it on to show it on the Gallery page." />
      ) : (
        <ul className="space-y-3">
          {events.map((event, index) => (
            <EventItem
              key={event.id}
              event={event}
              open={openId === event.id}
              onToggle={() => setOpenId((id) => (id === event.id ? null : event.id))}
              canMoveUp={index > 0 && !reorder.isPending}
              canMoveDown={index < events.length - 1 && !reorder.isPending}
              onMove={(delta) => move(index, delta)}
              onProblem={setProblems}
            />
          ))}
        </ul>
      )}
      <Problems items={problems} onDismiss={() => setProblems([])} />
    </Section>
  );
}

function EventItem({ event, open, onToggle, canMoveUp, canMoveDown, onMove, onProblem }) {
  const queryClient = useQueryClient();
  const refresh = useRefreshPage();
  const [uploading, setUploading] = useState(false);
  // Event changes answer with the updated event, so the list is patched in place.
  const put = (saved) => {
    queryClient.setQueryData(EVENTS_KEY, (list = []) => list.map((item) => (item.id === saved.id ? saved : item)));
    queryClient.invalidateQueries({ queryKey: ['marketing', 'gallery-page'] });
  };
  const fail = (err) => onProblem([err?.message || 'The change could not be saved.']);
  const update = useMutation({ mutationKey: ['upload'], mutationFn: updateGalleryEvent, onSuccess: put, onError: fail });
  const cover = useMutation({ mutationKey: ['upload'], mutationFn: setGalleryEventCover, onSuccess: put, onError: fail });
  const removePhoto = useMutation({ mutationKey: ['upload'], mutationFn: deleteGalleryEventPhoto, onSuccess: put, onError: fail });
  const remove = useMutation({ mutationKey: ['upload'], mutationFn: deleteGalleryEvent, onSuccess: refresh, onError: fail });

  const addPhotos = async (files) => {
    onProblem([]);
    setUploading(true);
    const found = await uploadEach(files, async (imageUrl) => put(await addGalleryEventPhoto({ eventId: event.id, imageUrl })), {
      limit: PHOTO_LIMIT - event.photos.length,
      limitMessage: `“${event.name || 'This event'}” already has ${PHOTO_LIMIT} photos.`,
    });
    setUploading(false);
    onProblem(found);
  };

  const panelId = `event-panel-${event.id}`;

  return (
    <li className={cn('overflow-hidden rounded-card border bg-white dark:bg-surface-dark', open ? 'border-brand-200 dark:border-brand-800' : 'border-stone-200 dark:border-stone-200')}>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId} className="grid w-full grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 text-left sm:grid-cols-[72px_minmax(0,1fr)_auto]">
        {event.cover
          ? <img src={event.cover.imageUrl} alt="" className="aspect-[16/11] w-full rounded-lg object-cover" />
          : <span className="aspect-[16/11] w-full rounded-lg bg-stone-100 dark:bg-surface-dark-subtle" />}
        <span className="min-w-0">
          <span className="block truncate font-heading text-base font-semibold text-stone-900 dark:text-white">{event.name || 'Untitled event'}</span>
          <span className="block text-xs text-stone-500 dark:text-brand-200">{event.photos.length} photo{event.photos.length === 1 ? '' : 's'}</span>
        </span>
        <span className="flex items-center gap-2">
          <StatusPill on={event.isPublished} />
          <FaChevronDown aria-hidden="true" className={cn('h-4 w-4 text-stone-400 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div id={panelId} className="space-y-4 border-t border-stone-200 p-4 dark:border-stone-200">
          <SaveOnBlurInput id={`event-name-${event.id}`} label="Event name (only admins see this)" value={event.name} maxLength={120} onSave={(name) => update.mutate({ id: event.id, name })} />

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {event.photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-[16/11] overflow-hidden rounded-lg">
                <img src={photo.imageUrl} alt="" className="h-full w-full object-cover" />
                {event.cover?.id === photo.id && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-accent-500 px-2 text-[11px] font-bold text-white">Cover</span>
                )}
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {event.cover?.id !== photo.id && (
                    <button type="button" aria-label="Use as cover" onClick={() => cover.mutate({ eventId: event.id, photoId: photo.id })} className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-brand-800 hover:text-brand-500">
                      <FaStar aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button type="button" aria-label="Delete photo" onClick={() => removePhoto.mutate({ eventId: event.id, photoId: photo.id })} className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-brand-800 hover:text-red-600">
                    <FaTrash aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {event.photos.length < PHOTO_LIMIT && (
              <DropZone onFiles={addPhotos} disabled={uploading} title={uploading ? 'Uploading…' : '+ Add photos'} hint="Drop or click" className="aspect-[16/11] px-2 py-2" />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Switch
              checked={event.isPublished}
              disabled={!event.photos.length}
              onChange={(isPublished) => update.mutate({ id: event.id, isPublished })}
            >
              {event.photos.length ? 'Show on the Gallery page' : 'Add a photo to show this event'}
            </Switch>
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" aria-label="Move event up" disabled={!canMoveUp} onClick={() => onMove(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:text-brand-600 disabled:opacity-30 dark:border-stone-200 dark:text-brand-200">
                <FaChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <button type="button" aria-label="Move event down" disabled={!canMoveDown} onClick={() => onMove(1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:text-brand-600 disabled:opacity-30 dark:border-stone-200 dark:text-brand-200">
                <FaChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <DeleteButton text="Delete event" label="Delete event" onConfirm={() => remove.mutate(event.id)} />
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
