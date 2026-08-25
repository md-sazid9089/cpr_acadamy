import { FaFileLines } from 'react-icons/fa6';

/**
 * STUB — pass 2 replaces this with the watermarked, download-disabled viewer.
 */
export default function PdfPane({ lesson }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface-subtle p-10 text-center dark:border-slate-800 dark:bg-surface-dark-subtle">
      <FaFileLines aria-hidden="true" className="mx-auto h-10 w-10 text-brand-400" />
      <p className="mt-4 text-sm font-semibold text-brand-800 dark:text-white">{lesson.title}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Lecture sheet viewer arrives in pass 2
      </p>
    </div>
  );
}
