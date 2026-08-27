import { useState } from 'react';
import { FaXmark, FaMagnifyingGlassPlus } from 'react-icons/fa6';

const FEATURED_HERO_PHOTOS = [
  {
    id: 'hero-1',
    src: '/assets/carousel/postera.jpeg',
    alt: 'CPR Medical Academy — Annual Felicitation Ceremony',
  },
  {
    id: 'hero-2',
    src: '/assets/carousel/posterb.jpeg',
    alt: 'CPR Medical Academy — Paediatrics & Medicine Achievers',
  },
];

const GALLERY_PHOTOS = [
  {
    id: 'gp-1',
    src: '/assets/carousel/postera.jpeg',
    alt: 'FCPS P-I Brilliant Success in FCPS & Residency',
  },
  {
    id: 'gp-2',
    src: '/assets/carousel/posterb.jpeg',
    alt: 'Crest Awarding & Mentor Felicitation Program',
  },
  {
    id: 'gp-3',
    src: '/assets/carousel/posterc.jpeg',
    alt: 'Warm Felicitation for Successful Doctors',
  },
  {
    id: 'gp-4',
    src: '/assets/carousel/posterd.jpeg',
    alt: 'Brilliant Success in July & January Examination',
  },
  {
    id: 'gp-5',
    src: '/assets/carousel/postere.jpeg',
    alt: 'Celebration of Success — Mentors and Candidates',
  },
  {
    id: 'gp-6',
    src: '/assets/carousel/posterf.jpeg',
    alt: 'BCS Health Special Session & Keynote Address',
  },
  {
    id: 'gp-7',
    src: '/assets/carousel/postera.jpeg',
    alt: 'Warm Felicitation FCPS Part-1 Doctors',
  },
  {
    id: 'gp-8',
    src: '/assets/carousel/posterb.jpeg',
    alt: 'Interactive Seminar & Orientation Classroom Hall',
  },
  {
    id: 'gp-9',
    src: '/assets/carousel/posterc.jpeg',
    alt: 'Surgery Batch Achievers Group Photo',
  },
  {
    id: 'gp-10',
    src: '/assets/carousel/posterd.jpeg',
    alt: 'Paediatrics Achievers Batch & Faculty',
  },
  {
    id: 'gp-11',
    src: '/assets/carousel/postere.jpeg',
    alt: 'Obs & Gynae Candidates Felicitation',
  },
  {
    id: 'gp-12',
    src: '/assets/carousel/posterf.jpeg',
    alt: 'Celebration of Success — Special Honors Ceremony',
  },
];

/** Lightbox modal */
function Lightbox({ image, onClose }) {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
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
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
      >
        <FaXmark className="h-6 w-6" />
      </button>

      <div className="flex max-h-[90vh] max-w-5xl flex-col items-center">
        <img
          src={image.src}
          alt={image.alt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/20"
        />
        <p className="mt-3 text-center text-sm font-medium text-white/90">
          {image.alt}
        </p>
      </div>
    </div>
  );
}

export default function Gallery() {
  const [lightboxImage, setLightboxImage] = useState(null);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-dark">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: Photo Gallery Header + Dual Hero Banner
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50/50 via-blue-50/30 to-purple-50/40 py-12 sm:py-16 dark:from-slate-900/60 dark:via-surface-dark dark:to-slate-900/50">
        {/* Background watermark grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(#4338ca 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />

        <div className="container-page relative z-10">
          {/* Main Title */}
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1c3d5a] sm:text-4xl lg:text-5xl dark:text-white">
              Photo Gallery
            </h1>
          </div>

          {/* Featured Dual-Hero Photo Showcase */}
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURED_HERO_PHOTOS.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxImage(photo)}
                className="group relative overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-slate-700"
              >
                <div className="aspect-[4/3] w-full overflow-hidden sm:aspect-[3/4]">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="text-left text-xs font-semibold text-white sm:text-sm">
                    {photo.alt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: 4-Column Photo Gallery on Cyan/Turquoise Background
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#179ab5] via-[#1bb5cf] to-[#148ba4] py-12 sm:py-16 shadow-inner">
        {/* Soft decorative background circles */}
        <div
          className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="container-page relative z-10">
          {/* 4-Column Photo Grid (12 items) */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {GALLERY_PHOTOS.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxImage(photo)}
                className="group relative overflow-hidden rounded-xl border-2 border-white/40 bg-white/10 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:rounded-2xl"
              >
                <div className="aspect-[16/11] w-full overflow-hidden bg-slate-900/40">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Hover overlay with zoom icon and title */}
                <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex justify-end">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow">
                      <FaMagnifyingGlassPlus className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="text-left text-xs font-bold text-white line-clamp-2">
                    {photo.alt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
