import { cn } from '@/lib/utils';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Single Best Answer: exactly one option may be selected.
 *
 * @param {Object} props
 * @param {import('@/types').Question} props.question
 * @param {string | undefined} props.value      Selected option id.
 * @param {(optionId: string) => void} props.onChange
 * @param {boolean} [props.readOnly]            Result review mode.
 * @param {string} [props.correctAnswer]        Shown only when readOnly.
 */
export default function SbaQuestion({ question, value, onChange, readOnly = false, correctAnswer }) {
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">{question.stem}</legend>

      {question.options.map((option, index) => {
        const isSelected = value === option.id;
        const isCorrect = readOnly && correctAnswer === option.id;
        const isWrongPick = readOnly && isSelected && correctAnswer !== option.id;

        return (
          <label
            key={option.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
              readOnly && 'cursor-default',
              isCorrect
                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40'
                : isWrongPick
                  ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40'
                  : isSelected
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/40'
                    : 'border-slate-200 hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-700',
            )}
          >
            <input
              type="radio"
              name={question.id}
              value={option.id}
              checked={isSelected}
              disabled={readOnly}
              onChange={() => onChange?.(option.id)}
              className="sr-only"
            />

            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                isCorrect
                  ? 'bg-emerald-600 text-white'
                  : isWrongPick
                    ? 'bg-red-600 text-white'
                    : isSelected
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
              )}
            >
              {LETTERS[index] ?? index + 1}
            </span>

            <span className="text-sm text-slate-700 dark:text-slate-200">{option.text}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
