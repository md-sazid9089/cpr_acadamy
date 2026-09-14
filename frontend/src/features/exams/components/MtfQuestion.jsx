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
        const picked = value?.[option.id];
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
                ? 'border-stone-200 bg-brand-50 dark:border-stone-200 dark:bg-brand-950/40'
                : isWrong
                  ? 'border-stone-200 bg-red-50 dark:border-stone-200 dark:bg-red-950/40'
                  : 'border-stone-200 dark:border-stone-200',
            )}
          >
            <p className="flex flex-1 items-start gap-3 text-sm text-stone-700 dark:text-brand-200">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500 dark:bg-surface-dark dark:text-brand-200">
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
                        : 'bg-stone-700 text-white dark:bg-stone-600'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:bg-surface-dark',
                    readOnly && 'cursor-default opacity-90',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {isGraded && (
              <p className="w-full text-xs font-medium text-stone-500 dark:text-brand-200">
                Correct answer: {expected ? 'True' : 'False'}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
