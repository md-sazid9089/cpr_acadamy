import { useState } from 'react';
import { FaPlay, FaQuoteRight, FaStar } from 'react-icons/fa6';

const VIDEO_STORIES = [
  {
    id: 'vs-1',
    image: '/assets/spotlight/profilea.png',
    quote: '২/৩ মাস আগেও কল্পনা করিনি আমি ক্যাডার হবো!',
    tag: 'BCS (Health) Cadre',
    name: 'Dr. Nazmul Hasan',
  },
  {
    id: 'vs-2',
    image: '/assets/spotlight/profilea.png',
    quote: 'মেন্টরদের সঠিক গাইডলাইনেই প্রথমবার FCPS Part-1 ক্লিয়ার করেছি!',
    tag: 'FCPS Part-1 (Medicine)',
    name: 'Dr. Tasmiah Mimi',
  },
  {
    id: 'vs-3',
    image: '/assets/spotlight/profilea.png',
    quote: 'আল্লাহর ইচ্ছা আর CPR এর উছিলায় প্রথম বিসিএস এ ক্যাডার হয়েছি।',
    tag: '42nd BCS Health',
    name: 'Dr. Mahmudul Islam',
  },
  {
    id: 'vs-4',
    image: '/assets/spotlight/profilea.png',
    quote: 'সাফল্যের গল্প — নিয়মিত এক্সাম ও প্র্যাকটিসই সাফল্যের চাবিকাঠি।',
    tag: 'BCS Health, 42nd BCS',
    name: 'Dr. Jesmin Jui',
  },
];

const WRITTEN_REVIEWS = [
  {
    id: 'wr-1',
    name: 'Nazmul Hasan',
    role: 'Student, BCS Health',
    avatarText: 'NH',
    borderColor: 'border-brand-400/60',
    glowColor: 'hover:border-brand-300',
    quote:
      '৪০ দিনের প্রিপারেশন নিয়েছিলাম। প্রশ্ন কমন পড়ার চেয়ে বেশি জরুরি কনসেপ্ট ক্লিয়ার থাকা। CPR এর প্রশ্নব্যাংক এবং নিয়মিত মক টেস্টের সল্ভ ক্লাস আমাকে কনফিডেন্স দিয়েছিল।',
  },
  {
    id: 'wr-2',
    name: 'Tasmiah B. Mimi',
    role: 'Student, FCPS Part-1',
    avatarText: 'TM',
    borderColor: 'border-accent-500/60',
    glowColor: 'hover:border-accent-400',
    quote:
      'লেকচারগুলো এতটাই তথ্যবহুল ছিল যে বই পড়ার অতিরিক্ত চাপ নিতে হয়নি। বিশেষ করে আইটেম অ্যানালাইসিস এবং উইকলি টেস্ট আমার দুর্বল জায়গাগুলো চিহ্নিত করতে সাহায্য করেছে।',
  },
  {
    id: 'wr-3',
    name: 'জান্নাতুল ফেরদৌস নদীয়া',
    role: 'Student, Residency',
    avatarText: 'JN',
    borderColor: 'border-brand-500/60',
    glowColor: 'hover:border-brand-400',
    quote:
      'রেসিডেন্সি ভর্তি পরীক্ষায় চান্স পাওয়া আমার জন্য স্বপ্ন ছিল। CPR এর সুপরিকল্পিত রুটিন এবং মেন্টরদের সার্বক্ষণিক গাইডলাইন ছাড়া এটা কখনোই সম্ভব হতো না। অসংখ্য ধন্যবাদ CPR টিমকে।',
  },
  {
    id: 'wr-4',
    name: 'Syeda Fatema Alam',
    role: 'Student, FCPS & BCS',
    avatarText: 'SF',
    borderColor: 'border-accent-400/60',
    glowColor: 'hover:border-accent-300',
    quote:
      'সবচেয়ে ইতিবাচক ব্যাপার হচ্ছে তাদের পরীক্ষা নেওয়ার পদ্ধতি। নিয়মিত পরীক্ষা দেওয়ার কারণে মূল পরীক্ষার ভয় একেবারেই কেটে গিয়েছিল। সবার জন্য শুভকামনা।',
  },
];

export default function Testimonials() {
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <section className="relative overflow-hidden bg-brand-950 py-16 sm:py-20 text-white">
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-10 h-[400px] w-[600px] rounded-full bg-brand-600/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container-page relative z-10 space-y-16 sm:space-y-20">
        {/* ═══════════════════════════════════════════════════════════════
            PART 1: Video Stories / Achievers Banner (কৃতীদের কণ্ঠে সাফল্যের গল্প)
            ═══════════════════════════════════════════════════════════════ */}
        <div>
          {/* Header */}
          <div className="text-center">
            <span className="inline-block rounded-full bg-brand-600/80 px-4 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              স্বপ্ন থেকে সাফল্যের যাত্রা
            </span>
            <h2
              className="mt-3.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl"
              lang="bn"
            >
              কৃতীদের কণ্ঠে সাফল্যের গল্প
            </h2>
          </div>

          {/* Horizontal scroll on mobile (in a row) / Grid on desktop */}
          <div className="mt-8 flex gap-4 overflow-x-auto px-4 pb-4 pt-2 snap-x snap-mandatory scroll-smooth sm:mt-10 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0">
            {VIDEO_STORIES.map((story) => (
              <div
                key={story.id}
                onClick={() => setSelectedVideo(story)}
                className="group relative flex w-[78vw] max-w-[280px] shrink-0 snap-center cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-brand-500/10 aspect-[4/5] sm:aspect-auto sm:w-auto sm:max-w-none sm:min-h-[230px]"
              >
                {/* Photo & Tag Header */}
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-brand-400 bg-slate-800 shadow-md">
                    <img
                      src={story.image}
                      alt={story.name}
                      className="h-full w-full object-cover object-top"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <FaPlay className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>

                  <div>
                    <span className="inline-block rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold text-brand-300">
                      {story.tag}
                    </span>
                    <h3 className="text-xs font-bold text-white sm:text-sm">
                      {story.name}
                    </h3>
                  </div>
                </div>

                {/* Quote in white box */}
                <div className="my-auto rounded-xl bg-white/95 p-3.5 text-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
                  <p className="text-xs font-extrabold leading-snug sm:text-sm" lang="bn">
                    "{story.quote}"
                  </p>
                </div>

                {/* Play Button Indicator */}
                <div className="flex items-center justify-between text-xs font-semibold text-brand-300">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                      <FaPlay aria-hidden="true" className="h-2 w-2" />
                    </span>
                    ভিডিও দেখুন
                  </span>
                  <span className="text-[10px] text-white/50">CPR Academy</span>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="mt-6 flex justify-center gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-6 rounded-full bg-brand-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            PART 2: Written Student Reviews (শিক্ষার্থীদের বিশ্বাসের গল্প!)
            ═══════════════════════════════════════════════════════════════ */}
        <div>
          {/* Header */}
          <div className="text-center">
            <h2
              className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl"
              lang="bn"
            >
              শিক্ষার্থীদের বিশ্বাসের গল্প!
            </h2>
            <p
              className="mt-2 text-xs font-medium text-slate-400 sm:text-sm"
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
                className={`group flex w-[78vw] max-w-[280px] shrink-0 snap-center flex-col justify-between rounded-2xl border ${review.borderColor} bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.1] aspect-[4/5] sm:aspect-auto sm:w-auto sm:max-w-none`}
              >
                <div>
                  {/* Rating Stars & Quote Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                      ))}
                    </div>
                    <FaQuoteRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                  </div>

                  {/* Quote Body */}
                  <p
                    className="mt-3.5 text-xs leading-relaxed text-slate-300 sm:text-[13px] line-clamp-6 sm:line-clamp-none"
                    lang="bn"
                  >
                    "{review.quote}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white shadow-sm">
                    {review.avatarText}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white sm:text-sm">
                      {review.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="mt-6 flex justify-center gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-1.5 w-6 rounded-full bg-brand-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    </section>
  );
}
