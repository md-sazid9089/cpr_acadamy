import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useEmblaCarousel from 'embla-carousel-react';
import { FaQuoteRight, FaStar } from 'react-icons/fa6';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { fetchHomeReviews } from '../api/siteMedia.api.js';

/** Fallback while the admin-managed list loads or if it cannot be reached (Admin → Reviews → Home page reviews). */

const WRITTEN_REVIEWS = [
  {
    id: 'wr-1',
    name: 'Nazmul Hasan',
    role: 'Student, BCS Health',
    avatarText: 'NH',
    borderColor: 'border-stone-200',
    glowColor: 'hover:border-stone-200',
    quote:
      '৪০ দিনের প্রিপারেশন নিয়েছিলাম। প্রশ্ন কমন পড়ার চেয়ে বেশি জরুরি কনসেপ্ট ক্লিয়ার থাকা। CPR এর প্রশ্নব্যাংক এবং নিয়মিত মক টেস্টের সল্ভ ক্লাস আমাকে কনফিডেন্স দিয়েছিল।',
  },
  {
    id: 'wr-2',
    name: 'Tasmiah B. Mimi',
    role: 'Student, FCPS Part-1',
    avatarText: 'TM',
    borderColor: 'border-stone-200',
    glowColor: 'hover:border-stone-200',
    quote:
      'লেকচারগুলো এতটাই তথ্যবহুল ছিল যে বই পড়ার অতিরিক্ত চাপ নিতে হয়নি। বিশেষ করে আইটেম অ্যানালাইসিস এবং উইকলি টেস্ট আমার দুর্বল জায়গাগুলো চিহ্নিত করতে সাহায্য করেছে।',
  },
  {
    id: 'wr-3',
    name: 'জান্নাতুল ফেরদৌস নদীয়া',
    role: 'Student, Residency',
    avatarText: 'JN',
    borderColor: 'border-stone-200',
    glowColor: 'hover:border-stone-200',
    quote:
      'রেসিডেন্সি ভর্তি পরীক্ষায় চান্স পাওয়া আমার জন্য স্বপ্ন ছিল। CPR এর সুপরিকল্পিত রুটিন এবং মেন্টরদের সার্বক্ষণিক গাইডলাইন ছাড়া এটা কখনোই সম্ভব হতো না। অসংখ্য ধন্যবাদ CPR টিমকে।',
  },
  {
    id: 'wr-4',
    name: 'Syeda Fatema Alam',
    role: 'Student, FCPS & BCS',
    avatarText: 'SF',
    borderColor: 'border-stone-200',
    glowColor: 'hover:border-stone-200',
    quote:
      'সবচেয়ে ইতিবাচক ব্যাপার হচ্ছে তাদের পরীক্ষা নেওয়ার পদ্ধতি। নিয়মিত পরীক্ষা দেওয়ার কারণে মূল পরীক্ষার ভয় একেবারেই কেটে গিয়েছিল। সবার জন্য শুভকামনা।',
  },
];

/** Two letters for the avatar circle: the first letters of the first two words of the name. */
function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((word) => [...word][0]).join('').toUpperCase();
}

/** Autoplay delay between review steps. */
const REVIEW_INTERVAL_MS = 6000;

/**
 * Reviews in a single row that slides one card at a time (1 card on phones, 2 on tablets, 3 on desktop).
 * The dots under it are buttons: one per review, each jumps straight to that card. Autoplay pauses while the
 * pointer or keyboard focus is inside, and is off for visitors who prefer reduced motion.
 */
function ReviewCarousel({ reviews }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 });
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (!emblaApi) return undefined;
    const sync = () => {
      setSnapCount(emblaApi.scrollSnapList().length);
      setSelected(emblaApi.selectedScrollSnap());
    };
    sync();
    emblaApi.on('select', sync);
    emblaApi.on('reInit', sync);
    return () => {
      emblaApi.off('select', sync);
      emblaApi.off('reInit', sync);
    };
  }, [emblaApi]);

  // The list can change while the page is open (an admin edits it), so rebuild the carousel when it does.
  useEffect(() => { emblaApi?.reInit(); }, [emblaApi, reviews.length]);

  useEffect(() => {
    if (!emblaApi || paused || reducedMotion || snapCount < 2) return undefined;
    const id = setInterval(() => emblaApi.scrollNext(), REVIEW_INTERVAL_MS);
    return () => clearInterval(id);
  }, [emblaApi, paused, reducedMotion, snapCount]);

  return (
    <div
      className="mt-8 sm:mt-10"
      role="region"
      aria-roledescription="carousel"
      aria-label="Student reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${reviews.length}`}
              className="min-w-0 flex-[0_0_100%] pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.3333%]"
            >
              <div className="flex h-full flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 dark:bg-surface-dark-subtle">
                <div>
                  {/* Rating Stars & Quote Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1" role="img" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} aria-hidden="true" className={`h-3.5 w-3.5 fill-current ${i < review.rating ? 'text-brand-400' : 'text-stone-200 dark:text-brand-800'}`} />
                      ))}
                    </div>
                    <FaQuoteRight aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                  </div>

                  {/* Quote Body */}
                  <p className="mt-3.5 text-[13px] leading-relaxed text-stone-600 sm:text-sm dark:text-brand-200" lang="bn">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                </div>

                {/* Author Info */}
                <div className="mt-4 flex items-center gap-3 border-t border-stone-200 pt-3.5 dark:border-stone-200">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white border border-stone-200">
                    {review.avatarText}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-brand-900 dark:text-white">{review.name}</h3>
                    {review.role && <p className="text-[11px] text-stone-600 dark:text-brand-200">{review.role}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {snapCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {Array.from({ length: snapCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to review ${index + 1}`}
              aria-current={index === selected}
              className={`flex h-6 items-center justify-center px-0.5`}
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  index === selected ? 'w-6 bg-brand-500' : 'w-1.5 bg-brand-200 hover:bg-brand-300 dark:bg-brand-800 dark:hover:bg-brand-700'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Testimonials() {
  const { data } = useQuery({ queryKey: ['marketing', 'home-reviews'], queryFn: fetchHomeReviews, staleTime: 5 * 60 * 1000 });
  const reviews = data
    ? data.map((review) => ({ ...review, avatarText: initials(review.name), borderColor: 'border-stone-200' }))
    : WRITTEN_REVIEWS.map((review) => ({ rating: 5, ...review }));
  // The admin switched every review off: leave the section out rather than show an empty heading.
  if (!reviews.length) return null;

  return (
    <section className="relative overflow-hidden bg-surface-light py-16 text-stone-800 sm:py-20 dark:bg-surface-dark dark:text-brand-200">

      <div className="container-page relative z-10 space-y-16 sm:space-y-20">
        {/* ═══════════════════════════════════════════════════════════════
            Written Student Reviews (শিক্ষার্থীদের বিশ্বাসের গল্প!)
            ═══════════════════════════════════════════════════════════════ */}
        <div>
          {/* Header */}
          <div className="text-center">
            <h2
              className="text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl lg:text-4xl dark:text-white"
              lang="bn"
            >
              শিক্ষার্থীদের বিশ্বাসের গল্প!
            </h2>
            <p
              className="mt-2 text-xs font-medium text-stone-600 sm:text-sm dark:text-brand-200"
              lang="bn"
            >
              CPR কেন হাজারো পরীক্ষার্থী চিকিৎসকের প্রথম পছন্দ?
            </p>
          </div>

          <ReviewCarousel reviews={reviews} />
        </div>
      </div>
    </section>
  );
}
