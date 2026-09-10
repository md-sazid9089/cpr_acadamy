import { FaArrowRight } from 'react-icons/fa6';
import Button from '@/components/ui/Button.jsx';

/** Staggered collage tiles: offsets/rotations are tuned for the desktop layout. */
const TILES = [
  { id: 'sc-1', src: '/assets/carousel/postera.jpeg', alt: 'FCPS Part-1 success poster', className: 'w-24 sm:w-32 lg:w-28 -rotate-3 lg:mt-6' },
  { id: 'sc-2', src: '/assets/carousel/posterb.jpeg', alt: 'Crest awarding program', className: 'w-28 sm:w-36 rotate-2' },
  { id: 'sc-3', src: '/assets/carousel/posterc.jpeg', alt: 'Felicitation of successful doctors', className: 'w-24 sm:w-32 lg:w-28 -rotate-2 lg:mt-14' },
  { id: 'sc-4', src: '/assets/carousel/posterd.jpeg', alt: 'Brilliant success in examination', className: 'w-28 sm:w-36 rotate-3 lg:-mt-2' },
  { id: 'sc-5', src: '/assets/carousel/postere.jpeg', alt: 'Celebration of success', className: 'w-24 sm:w-32 lg:w-28 -rotate-3 lg:mt-10' },
  { id: 'sc-6', src: '/assets/carousel/posterf.jpeg', alt: 'BCS Health special session', className: 'w-28 sm:w-36 rotate-2' },
  { id: 'sc-7', src: '/assets/spotlight/profilea.png', alt: 'Successful candidate', className: 'w-24 sm:w-32 lg:w-28 rotate-3 lg:mt-8' },
  { id: 'sc-8', src: '/assets/spotlight/profileb.png', alt: 'Successful candidate', className: 'w-24 sm:w-32 lg:w-28 -rotate-2 lg:mt-2' },
];

/** Collage of success moments with a closing Bengali CTA — sits after the reviews. */
export default function SuccessCollage() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-r from-orange-100 via-emerald-100 to-cyan-200 py-14 sm:py-20 dark:from-orange-950/40 dark:via-emerald-950/40 dark:to-cyan-950/50">
      <div
        className="pointer-events-none absolute -top-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-white/50 blur-3xl dark:bg-white/5"
        aria-hidden="true"
      />

      <div className="container-page">
        {/* Collage */}
        <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6 lg:flex-nowrap lg:justify-between">
          {TILES.map((tile) => (
            <figure
              key={tile.id}
              className={`shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 transition-transform duration-300 hover:z-10 hover:rotate-0 hover:scale-105 ${tile.className}`}
            >
              <img
                src={tile.src}
                alt={tile.alt}
                loading="lazy"
                decoding="async"
                className="aspect-square h-full w-full object-cover"
              />
            </figure>
          ))}
        </div>

        {/* Copy + CTA */}
        <div className="mx-auto mt-12 max-w-2xl text-center sm:mt-16">
          <h2
            className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white"
            lang="bn"
          >
            আপনার স্বপ্নের পথে আজই এক ধাপ এগিয়ে যান
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300" lang="bn">
            সঠিক প্রস্তুতি, expert guidance এবং প্রয়োজনীয় resources নিয়ে আপনার সফলতার যাত্রা শুরু করুন
            CPR-এর সঙ্গে
          </p>

          <div className="mt-8">
            <Button to="/register" size="lg" className="rounded-full px-7 shadow-lg shadow-brand-600/25">
              <span lang="bn">প্রস্তুতি শুরু করুন</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <FaArrowRight className="h-3.5 w-3.5" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
