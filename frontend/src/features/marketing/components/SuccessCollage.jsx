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
    <section className="relative isolate overflow-hidden bg-surface-subtle py-14 sm:py-20 dark:bg-surface-dark">

      <div className="container-page">
        {/* Collage */}
        <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6 lg:flex-nowrap lg:justify-between">
          {TILES.map((tile) => (
            <figure
              key={tile.id}
              className={`shrink-0 overflow-hidden rounded-2xl bg-white border border-stone-200 transition-transform duration-300 hover:z-10 hover:rotate-0 hover:scale-105 ${tile.className}`}
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
            className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl dark:text-white"
            lang="bn"
          >
            আপনার স্বপ্নের পথে আজই এক ধাপ এগিয়ে যান
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-700 sm:text-base dark:text-brand-200" lang="bn">
            সঠিক প্রস্তুতি, expert guidance এবং প্রয়োজনীয় resources নিয়ে আপনার সফলতার যাত্রা শুরু করুন
            CPR-এর সঙ্গে
          </p>

          <div className="mt-8">
            <Button to="/register" className="border border-stone-200">
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
