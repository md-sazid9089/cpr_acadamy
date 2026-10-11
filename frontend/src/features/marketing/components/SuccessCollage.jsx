import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaArrowRight } from 'react-icons/fa6';
import { fetchGallery } from '../api/gallery.api.js';
import PhotoLightbox from './PhotoLightbox.jsx';
import ResponsiveImage, { localWebpSrcSet } from '@/components/ui/ResponsiveImage.jsx';
import { SUCCESS_COLLAGE_SECTION } from '@/constants';
import { cn } from '@/lib/utils';

/** How many posts the collage shows; the admin Upload page lets this many be switched on. */
export const COLLAGE_SIZE = 7;

/**
 * Where each card sits in the scattered collage: x = centre (% across), t = top (% down), r = tilt, z = stacking.
 * The largest card is in the middle; the two `edge` cards hide on small screens.
 */
const SLOTS = [
  { x: 9, t: 22, r: -9, z: 1, size: 's', edge: true },
  { x: 24, t: 2, r: 6, z: 3, size: 'm' },
  { x: 34, t: 44, r: -5, z: 4, size: 's' },
  { x: 50, t: 6, r: -1, z: 6, size: 'l' },
  { x: 66, t: 42, r: 7, z: 5, size: 's' },
  { x: 76, t: 4, r: -6, z: 3, size: 'm' },
  { x: 91, t: 26, r: 9, z: 1, size: 's', edge: true },
];
// The first post takes the big middle card, the next ones fill outwards, the edge cards last.
const FILL_ORDER = [3, 1, 5, 2, 4, 0, 6];
const WIDTHS = {
  s: 'w-[92px] sm:w-[120px] lg:w-[150px]',
  m: 'w-[108px] sm:w-[140px] lg:w-[180px]',
  l: 'w-[140px] sm:w-[180px] lg:w-[220px]',
};

/** Shown until an admin switches on posts in the Success collage (Admin → Upload). */
const DEFAULT_TILES = [
  { id: 'sc-4', src: '/assets/carousel/posterd.jpeg', alt: 'Brilliant success in examination' },
  { id: 'sc-1', src: '/assets/carousel/postera.jpeg', alt: 'FCPS Part-1 success poster' },
  { id: 'sc-2', src: '/assets/carousel/posterb.jpeg', alt: 'Crest awarding program' },
  { id: 'sc-3', src: '/assets/carousel/posterc.jpeg', alt: 'Felicitation of successful doctors' },
  { id: 'sc-5', src: '/assets/carousel/postere.jpeg', alt: 'Celebration of success' },
  { id: 'sc-6', src: '/assets/carousel/posterf.jpeg', alt: 'BCS Health special session' },
  { id: 'sc-7', src: '/assets/spotlight/profilea.png', alt: 'Successful candidate' },
];

/** "Success stories": a scattered collage of result posts that open full size, then the closing call to action. */
export default function SuccessCollage() {
  // Shares the gallery query cache; admins manage these posts on the Upload page.
  const { data: sections = [] } = useQuery({ queryKey: ['marketing', 'gallery'], queryFn: fetchGallery, staleTime: 5 * 60 * 1000 });
  const uploaded = sections.find((group) => group.section === SUCCESS_COLLAGE_SECTION)?.photos ?? [];
  const tiles = (uploaded.length
    ? uploaded.map((photo) => ({ id: photo.id, src: photo.imageUrl, alt: photo.caption || 'সাফল্যের গল্প' }))
    : DEFAULT_TILES
  ).slice(0, COLLAGE_SIZE);
  const [openAt, setOpenAt] = useState(null);

  return (
    <section
      aria-labelledby="success-title"
      className="relative isolate overflow-hidden bg-surface-light py-12 sm:py-16 lg:py-20 dark:bg-surface-dark"
    >
      {/* Same faint dot pattern as the FAQ section. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(var(--color-blue) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        aria-hidden="true"
      />

      <div className="container-page relative z-10 text-center">
        <ul className="relative mx-auto mb-10 h-[270px] max-w-[560px] sm:h-[340px] lg:mb-11 lg:h-[400px] lg:max-w-[900px]">
          {tiles.map((tile, index) => {
            const slot = SLOTS[FILL_ORDER[index]];
            return (
              <li
                key={tile.id}
                className={cn('absolute -translate-x-1/2 hover:!z-20 focus-within:!z-20', slot.edge && 'hidden lg:block')}
                style={{ left: `${slot.x}%`, top: `${slot.t}%`, zIndex: slot.z }}
              >
                <button
                  type="button"
                  onClick={() => setOpenAt(index)}
                  aria-label={`${tile.alt}, বড় করে দেখুন`}
                  style={{ '--tilt': `${slot.r}deg` }}
                  className={cn(
                    'block cursor-zoom-in overflow-hidden rounded-xl border-[3px] border-white bg-white ring-1 ring-stone-200 transition-transform duration-300 [transform:rotate(var(--tilt))]',
                    'hover:[transform:translateY(-8px)_scale(1.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:[transform:translateY(-8px)_scale(1.06)]',
                    'motion-reduce:transition-none sm:rounded-2xl sm:border-[5px] dark:border-surface-dark-subtle dark:bg-surface-dark-subtle',
                    WIDTHS[slot.size],
                  )}
                >
                  <ResponsiveImage
                    src={tile.src}
                    webpSrcSet={localWebpSrcSet(tile.src)}
                    sizes="(min-width: 1024px) 220px, (min-width: 640px) 180px, 140px"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <h2 id="success-title" lang="bn" className="mx-auto max-w-[18ch] text-balance text-3xl font-extrabold leading-tight text-brand-800 sm:text-4xl lg:text-5xl dark:text-white">
          আপনার স্বপ্নের পথে আজই এক ধাপ এগিয়ে যান
        </h2>
        <p lang="bn" className="mx-auto mt-4 max-w-[52ch] text-balance text-base text-stone-600 sm:text-lg dark:text-brand-200">
          সঠিক প্রস্তুতি, বিশেষজ্ঞ শিক্ষকদের নির্দেশনা আর প্রয়োজনীয় সব রিসোর্স নিয়ে CPR-এর সঙ্গে শুরু করুন আপনার সাফল্যের যাত্রা।
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <Link
            to="/register"
            lang="bn"
            className="group inline-flex items-center gap-3 rounded-control bg-accent-500 py-3 pl-6 pr-3 font-heading text-lg font-bold text-white transition-colors hover:bg-accent-600"
          >
            প্রস্তুতি শুরু করুন
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
              <FaArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
          </Link>
          <Link
            to="/gallery"
            lang="bn"
            className="border-b-2 border-brand-200 pb-px font-semibold text-brand-800 transition-colors hover:border-brand-800 dark:border-brand-700 dark:text-brand-200 dark:hover:border-brand-200"
          >
            সব সাফল্যের গল্প দেখুন
          </Link>
        </div>
      </div>

      {openAt !== null && (
        <PhotoLightbox
          photos={tiles.map((tile) => ({ id: tile.id, imageUrl: tile.src, caption: tile.alt }))}
          startIndex={openAt}
          label="সাফল্যের গল্প"
          onClose={() => setOpenAt(null)}
        />
      )}
    </section>
  );
}
