import { FaClipboardList } from 'react-icons/fa6';

/**
 * STUB — pass 3 replaces this with the quiz engine (SBA/MTF rendering, the
 * countdown timer, submission and the result breakdown).
 */
export default function QuizPane({ lesson }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface-subtle p-10 text-center dark:border-slate-800 dark:bg-surface-dark-subtle">
      <FaClipboardList aria-hidden="true" className="mx-auto h-10 w-10 text-brand-400" />
      <p className="mt-4 text-sm font-semibold text-brand-800 dark:text-white">{lesson.title}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Quiz engine arrives in pass 3 · {lesson.questionCount} questions
      </p>
    </div>
  );
}
