import { Link } from 'react-router-dom';
import { FaArrowRightLong } from 'react-icons/fa6';

const TRACK_CARDS = [
  {
    id: 'fcps',
    badge: 'FCPS',
    headline: 'FCPS Part-1 ও Residency-র প্রস্তুতি নিতে চান?',
    cta: 'See Batches',
    ctaTo: '/batches?group=fcps-p1-medicine',
  },
  {
    id: 'bcs',
    badge: 'BCS Health',
    illustration: '/assets/bg/Doctors-amico.svg',
    headline: 'আপনি কি বিসিএস নিয়ে ভাবছেন?',
    cta: 'See Batches',
    ctaTo: '/batches',
  },
  {
    id: 'mbbs',
    badge: 'MBBS',
    illustration: '/assets/bg/Medical%20prescription-amico.svg',
    headline: 'MBBS Professional পরীক্ষার প্রস্তুতি নিন',
    cta: 'See Batches',
    ctaTo: '/batches?group=bmdc-licensing',
  },
  {
    id: 'guidance',
    badge: 'Career',
    illustration: '/assets/bg/Online%20Doctor-rafiki.svg',
    headline: 'ক্যারিয়ার গাইডলাইন নিয়ে চিন্তিত?',
    cta: 'পরামর্শ নিন',
    ctaTo: '/contact',
  },
];

export default function TrackPromos() {
  return (
    <section className="relative isolate overflow-hidden bg-surface-subtle py-10 sm:py-14 dark:bg-surface-dark">
      <img
        src="/assets/bg/1103999_7626-1920.webp"
        srcSet="/assets/bg/1103999_7626-768.webp 768w, /assets/bg/1103999_7626-1920.webp 1920w"
        sizes="100vw"
        loading="lazy"
        decoding="async"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-40 dark:opacity-20"
      />
      <div className="container-page">
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {TRACK_CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.ctaTo}
              className="group relative grid grid-cols-1 items-center gap-1.5 overflow-hidden rounded-[6px] rounded-tl-[44px] rounded-br-[44px] border border-blue-100 bg-[linear-gradient(115deg,var(--blue-50)_0%,var(--n-50)_55%,var(--blue-100)_100%)] p-3 transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 sm:min-h-[300px] sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] sm:gap-5 sm:p-8 xl:p-10"
            >
              <div className="relative z-10 flex min-w-0 flex-col items-start">
                <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold leading-none text-white">
                  {card.badge}
                </span>

                <h3
                  className="mt-2 text-sm font-extrabold leading-snug tracking-normal text-blue-800 sm:mt-4 sm:text-xl xl:text-2xl"
                  lang="bn"
                >
                  {card.headline}
                </h3>

                <span className="mt-2 inline-flex min-h-8 max-w-full items-center justify-center gap-2 rounded-md border border-blue-700 bg-[linear-gradient(135deg,var(--blue-700),var(--blue-400))] px-2.5 py-1 text-xs font-semibold text-white transition-transform group-hover:translate-x-0.5 sm:mt-6 sm:min-h-11 sm:px-4 sm:py-2 sm:text-sm">
                  <span>{card.cta}</span>
                  <FaArrowRightLong aria-hidden="true" className="h-3 w-3 shrink-0" />
                </span>
              </div>
              <img
                src={card.illustration ?? '/assets/bg/Medicine-amico.svg'}
                alt=""
                aria-hidden="true"
                width={500}
                height={500}
                loading="lazy"
                decoding="async"
                className="pointer-events-none mx-auto aspect-square w-14 object-contain sm:mx-0 sm:w-full"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
