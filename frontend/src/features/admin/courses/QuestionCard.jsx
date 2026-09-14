import { useId } from 'react';
import { FaArrowDown, FaArrowUp, FaClone, FaTrash } from 'react-icons/fa6';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Input, { Select, Textarea } from '@/components/ui/Input.jsx';
import { QUESTION_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** A question is ready for students once every part the runner reads is filled. */
export function isQuestionComplete(question) {
  if (!question.stem?.trim()) return false;
  if (question.options.some((option) => !option.text?.trim())) return false;
  if (question.type === QUESTION_TYPES.SBA) return Boolean(question.correctOptionId);
  return question.options.length === 5 && question.options.every((option) => typeof question.correctAnswer?.[option.id] === 'boolean');
}

/**
 * One editable question. Fully controlled: every edit goes up through
 * `onChange(patch)` and the builder decides when to persist (it saves on blur
 * of the card). Structural actions are buttons the builder wires up.
 */
export default function QuestionCard({
  question,
  index,
  marksLabel,
  allowTypeChange = false,
  onChange,
  onBlur,
  onDuplicate,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
}) {
  const radioGroup = useId();
  const isSba = question.type === QUESTION_TYPES.SBA;
  const complete = isQuestionComplete(question);

  const setOptionText = (optionId, text) =>
    onChange({ options: question.options.map((option) => (option.id === optionId ? { ...option, text } : option)) });

  const setMtfKey = (optionId, value) => {
    // Clicking the current choice again clears it, mirroring the student UI.
    const next = { ...question.correctAnswer };
    if (next[optionId] === value) delete next[optionId];
    else next[optionId] = value;
    onChange({ correctAnswer: next });
  };

  return (
    <article
      onBlur={onBlur}
      className={cn(
        'rounded-2xl border bg-white p-5 border-stone-200 dark:bg-surface-dark-subtle',
        complete ? 'border-stone-200 dark:border-stone-200' : 'border-stone-200 dark:border-stone-200',
      )}
      aria-label={`Question ${index + 1}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">Question {index + 1}</Badge>
          <Badge tone="neutral">{isSba ? 'SBA' : 'MCQ (T/F)'}</Badge>
          <Badge tone="neutral">{marksLabel}</Badge>
          {!complete && <Badge tone="warning">Incomplete</Badge>}
        </div>

        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => onMove(-1)} disabled={!canMoveUp} aria-label="Move question up">
            <FaArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onMove(1)} disabled={!canMoveDown} aria-label="Move question down">
            <FaArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDuplicate} aria-label="Duplicate question">
            <FaClone aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Delete question">
            <FaTrash aria-hidden="true" className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      </header>

      <div className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {allowTypeChange && (
            <Select label="Question type" value={question.type} onChange={(event) => onChange({ type: event.target.value, correctOptionId: '', correctAnswer: {}, marks: event.target.value === QUESTION_TYPES.MTF ? 0.4 : 2 })}>
              <option value={QUESTION_TYPES.MTF}>MCQ (True / False)</option>
              <option value={QUESTION_TYPES.SBA}>SBA</option>
            </Select>
          )}
          <Input label={isSba ? 'Question marks' : 'Marks per statement'} type="number" required min={0.05} max={100} step={0.05} value={question.marks} onChange={(event) => onChange({ marks: Number(event.target.value) })} />
        </div>
        <Textarea
          label="Question"
          rows={3}
          required
          value={question.stem}
          onChange={(event) => onChange({ stem: event.target.value })}
          placeholder={isSba ? 'A 58-year-old man presents with…' : 'Regarding the proximal convoluted tubule:'}
        />

        {/* TODO: file input once a storage target is chosen (Vimeo/Bunny/Cloudinary/S3).
            The model keeps a URL string either way. */}
        <Input
          label="Image URL (optional)"
          type="url"
          value={question.imageUrl ?? ''}
          onChange={(event) => onChange({ imageUrl: event.target.value })}
          placeholder="https://…/ecg.png"
        />

        <fieldset>
          <legend className="text-sm font-medium text-stone-700 dark:text-brand-200">
            {isSba ? 'Options — mark the correct one' : 'Statements — mark each true or false'}
            <span className="ml-0.5 text-red-500">*</span>
          </legend>

          <div className="mt-2 space-y-2">
            {question.options.map((option, optionIndex) => {
              const isCorrect = isSba && question.correctOptionId === option.id;
              const mtfValue = question.correctAnswer?.[option.id];
              return (
                <div key={option.id} className="flex items-center gap-2">
                  {isSba && (
                    <label
                      className={cn(
                        'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs font-bold transition-colors',
                        isCorrect
                          ? 'bg-brand-600 text-white'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:bg-surface-dark',
                      )}
                      title={isCorrect ? 'Correct answer' : 'Mark as correct'}
                    >
                      <input
                        type="radio"
                        name={radioGroup}
                        value={option.id}
                        checked={isCorrect}
                        onChange={() => onChange({ correctOptionId: option.id })}
                        className="sr-only"
                      />
                      {LETTERS[optionIndex]}
                    </label>
                  )}

                  {!isSba && (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500 dark:bg-surface-dark dark:text-brand-200">
                      {LETTERS[optionIndex]}
                    </span>
                  )}

                  <Input
                    containerClassName="flex-1"
                    value={option.text}
                    onChange={(event) => setOptionText(option.id, event.target.value)}
                    placeholder={`Option ${LETTERS[optionIndex]}`}
                    aria-label={`Option ${LETTERS[optionIndex]}`}
                  />

                  {!isSba && (
                    <div className="flex shrink-0 gap-1" role="group" aria-label={`Statement ${LETTERS[optionIndex]} answer`}>
                      {[
                        { label: 'True', value: true },
                        { label: 'False', value: false },
                      ].map(({ label, value }) => (
                        <button
                          key={label}
                          type="button"
                          aria-pressed={mtfValue === value}
                          onClick={() => setMtfKey(option.id, value)}
                          className={cn(
                            'h-10 rounded-lg px-3 text-xs font-semibold transition-colors',
                            mtfValue === value
                              ? value
                                ? 'bg-brand-600 text-white'
                                : 'bg-stone-700 text-white dark:bg-stone-600'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:bg-surface-dark',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>

        <Textarea
          label="Explanation (optional)"
          rows={2}
          value={question.explanation ?? ''}
          onChange={(event) => onChange({ explanation: event.target.value })}
          placeholder="Shown to students after the result is published."
        />
      </div>
    </article>
  );
}
