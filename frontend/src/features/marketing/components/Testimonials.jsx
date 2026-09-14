import { FaQuoteRight, FaStar } from 'react-icons/fa6';

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

export default function Testimonials() {
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

          {/* Horizontal scroll on mobile (in a row) with Facebook poster ratio / Grid on desktop */}
          <div className="mt-8 flex gap-4 overflow-x-auto px-4 pb-4 pt-2 snap-x snap-mandatory scroll-smooth sm:mt-10 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0">
            {WRITTEN_REVIEWS.map((review) => (
              <div
                key={review.id}
                className={`group flex w-[78vw] max-w-[280px] shrink-0 snap-center flex-col justify-between rounded-2xl border ${review.borderColor} bg-white p-5 border border-stone-200 transition-all duration-300 hover:-translate-y-1 dark:bg-surface-dark-subtle aspect-[4/5] sm:aspect-auto sm:w-auto sm:max-w-none`}
              >
                <div>
                  {/* Rating Stars & Quote Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-brand-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                      ))}
                    </div>
                    <FaQuoteRight className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                  </div>

                  {/* Quote Body */}
                  <p
                    className="mt-3.5 text-xs leading-relaxed text-stone-600 sm:text-[13px] line-clamp-6 sm:line-clamp-none dark:text-brand-200"
                    lang="bn"
                  >
                    "{review.quote}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="mt-4 flex items-center gap-3 border-t border-stone-200 pt-3.5 dark:border-stone-200">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white border border-stone-200">
                    {review.avatarText}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-brand-900 sm:text-sm dark:text-white">
                      {review.name}
                    </h3>
                    <p className="text-[11px] text-stone-600 dark:text-brand-200">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="mt-6 flex justify-center gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-200" />
            <span className="h-1.5 w-6 rounded-full bg-brand-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-200" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-200" />
          </div>
        </div>
      </div>
    </section>
  );
}
