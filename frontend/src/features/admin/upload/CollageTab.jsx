import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGalleryPhoto, deleteGalleryPhoto, fetchAdminGallery, updateGalleryPhoto } from '../api/admin.api.js';
import { DeleteButton, DropZone, Preview, Problems, SaveOnBlurInput, Section, Switch, uploadEach } from './shared.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { SUCCESS_COLLAGE_SECTION } from '@/constants';

// Matches the home page collage, which has 7 card places (COLLAGE_SIZE in SuccessCollage.jsx).
const HOME_LIMIT = 7;
const TILTS = ['-rotate-3 mt-3', 'rotate-2', '-rotate-2 mt-6', 'rotate-3 -mt-1', '-rotate-3 mt-4', 'rotate-2', 'rotate-3 mt-3', '-rotate-2 mt-1'];

/** Success collage posts: the existing "Success Collage" gallery section, shown as tilted cards on the home page. */
export default function CollageTab() {
  const queryClient = useQueryClient();
  const [problems, setProblems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { data: all = [], isLoading, isError, error, refetch, isFetching } = useQuery({ queryKey: ['admin', 'gallery'], queryFn: fetchAdminGallery });
  const posts = all.filter((photo) => photo.section === SUCCESS_COLLAGE_SECTION);
  const onHome = posts.filter((post) => post.isPublished);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] });
    queryClient.invalidateQueries({ queryKey: ['marketing', 'gallery'] });
  };
  const fail = (err) => setProblems([err?.message || 'The change could not be saved.']);
  const update = useMutation({ mutationKey: ['upload'], mutationFn: updateGalleryPhoto, onSuccess: refresh, onError: fail });
  const remove = useMutation({ mutationKey: ['upload'], mutationFn: deleteGalleryPhoto, onSuccess: refresh, onError: fail });

  const add = async (files) => {
    setProblems([]);
    setUploading(true);
    let free = HOME_LIMIT - onHome.length;
    const nextPosition = posts.reduce((max, post) => Math.max(max, post.position), -1) + 1;
    let offset = 0;
    const found = await uploadEach(files, (imageUrl, file) => {
      const isPublished = free > 0;
      free -= 1;
      return createGalleryPhoto({ section: SUCCESS_COLLAGE_SECTION, caption: file.name.replace(/\.[^.]+$/, ''), imageUrl, position: nextPosition + offset++, isPublished });
    });
    setUploading(false);
    setProblems(found);
    refresh();
  };

  return (
    <Section
      title="Success collage"
      description="Result posts shown as tilted cards on the home page, above “আপনার স্বপ্নের পথে আজই এক ধাপ এগিয়ে যান”. Each is shown as a 4:5 card."
      specs={['4:5 portrait best', '1080 × 1350', 'Up to 5 MB', `${HOME_LIMIT} on the home page`]}
    >
      {isLoading ? <ContentSkeleton label="Loading posts" /> : isError ? (
        <EmptyState variant="error" title="Couldn't load the posts" description={error?.message} onRetry={refetch} isFetching={isFetching} />
      ) : (
        <>
          <Preview label="Preview, as on the home page">
            <div className="flex min-h-[150px] flex-wrap items-start justify-center gap-4 py-2">
              {onHome.length ? onHome.slice(0, HOME_LIMIT).map((post, index) => (
                <figure key={post.id} className={`w-20 shrink-0 overflow-hidden rounded-card border border-stone-200 bg-white sm:w-24 ${TILTS[index % TILTS.length]}`}>
                  <img src={post.imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
                </figure>
              )) : (
                <p className="self-center text-sm text-stone-500 dark:text-brand-200">No posts are on. The home page shows its built-in sample posters until you add some.</p>
              )}
            </div>
            <p lang="bn" className="mt-3 text-center font-heading text-lg font-bold text-stone-900 dark:text-white">আপনার স্বপ্নের পথে আজই এক ধাপ এগিয়ে যান</p>
          </Preview>

          <p className="text-sm text-stone-500 dark:text-brand-200">
            <strong className="tabular-nums text-stone-900 dark:text-white">{onHome.length} of {HOME_LIMIT}</strong> home page places used · {posts.length} posts in total
          </p>

          <DropZone onFiles={add} disabled={uploading} title={uploading ? 'Uploading…' : '+ Upload posts'} />
          <Problems items={problems} onDismiss={() => setProblems([])} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => {
              const full = !post.isPublished && onHome.length >= HOME_LIMIT;
              return (
                <article key={post.id} className="flex flex-col overflow-hidden rounded-image border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark">
                  <img src={post.imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
                  <div className="grid gap-2 p-3">
                    <SaveOnBlurInput id={`collage-caption-${post.id}`} label="Caption" value={post.caption} maxLength={300} onSave={(caption) => update.mutate({ id: post.id, caption })} />
                    <div className="flex items-center justify-between gap-2">
                      <Switch checked={post.isPublished} disabled={full} onChange={(isPublished) => update.mutate({ id: post.id, isPublished })}>Home page</Switch>
                      <DeleteButton label="Delete post" onConfirm={() => remove.mutate(post.id)} />
                    </div>
                    {full && <p className="text-xs text-stone-500 dark:text-brand-200">All {HOME_LIMIT} places are used. Switch another post off first.</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </Section>
  );
}
