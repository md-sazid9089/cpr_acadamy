import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa6';
import { createHeroSlide, deleteHeroSlide, fetchAdminHeroSlides, reorderHeroSlides, updateHeroSlide } from '../api/media.api.js';
import { DeleteButton, DropZone, Preview, Problems, SaveOnBlurInput, Section, StatusPill, Switch, uploadEach } from './shared.jsx';
import Carousel from '@/components/ui/Carousel.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';

const LIMIT = 8;
const KEY = ['admin', 'hero-slides'];

/** Home page hero posters: upload, order, switch on or off, title and click-through link. */
export default function HeroTab() {
  const queryClient = useQueryClient();
  const [problems, setProblems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { data: slides = [], isLoading, isError, error, refetch, isFetching } = useQuery({ queryKey: KEY, queryFn: fetchAdminHeroSlides });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: KEY });
    queryClient.invalidateQueries({ queryKey: ['marketing', 'hero-slides'] });
  };
  const fail = (err) => setProblems([err?.message || 'The change could not be saved.']);
  const update = useMutation({ mutationKey: ['upload'], mutationFn: updateHeroSlide, onSuccess: refresh, onError: fail });
  const remove = useMutation({ mutationKey: ['upload'], mutationFn: deleteHeroSlide, onSuccess: refresh, onError: fail });
  const reorder = useMutation({
    mutationKey: ['upload'],
    mutationFn: reorderHeroSlides,
    onMutate: (ids) => queryClient.setQueryData(KEY, (list = []) => ids.map((id) => list.find((slide) => slide.id === id))),
    onSettled: refresh,
    onError: fail,
  });

  const move = (index, delta) => {
    const ids = slides.map((slide) => slide.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    reorder.mutate(ids);
  };

  const add = async (files) => {
    setProblems([]);
    setUploading(true);
    const found = await uploadEach(files, (imageUrl, file) => createHeroSlide({ imageUrl, title: file.name.replace(/\.[^.]+$/, '') }), {
      limit: LIMIT - slides.length,
      limitMessage: `The home page holds up to ${LIMIT} posters. Delete one to add another.`,
    });
    setUploading(false);
    setProblems(found);
    refresh();
  };

  const live = slides.filter((slide) => slide.isPublished);

  return (
    <Section
      title="Home hero posters"
      description="The posters on the right of the home page. They change every 5 seconds, in the order below. Every image is cropped from the centre to fill the 16:10 card, so keep text away from the edges."
      specs={['16:10 landscape', '1600 × 1000 recommended', 'Cropped to fit', 'JPG, PNG or WebP', 'Up to 5 MB', `Up to ${LIMIT} posters`]}
    >
      {isLoading ? <ContentSkeleton label="Loading posters" /> : isError ? (
        <EmptyState variant="error" title="Couldn't load the posters" description={error?.message} onRetry={refetch} isFetching={isFetching} />
      ) : (
        <>
          <Preview label="Preview, as on the home page" aside={`${live.length} on the site`}>
            {live.length ? (
              <div className="mx-auto max-w-md">
                <Carousel
                  key={live.map((slide) => slide.id).join()}
                  slides={live.map((slide) => ({ id: slide.id, src: slide.imageUrl, alt: slide.title || 'Poster' }))}
                  fit="cover"
                  showArrows
                  frameClassName="rounded-[6px] rounded-tl-[44px] rounded-br-[44px] border border-stone-200 dark:border-stone-200"
                  aspectClassName="aspect-[16/10]"
                  label="Home hero preview"
                />
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-stone-500 dark:text-brand-200">No posters are switched on, so this area is empty on the home page.</p>
            )}
          </Preview>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-500 dark:text-brand-200">
            <span><strong className="tabular-nums text-stone-900 dark:text-white">{slides.length} of {LIMIT}</strong> posters</span>
            <span className="text-xs">Only posters switched on appear on the site.</span>
          </div>

          <ul className="space-y-2.5">
            {slides.map((slide, index) => (
              <li key={slide.id} className="grid grid-cols-[auto_80px_minmax(0,1fr)] items-center gap-3 rounded-image border border-stone-200 bg-white p-2.5 sm:grid-cols-[auto_104px_minmax(0,1fr)_auto] dark:border-stone-200 dark:bg-surface-dark">
                <div className="grid gap-1">
                  <button type="button" aria-label="Move up" disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)} className="flex h-6 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:text-brand-600 disabled:opacity-30 dark:border-stone-200 dark:text-brand-200">
                    <FaChevronUp aria-hidden="true" className="h-3 w-3" />
                  </button>
                  <button type="button" aria-label="Move down" disabled={index === slides.length - 1 || reorder.isPending} onClick={() => move(index, 1)} className="flex h-6 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:text-brand-600 disabled:opacity-30 dark:border-stone-200 dark:text-brand-200">
                    <FaChevronDown aria-hidden="true" className="h-3 w-3" />
                  </button>
                </div>
                <img src={slide.imageUrl} alt="" className="aspect-[16/10] w-full rounded-md object-cover" />
                <div className="grid min-w-0 gap-2.5 sm:grid-cols-2">
                  <SaveOnBlurInput id={`hero-title-${slide.id}`} label="Poster title" value={slide.title} onSave={(title) => update.mutate({ id: slide.id, title })} />
                  <SaveOnBlurInput id={`hero-link-${slide.id}`} label="Opens when clicked" value={slide.link} placeholder="/courses/…  (optional)" maxLength={500} onSave={(link) => update.mutate({ id: slide.id, link })} />
                </div>
                <div className="col-span-3 flex items-center justify-end gap-3 sm:col-span-1">
                  <StatusPill on={slide.isPublished} />
                  <Switch label="Show on the home page" checked={slide.isPublished} onChange={(isPublished) => update.mutate({ id: slide.id, isPublished })} />
                  <DeleteButton label="Delete poster" onConfirm={() => remove.mutate(slide.id)} />
                </div>
              </li>
            ))}
          </ul>

          {slides.length < LIMIT && (
            <DropZone
              onFiles={add}
              disabled={uploading}
              title={uploading ? 'Uploading…' : '+ Add posters'}
            />
          )}
          <Problems items={problems} onDismiss={() => setProblems([])} />
        </>
      )}
    </Section>
  );
}
