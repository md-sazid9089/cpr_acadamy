/**
 * Module-scoped progress. Reads the shared progress query rather than counting
 * completed rows locally, so this and the sidebar ticks cannot disagree.
 *
 * @param {Object} props
 * @param {string} [props.moduleTitle]
 * @param {{ completed: number, total: number }} [props.progress]
 * @param {boolean} [props.isLoading]
 */
export default function ProgressHeader({ moduleTitle, progress, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const completed = progress?.completed ?? 0;
  const total = progress?.total ?? 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-semibold text-brand-800 dark:text-brand-200">
          {moduleTitle}
        </p>
        <p className="shrink-0 text-sm font-semibold text-brand-800 dark:text-brand-200">
          {completed} / {total}
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${moduleTitle} progress`}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-slate-800"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-200 motion-reduce:transition-none dark:bg-brand-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
