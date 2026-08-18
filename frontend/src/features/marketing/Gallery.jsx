import { useState } from 'react';

/**
 * Gallery images organised by category.
 *
 * TODO: source from GET /gallery once the backend exists. For now the images
 * are served from `public/assets/gallery/` — drop photos there and update
 * the arrays below.
 */
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'campus', label: 'Campus' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'events', label: 'Events' },
  { id: 'success', label: 'Success Stories' },
];

const GALLERY_ITEMS = [
  {
    id: 'g-1',
    src: '/assets/carousel/postera.jpeg',
    alt: 'CPR Medical Academy — Chattogram campus',
    category: 'campus',
  },
  {
    id: 'g-2',
    src: '/assets/carousel/posterb.jpeg',
    alt: 'Regular and exam batch faculties',
    category: 'classroom',
  },
  {
    id: 'g-3',
    src: '/assets/carousel/posterc.jpeg',
    alt: 'Residency March 2027 long batch',
    category: 'events',
  },
  {
    id: 'g-4',
    src: '/assets/carousel/posterd.jpeg',
    alt: 'FCPS Part-1 & Residency combined batch',
    category: 'classroom',
  },
  {
    id: 'g-5',
    src: '/assets/carousel/postere.jpeg',
    alt: 'Why CPR — academy, library & bookshop',
    category: 'campus',
  },
  {
    id: 'g-6',
    src: '/assets/carousel/posterf.jpeg',
    alt: 'Success stories — students who passed FCPS & BCS',
    category: 'success',
  },
];

/** Lightbox modal — shows a full-size image with close on overlay click or Esc. */
function Lightbox({ image, onClose }) {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <img
        src={image.src}
        alt={image.alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxImage, setLightboxImage] = useState(null);

  const filtered =
    activeCategory === 'all'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <>
      <section className="bg-white py-14 dark:bg-surface-dark">
        <div className="container-page">
          {/* Header */}
          <div className="text-center">
            <span className="inline-block rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
              Gallery
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Our Gallery
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500 dark:text-slate-400">
              A glimpse into campus life, classroom sessions, events, and the
              success stories of our students.
            </p>
          </div>

          {/* Category filter tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors ' +
                  (activeCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700')
                }
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Image grid */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxImage(item)}
                className="group relative overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="w-full px-4 pb-4 text-left text-sm font-medium text-white">
                    {item.alt}
                  </p>
                </div>
                {/* Zoom icon */}
                <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-700 opacity-0 shadow backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <p className="mt-16 text-center text-slate-400 dark:text-slate-500">
              No photos in this category yet.
            </p>
          )}
        </div>
      </section>

      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </>
  );
}
