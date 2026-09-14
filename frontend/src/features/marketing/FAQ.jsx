import { useState } from 'react';
import Card from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import { cn } from '@/lib/utils';

// TODO: move to GET /faqs so the admin panel can edit these.
const FAQ_GROUPS = [
  {
    group: 'ভর্তি ও অ্যাকাউন্ট',
    items: [
      {
        q: 'আমি কীভাবে অ্যাকাউন্ট তৈরি করব?',
        a: 'আপনার মোবাইল নম্বর দিয়ে রেজিস্ট্রেশন করুন। এসএমএসে আপনি একটি ৬-সংখ্যার OTP পাবেন। ভেরিফিকেশনের পর আমাদের টিম রেজিস্ট্রেশনটি পর্যালোচনা করে — অ্যাডমিনিস্ট্রেটর অনুমোদন দিলে অ্যাকাউন্ট সক্রিয় হয়, সাধারণত কয়েক কর্মঘণ্টার মধ্যে।',
      },
      {
        q: 'আমার অ্যাকাউন্টে "অনুমোদনের অপেক্ষায়" দেখাচ্ছে কেন?',
        a: 'প্রতিটি নতুন রেজিস্ট্রেশন আপনার দেওয়া তথ্যের (নাম, BMDC নম্বর, প্রতিষ্ঠান) সাথে ম্যানুয়ালি যাচাই করা হয়। এটি শেয়ার করা ও প্রতারণামূলক অ্যাকাউন্ট প্রতিরোধ করে। অ্যাকাউন্ট সক্রিয় হলেই আপনি এসএমএস পাবেন।',
      },
      {
        q: 'আমি একাধিক ডিভাইস থেকে লগইন করতে পারব কি?',
        a: 'না। প্রতিটি অ্যাকাউন্টে একবারে একটি সক্রিয় সেশন থাকতে পারে। নতুন ডিভাইসে সাইন ইন করলে অন্য সব জায়গা থেকে স্বয়ংক্রিয়ভাবে সাইন আউট হয়ে যাবেন — এটি আমাদের লেকচার সামগ্রী শেয়ার হওয়া থেকে রক্ষা করে।',
      },
    ],
  },
  {
    group: 'কোর্স ও ক্লাস',
    items: [
      {
        q: 'ক্লাসগুলো লাইভ কি রেকর্ডেড?',
        a: 'দুটোই। মূল লেকচারগুলো রেকর্ডেড, যাতে আপনি ডিউটি রোস্টারের সাথে মিলিয়ে পড়তে পারেন, এবং প্রতিটি কোর্সে প্রতি সপ্তাহে লাইভ প্রবলেম-সলভিং ও ডাউট-ক্লিয়ারিং সেশন হয়। লাইভ সেশনগুলোও রেকর্ড করে আপনার লাইব্রেরিতে যুক্ত করা হয়।',
      },
      {
        q: 'কোর্সে আমার অ্যাক্সেস কতদিন থাকবে?',
        a: 'আপনি যে ব্যাচে ভর্তি হয়েছেন, সেই ব্যাচের পরীক্ষার তারিখ পর্যন্ত অ্যাক্সেস থাকবে। পরের সাইকেলে পিছিয়ে গেলে হ্রাসকৃত ফিতে মেয়াদ বাড়ানো যায়।',
      },
      {
        q: 'আমি লেকচার নোট ডাউনলোড করতে পারব কি?',
        a: 'নোটগুলো অ্যাপের ভেতরে একটি সুরক্ষিত ভিউয়ারে পড়া যায় এবং আপনার অ্যাকাউন্টের তথ্য দিয়ে ওয়াটারমার্ক করা থাকে। নির্দিষ্ট কোর্সে প্রিন্টেড নোট বান্ডেল অন্তর্ভুক্ত থাকে।',
      },
    ],
  },
  {
    group: 'পরীক্ষা ও ফলাফল',
    items: [
      {
        q: 'পরীক্ষায় কোন ধরনের প্রশ্ন থাকে?',
        a: 'Single Best Answer (SBA) এবং Multiple True/False (MTF) — BCPS প্যাটার্ন অনুসারে, প্রযোজ্য ক্ষেত্রে নেগেটিভ মার্কিংসহ।',
      },
      {
        q: 'পরীক্ষার মাঝে ইন্টারনেট চলে গেলে কী হবে?',
        a: 'আপনার উত্তরগুলো সাথে সাথে সেভ হয় এবং টাইমার সার্ভারে চলতে থাকে। পুনরায় সংযুক্ত হলে আপনি একই প্রশ্ন থেকে অবশিষ্ট সময়সহ আবার শুরু করতে পারবেন।',
      },
    ],
  },
  {
    group: 'পেমেন্ট ও রিফান্ড',
    items: [
      {
        q: 'কোন কোন পেমেন্ট পদ্ধতি সমর্থিত?',
        a: 'বিকাশ, নগদ, রকেট এবং কার্ড বা ব্যাংক ট্রান্সফার। সফল পেমেন্টের পর সাথে সাথেই আপনার ড্যাশবোর্ডে ইনভয়েস দেখা যাবে।',
      },
      {
        q: 'আপনারা রিফান্ড দেন কি?',
        a: 'ভর্তির ৭ দিনের মধ্যে তিনটির বেশি লেকচার না দেখে থাকলে সম্পূর্ণ রিফান্ড পাওয়া যায়। এর পরে ফি একবার পরবর্তী ব্যাচে স্থানান্তর করা যায়।',
      },
    ],
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-stone-200 last:border-0 dark:border-stone-200">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-stone-900 dark:text-white">{item.q}</span>
        <svg
          className={cn(
            'h-5 w-5 shrink-0 text-brand-600 transition-transform dark:text-brand-400',
            open && 'rotate-180',
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-stone-600 dark:text-brand-200">{item.a}</p>}
    </div>
  );
}

export default function FAQ() {
  return (
    <div>
      <section className="bg-surface-light py-12 text-center dark:bg-surface-dark">
        <div className="container-page">
          <h1 className="section-heading">সাধারণ জিজ্ঞাসা</h1>
          <p className="section-subheading mx-auto text-center">
            ভর্তি, ক্লাস, পরীক্ষা ও পেমেন্ট — শিক্ষার্থীরা আমাদের যা সবচেয়ে বেশি জিজ্ঞেস করেন।
          </p>
        </div>
      </section>

      <section className="container-page grid gap-8 py-12 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {FAQ_GROUPS.map((group) => (
            <Card key={group.group} className="p-6">
              <h2 className="text-base font-bold text-brand-700 dark:text-brand-400">{group.group}</h2>
              <div className="mt-2">
                {group.items.map((item) => (
                  <FaqItem key={item.q} item={item} />
                ))}
              </div>
            </Card>
          ))}
        </div>

        <aside>
          <div className="sticky top-24 space-y-6">
            <img
              src="/assets/bg/Online%20Doctor-rafiki.svg"
              alt=""
              aria-hidden="true"
              width={500}
              height={500}
              className="mx-auto aspect-square w-full max-w-xs object-contain"
            />
            <Card className="p-6">
              <h2 className="text-base font-semibold text-stone-900 dark:text-white">
                আরও কোনো প্রশ্ন আছে?
              </h2>
              <p className="mt-2 text-sm text-stone-600 dark:text-brand-200">
                আমাদের ভর্তি টিম শনিবার থেকে বৃহস্পতিবার সকাল ১০টা থেকে রাত ৮টা পর্যন্ত হোয়াটসঅ্যাপে উত্তর দেয়।
              </p>
              <Button to="/contact" fullWidth className="mt-5">
                যোগাযোগ করুন
              </Button>
            </Card>
          </div>
        </aside>
      </section>
    </div>
  );
}
