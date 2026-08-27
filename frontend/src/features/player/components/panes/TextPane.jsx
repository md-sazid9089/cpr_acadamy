/**
 * Reading lesson. Real, not a stub — it is only prose.
 *
 * Bengali paragraphs carry `font-bn` and leading-[1.9]; Latin's 1.5 makes
 * Bangla conjuncts collide with the line above.
 */

/** Rough test: does this block contain Bengali codepoints? */
function isBengali(text) {
  return /[ঀ-৿]/.test(text);
}

export default function TextPane({ lesson }) {
  const blocks = lesson.body ?? [
    'This reading covers the high-yield points for the topic, written to match the way the questions are actually asked in the examination.',
    'পরীক্ষায় যেভাবে প্রশ্ন আসে সেভাবেই গুরুত্বপূর্ণ পয়েন্টগুলো এখানে সাজানো হয়েছে। প্রতিটি পয়েন্ট মনে রাখার জন্য ছোট ছোট অংশে ভাগ করা আছে।',
    'Read this once before the class and again the night before the exam. Anything marked as a common mistake has appeared in a past paper at least twice.',
  ];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-surface-dark-subtle">
      <h2 className="text-base font-semibold text-brand-800 sm:text-lg dark:text-white">
        {lesson.title}
      </h2>

      <div className="mt-4 space-y-4">
        {blocks.map((block, index) => {
          const bengali = isBengali(block);
          return (
            <p
              key={index}
              lang={bengali ? 'bn' : undefined}
              className={
                bengali
                  ? 'font-bn text-sm leading-[1.9] text-slate-700 dark:text-slate-300'
                  : 'text-sm leading-relaxed text-slate-700 dark:text-slate-300'
              }
            >
              {block}
            </p>
          );
        })}
      </div>
    </article>
  );
}
