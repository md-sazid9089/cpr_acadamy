import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRightLong } from 'react-icons/fa6';

const HOMEPAGE_FAQS = [
  {
    id: 1,
    question: 'ডিভাইস ভেরিফিকেশন কিভাবে করব বিস্তারিত জানতে চাই',
    answer:
      'রেজিস্ট্রেশনের পর আপনার প্রদত্ত মোবাইল নম্বরে একটি ৬ ডিজিটের ওটিপি (OTP) পাঠানো হবে। ওটিপি দিয়ে ভেরিফাই করার পর আপনার প্রোফাইল অ্যাক্টিভ হয়ে যাবে। একটি অ্যাকাউন্টে সর্বোচ্চ একটি ডিভাইসে একসাথে লগইন করা যাবে।',
  },
  {
    id: 2,
    question:
      'আপনার ফোনে কি ভিডিও লেকচার দেখতে এবং লেকচার ভিডিও সাউন্ড প্রবলেম হচ্ছে ? সমাধান করুন এখানে-',
    answer:
      'ফোনে ভিডিও প্লেব্যাক বা সাউন্ডে সমস্যা হলে ব্রাউজারের ক্যাশ (Cache) ক্লিয়ার করুন অথবা গুগল ক্রোম (Google Chrome) আপডেট করুন। এছাড়া ইন্টারনেট কানেকশন চেক করে ভিডিও রেজোলিউশন অটো বা ৭২০পি সেট করে দেখতে পারেন।',
  },
  {
    id: 3,
    question: 'অনলাইন ক্লাস বা পরীক্ষাতে সমস্যা ফেস করছেন?',
    answer:
      'লাইভ ক্লাসে জয়েন করতে আপনার ড্যাশবোর্ডের "My Courses" থেকে নির্দিষ্ট ব্যাচের "Live Class" লিঙ্কে ক্লিক করুন। পরীক্ষা চলাকালীন অটো-সেভ সুবিধা থাকে, কোনো কারণে ডিসকানেক্ট হলেও নির্ধারিত সময়ের মধ্যে পুনরায় প্রবেশ করে পরীক্ষা সম্পন্ন করতে পারবেন।',
  },
  {
    id: 4,
    question: 'Details of "System Driven" study method.',
    answer:
      'The "System Driven" study method focuses on organ-system based integration (e.g. CVS, Respiratory, Renal) covering anatomy, physiology, pathology, pharmacology, and previous BCPS questions in a single cohesive track for maximum retention.',
  },
  {
    id: 5,
    question: 'শিডিউল থেকে লেকচার এবং এক্সাম দেওয়ার নিয়মাবলী',
    answer:
      'ড্যাশবোর্ড থেকে "My Courses" এ গিয়ে "View Schedule" বাটনে ক্লিক করলে আপনার ব্যাচের সম্পূর্ণ রুটিন ও পরীক্ষার তালিকা দেখতে পাবেন। পরীক্ষার দিন নির্দিষ্ট সময়ে "Take Exam" অপশন সক্রিয় হবে।',
  },
];

export default function FaqSection() {
  const [openId, setOpenId] = useState(null);

  const toggleFaq = (id) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-100/50 via-white to-brand-50/60 py-16 dark:from-slate-900/60 dark:via-surface-dark dark:to-slate-900/50">
      {/* Background medical plus pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(#4338ca 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      <div className="container-page relative z-10 max-w-5xl">
        {/* ── Section Header ── */}
        <div className="text-center">
          <h2
            className="text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl lg:text-4xl dark:text-white"
            lang="bn"
          >
            আপনার প্রশ্নগুলির উত্তর
          </h2>
          <p
            className="mx-auto mt-2.5 max-w-xl text-sm font-medium text-slate-600 sm:text-base dark:text-slate-400"
            lang="bn"
          >
            সচরাচর যেসব প্রশ্ন আমাদের সেবাগ্রহিতাগণ করে থাকেন
          </p>
        </div>

        {/* ── FAQ List ── */}
        <div className="mt-10 space-y-3.5">
          {HOMEPAGE_FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 dark:bg-surface-dark-subtle ${
                  isOpen
                    ? 'border-brand-500 shadow-md ring-1 ring-brand-400/30'
                    : 'border-slate-200/90 hover:border-brand-300 dark:border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    {/* Active blue indicator bar */}
                    <div
                      className={`h-5 w-1 rounded-full transition-colors ${
                        isOpen ? 'bg-brand-600' : 'bg-transparent'
                      }`}
                    />
                    <span
                      className="text-sm font-bold text-slate-800 sm:text-base dark:text-slate-100"
                      lang="bn"
                    >
                      {faq.question}
                    </span>
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors group-hover:text-brand-600 sm:text-sm dark:text-slate-400">
                    <span className="hidden sm:inline">উত্তর দেখুন</span>
                    <FaArrowRightLong
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-90 text-brand-600' : 'text-slate-400'
                      }`}
                    />
                  </span>
                </button>

                {/* Collapsible Answer */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs leading-relaxed text-slate-700 sm:text-sm sm:px-7 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                    <p lang="bn">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Bottom CTA Button ── */}
        <div className="mt-10 text-center">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-700 hover:shadow-lg"
          >
            <span>সকল প্রশ্ন দেখুন</span>
            <FaArrowRightLong className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
