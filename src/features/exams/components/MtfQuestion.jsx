import { cn } from '@/lib/utils';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Multiple True/False: each stem is answered independently as true or false,
 * and may be left blank. `value` is a map of optionId -> boolean.
 *
 * @param {Object} props
 * @param {import('@/types').Question} props.question
 * @param {Record<string, boolean>} [props.value]
 * @param {(next: Record<string, boolean>) => void} props.onChange
 * @param {boolean} [props.readOnly]
 * @param {Record<string, boolean>} [props.correctAnswer]
 */
export default function MtfQuestion({
  question,
  value = {},
  onChange,
  readOnly = false,
  correctAnswer,
}) {
  const setOption = (optionId, choice) => {
    // Clicking the current choice again clears it, so a stem can be left blank.
    const next = { ...value };
    if (next[optionId] === choice) delete next[optionId];
    else next[optionId] = choice;
    onChange?.(next);
  };

  return (
    <div className="space-y-2">
      {question.options.map((option, index) => {
        const picked = value[option.id];
        const expected = correctAnswer?.[option.id];
        const isGraded = readOnly && expected !== undefined;
        const isRight = isGraded && picked === expected;
        const isWrong = isGraded && picked !== undefined && picked !== expected;

        return (
          <div
            key={option.id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4',
              isRight
                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40'
                : isWrong
                  ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40'
                  : 'border-slate-200 dark:border-slate-800',
            )}
          >
            <p className="flex flex-1 items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {LETTERS[index] ?? index + 1}
              </span>
              {option.text}
            </p>

            <div className="flex gap-2">
              {[
                { label: 'True', choice: true },
                { label: 'False', choice: false },
              ].map(({ label, choice }) => (
                <button
                  key={label}
                  type="button"
                  disabled={readOnly}
                  aria-pressed={picked === choice}
                  onClick={() => setOption(option.id, choice)}
                  className={cn(
                    'rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                    picked === choice
                      ? choice
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-700 text-white dark:bg-slate-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                    readOnly && 'cursor-default opacity-90',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {isGraded && (
              <p className="w-full text-xs font-medium text-slate-500 dark:text-slate-400">
                Correct answer: {expected ? 'True' : 'False'}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
