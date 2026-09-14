import { Link } from 'react-router-dom';
import { FaArrowRightLong } from 'react-icons/fa6';

const TRACK_CARDS = [
  {
    id: 'fcps',
    badge: 'FCPS',
    headline: 'FCPS Part-1 ও Residency-র প্রস্তুতি নিতে চান?',
    subtitle: 'Phase A & B, Combined Batch — Online & Offline',
    cta: 'See Batches',
    ctaTo: '/batches?group=fcps-p1-medicine',
  },
  {
    id: 'bcs',
    badge: 'BCS Health',
    illustration: '/assets/bg/Doctors-amico.svg',
    headline: 'আপনি কি বিসিএস নিয়ে ভাবছেন?',
    subtitle: 'BCS (Health) written & viva preparation',
    cta: 'See Batches',
    ctaTo: '/batches',
  },
  {
    id: 'mbbs',
    badge: 'MBBS',
    illustration: '/assets/bg/Medical%20prescription-amico.svg',
    headline: 'MBBS Professional পরীক্ষার প্রস্তুতি নিন',
    subtitle: '1st–4th professional exam coaching',
    cta: 'See Batches',
    ctaTo: '/batches?group=bmdc-licensing',
  },
  {
    id: 'guidance',
    badge: 'Career',
    illustration: '/assets/bg/Online%20Doctor-rafiki.svg',
    headline: 'ক্যারিয়ার গাইডলাইন নিয়ে চিন্তিত?',
    subtitle: 'Free consultation with our expert mentors',
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
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-40 dark:opacity-20"
      />
      <div className="container-page">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 sm:gap-6">
          {TRACK_CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.ctaTo}
              className="group relative grid min-h-[260px] grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-[6px] rounded-tl-[44px] rounded-br-[44px] border border-emerald-100 bg-[linear-gradient(115deg,#e5fff7_0%,#efffe9_55%,#cff7e2_100%)] p-5 transition-shadow duration-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 sm:min-h-[300px] sm:gap-5 sm:p-8 xl:p-10"
            >
              <div className="relative z-10 flex min-w-0 flex-col items-start">
                <span className="rounded-full bg-[#ff3f87] px-3 py-1 text-xs font-bold leading-none text-white">
                  {card.badge}
                </span>

                <h3
                  className="mt-4 text-lg font-extrabold leading-snug tracking-normal text-[#143b81] sm:text-xl xl:text-2xl"
                  lang="bn"
                >
                  {card.headline}
                </h3>

                {card.subtitle && (
                  <p className="mt-2 text-xs leading-relaxed text-[#365574] sm:text-sm">
                    {card.subtitle}
                  </p>
                )}

                <span className="mt-5 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-md border border-[#19479c] bg-[linear-gradient(135deg,#2452ad,#347deb)] px-3 py-2 text-xs font-semibold text-white transition-shadow group-hover:shadow-md sm:mt-6 sm:px-4 sm:text-sm">
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
                className="pointer-events-none aspect-square w-full object-contain"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
