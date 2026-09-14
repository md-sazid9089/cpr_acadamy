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
                ? 'border-stone-200 bg-brand-50 dark:border-stone-200 dark:bg-brand-950/40'
                : isWrongPick
                  ? 'border-stone-200 bg-red-50 dark:border-stone-200 dark:bg-red-950/40'
                  : isSelected
                    ? 'border-stone-200 bg-brand-50 dark:border-stone-200 dark:bg-brand-950/40'
                    : 'border-stone-200 hover:border-stone-200 dark:border-stone-200 dark:hover:border-stone-200',
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
                  ? 'bg-brand-600 text-white'
                  : isWrongPick
                    ? 'bg-red-600 text-white'
                    : isSelected
                      ? 'bg-brand-600 text-white'
                      : 'bg-stone-100 text-stone-500 dark:bg-surface-dark dark:text-brand-200',
              )}
            >
              {LETTERS[index] ?? index + 1}
            </span>

            <span className="text-sm text-stone-700 dark:text-brand-200">{option.text}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
