import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaArrowLeftLong, FaCheck, FaPlus, FaTriangleExclamation } from 'react-icons/fa6';
import { blankQuestion, fetchAdminExam, updateExam } from '../api/admin.api.js';
import { adminExamKey, adminExamsKey } from './keys.js';
import { TYPE_LABELS } from './CourseExamsTab.jsx';
import QuestionCard, { isQuestionComplete } from './QuestionCard.jsx';
import Card, { CardBody, CardHeader } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { EXAM_TYPES, QUESTION_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

const KIND_LABELS = {
  [EXAM_TYPES.PRACTICE]: 'Practice — open-ended, results shown at once',
  [EXAM_TYPES.MOCK]: 'Mock — timed window with a results release',
  [EXAM_TYPES.LIVE]: 'Live — timed window with a results release',
};

/** ISO -> value for <input type="datetime-local"> in the admin's own zone. */
function toLocalInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : null;
}

function duplicateOf(source) {
  return {
    ...source,
    id: blankQuestion(source.type).id,
    options: source.options.map((option) => ({ ...option })),
    correctAnswer: source.correctAnswer ? { ...source.correctAnswer } : undefined,
  };
}

/** Fetches the exam once, then hands it to the stateful editor below. */
export default function ExamBuilder() {
  const { examId } = useParams();
  const { course } = useOutletContext();

  const { data: exam, isLoading, isError } = useQuery({
    queryKey: adminExamKey(examId),
    queryFn: () => fetchAdminExam(examId),
    enabled: Boolean(examId),
    // The editor owns its state after load; a background refetch must not clobber it.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <ContentSkeleton variant="exam" label="Loading exam" />
    );
  }

  if (isError || !exam || exam.courseId !== course.id) {
    return (
      <EmptyState
        className="min-h-screen"
        title="Exam not found"
        description="It may have been deleted, or it belongs to a different course."
        action={<Button to={`/admin/courses/${course.id}/exams`}>Back to exams</Button>}
      />
    );
  }

  return <ExamEditor key={exam.id} exam={exam} course={course} />;
}

function ExamEditor({ exam, course }) {
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    title: exam.title,
    type: exam.type,
    kind: exam.kind ?? EXAM_TYPES.PRACTICE,
    isPublished: exam.isPublished ? 'published' : 'draft',
    scheduledAt: toLocalInput(exam.scheduledAt),
    closesAt: toLocalInput(exam.closesAt),
    resultsAt: toLocalInput(exam.resultsAt),
    durationMinutes: exam.durationMinutes,
    questionCount: exam.questionCount,
    marksPerQuestion: exam.marksPerQuestion ?? 1,
    deductionPercent: exam.deductionPercent ?? 0,
    passMark: exam.passMark ?? 70,
  });
  const [questions, setQuestions] = useState(exam.questions ?? []);
  const [dirty, setDirty] = useState(() => new Set());
  const [deleting, setDeleting] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: adminExamsKey(course.id) });

  const remember = (saved) => {
    queryClient.setQueryData(adminExamKey(exam.id), saved);
    invalidateList();
    setSaveError(null);
    setSavedAt(Date.now());
  };

  // ── Settings ──
  const settingsMutation = useMutation({
    mutationFn: updateExam,
    onSuccess: remember,
    onError: (error) => setSaveError(error.message),
  });

  const saveSettings = (event) => {
    event.preventDefault();
    const timed = settings.kind !== EXAM_TYPES.PRACTICE;
    settingsMutation.mutate({
      id: exam.id,
      title: settings.title.trim(),
      type: settings.type,
      kind: settings.kind,
      isPublished: settings.isPublished === 'published',
      scheduledAt: fromLocalInput(settings.scheduledAt) ?? exam.scheduledAt,
      closesAt: timed || settings.closesAt ? fromLocalInput(settings.closesAt) : null,
      resultsAt: timed || settings.resultsAt ? fromLocalInput(settings.resultsAt) : null,
      durationMinutes: Number(settings.durationMinutes) || 0,
      questionCount: Number(settings.questionCount) || 0,
      marksPerQuestion: Number(settings.marksPerQuestion) || 0,
      deductionPercent: Number(settings.deductionPercent),
      passMark: Number(settings.passMark),
      questions,
    });
  };

  const setField = (field) => (event) => setSettings((prev) => ({
    ...prev,
    [field]: event.target.value,
    ...(field === 'type' && event.target.value === 'mixed' ? { questionCount: 50, marksPerQuestion: 2, deductionPercent: 0, passMark: 70 } : {}),
  }));

  // ── Questions ──
  // The whole paper is one document server-side, so every structural change
  // and every blurred edit sends the full current list. A rejected save rolls
  // the list back to what the server last accepted.
  const latest = useRef(questions);
  latest.current = questions;
  const lastSaved = useRef(questions);

  const questionsMutation = useMutation({
    mutationFn: (list) => updateExam({ id: exam.id, questions: list, type: settings.type }),
    onSuccess: (saved, list) => {
      lastSaved.current = list;
      remember({ ...saved, questions: list });
    },
    onError: (error) => {
      setSaveError(error.message);
      setQuestions(lastSaved.current);
      setDirty(new Set());
    },
  });

  const locked = (exam.attemptCount ?? 0) > 0;

  const persist = (list) => questionsMutation.mutate(list);

  const patchQuestion = (questionId, patch) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...patch } : q)));
    setDirty((prev) => new Set(prev).add(questionId));
  };

  /** Persist a card's edits once focus leaves it entirely. */
  const flushQuestion = (questionId) => (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (!dirty.has(questionId)) return;
    persist(latest.current);
    setDirty((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  };

  // Edits still pending when the admin leaves the page are flushed on unmount.
  useEffect(() => () => {
    if (dirty.size) persist(latest.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addQuestion = () => {
    const type = settings.type === 'mixed' ? (questions.length < 30 ? QUESTION_TYPES.MTF : QUESTION_TYPES.SBA) : settings.type;
    const next = [...questions, settings.type === 'mixed' ? blankQuestion(type) : blankQuestion(type, Number(settings.marksPerQuestion))];
    setQuestions(next);
    persist(next);
  };

  const duplicateQuestion = (questionId) => {
    const at = questions.findIndex((q) => q.id === questionId);
    if (at < 0) return;
    const next = [...questions.slice(0, at + 1), duplicateOf(questions[at]), ...questions.slice(at + 1)];
    setQuestions(next);
    persist(next);
  };

  const removeQuestion = (questionId) => {
    const next = questions.filter((q) => q.id !== questionId);
    setQuestions(next);
    setDeleting(null);
    persist(next);
  };

  const moveQuestion = (questionId, delta) => {
    const from = questions.findIndex((q) => q.id === questionId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= questions.length) return;
    const next = [...questions];
    [next[from], next[to]] = [next[to], next[from]];
    setQuestions(next);
    persist(next);
  };

  // ── Derived ──
  const marking = {
    type: settings.type,
    questionCount: Number(settings.questionCount) || 0,
    marksPerQuestion: Number(settings.marksPerQuestion) || 0,
    deductionPercent: Number(settings.deductionPercent) || 0,
  };
  const totalMarks = Math.round(questions.reduce((total, question) => total + Number(question.marks) * (question.type === QUESTION_TYPES.MTF ? question.options.length : 1), 0) * 1000) / 1000;
  const isMixed = settings.type === 'mixed';
  const isMtf = settings.type === QUESTION_TYPES.MTF;
  const isTimed = settings.kind !== EXAM_TYPES.PRACTICE;

  const written = questions.length;
  const target = marking.questionCount;
  const incomplete = useMemo(() => questions.filter((q) => !isQuestionComplete(q)).length, [questions]);
  const progress = target > 0 ? Math.min(100, Math.round((written / target) * 100)) : 0;
  const typeLocked = locked;
  const saving = settingsMutation.isPending || questionsMutation.isPending;

  const mixedReady = !isMixed || (target === 50 && questions.every((question, index) => question.type === (index < 30 ? 'mtf' : 'sba') && question.marks === (index < 30 ? 0.4 : 2)));
  const complete = written === target && target > 0 && incomplete === 0 && mixedReady;

  return (
    <div className="space-y-5">
      <Link
        to={`/admin/courses/${course.id}/exams`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-600 dark:text-brand-200 dark:hover:text-brand-400"
      >
        <FaArrowLeftLong aria-hidden="true" className="h-3 w-3" />
        All exams
      </Link>

      {locked && (
        <p className="flex items-start gap-2 rounded-xl border border-stone-200 bg-brand-50 p-3 text-sm text-brand-900 dark:border-stone-200 dark:bg-brand-950/40 dark:text-brand-200">
          <FaTriangleExclamation aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {exam.attemptCount} {exam.attemptCount === 1 ? 'student has' : 'students have'} already sat this paper, so it can no longer be
            changed. Create a new exam for a revised paper.
          </span>
        </p>
      )}

      {saveError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-stone-200 bg-red-50 p-3 text-sm text-red-800 dark:border-stone-200 dark:bg-red-950/40 dark:text-red-200"
        >
          <FaTriangleExclamation aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </p>
      )}

      {/* ── Settings ── */}
      <Card>
        <form onSubmit={saveSettings}>
          <CardHeader
            title="Exam settings"
            description="Type, schedule, duration and marking. Total marks are worked out from these — they are never typed."
            action={
              <div className="flex items-center gap-3">
                {savedAt && !saving && !saveError && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-400">
                    <FaCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                <Button type="submit" size="sm" isLoading={settingsMutation.isPending} disabled={locked}>
                  Save settings
                </Button>
              </div>
            }
          />
          <CardBody className="space-y-4">
            <Input label="Exam title" required value={settings.title} onChange={setField('title')} />

            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="Question type" value={settings.type} onChange={setField('type')} disabled={typeLocked}>
                <option value={QUESTION_TYPES.SBA}>SBA — single best answer</option>
                <option value={QUESTION_TYPES.MTF}>MCQ — five true/false statements</option>
                <option value="mixed">Mixed - 30 MCQ, then 20 SBA</option>
              </Select>
              <Select label="Exam kind" value={settings.kind} onChange={setField('kind')}>
                {Object.entries(KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                label="Visibility"
                value={settings.isPublished}
                onChange={setField('isPublished')}
                hint={incomplete > 0 ? 'Finish every question before publishing.' : undefined}
              >
                <option value="draft">Draft — hidden from students</option>
                <option value="published">Published — students can sit it</option>
              </Select>
            </div>
            {typeLocked && (
              <p className="-mt-2 text-xs text-stone-500 dark:text-brand-200">
                Question type is locked while the paper has questions — delete them to change it.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Opens at" type="datetime-local" required value={settings.scheduledAt} onChange={setField('scheduledAt')} />
              <Input
                label="Closes at"
                type="datetime-local"
                required={isTimed}
                value={settings.closesAt}
                onChange={setField('closesAt')}
                hint={isTimed ? 'Last moment a student may start.' : 'Optional for practice papers.'}
              />
              <Input
                label="Results released"
                type="datetime-local"
                required={isTimed}
                value={settings.resultsAt}
                onChange={setField('resultsAt')}
                hint={isTimed ? 'No earlier than the closing time.' : 'Blank shows results immediately.'}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <Input
                label="Duration (min)"
                type="number"
                required
                min={1}
                max={600}
                value={settings.durationMinutes}
                onChange={setField('durationMinutes')}
              />
              <Input
                label="Target questions"
                type="number"
                required
                min={1}
                value={settings.questionCount}
                disabled={isMixed}
                onChange={setField('questionCount')}
                hint="How many the paper should have."
              />
              <Input
                label={isMtf ? 'New statement marks' : 'New question marks'}
                type="number"
                required
                min={0.05}
                step={0.05}
                disabled={isMixed}
                value={settings.marksPerQuestion}
                onChange={setField('marksPerQuestion')}
              />
              <Input
                label="Deduction (%)"
                type="number"
                required
                min={0}
                max={1000}
                step={0.001}
                disabled={isMixed}
                value={settings.deductionPercent}
                onChange={setField('deductionPercent')}
                hint="Of the marks per answer, taken for a wrong one."
              />
              <Input label="Pass mark (%)" type="number" min={0} max={100} step={0.001} required disabled={isMixed} value={settings.passMark} onChange={setField('passMark')} />
            </div>

            <p
              className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900 dark:bg-brand-950/60 dark:text-brand-200"
              aria-live="polite"
            >
              {written} / {target} questions ·{' '}
              <strong>{totalMarks} marks</strong>
              {' · '}
              {marking.deductionPercent > 0 ? (
                <>
                  wrong answer deduction <strong>{marking.deductionPercent}%</strong>
                </>
              ) : (
                'no negative marking'
              )}
              {' · '}blank scores 0
            </p>
          </CardBody>
        </form>
      </Card>

      {/* ── Progress ── */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-white">
              {written} of {target} questions written
            </p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-brand-200">
              {incomplete > 0
                ? `${incomplete} ${incomplete === 1 ? 'question is' : 'questions are'} missing a stem, an option or the answer key.`
                : complete
                  ? 'Paper is complete.'
                  : 'Add questions below. Each one saves when you move on from it.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={isMtf ? 'info' : 'brand'}>{TYPE_LABELS[settings.type]}</Badge>
            {questionsMutation.isPending && <Badge tone="neutral">Saving…</Badge>}
            {incomplete > 0 && <Badge tone="warning">{incomplete} incomplete</Badge>}
            {complete && <Badge tone="success">Complete</Badge>}
            {isMixed && <Badge tone={mixedReady ? 'neutral' : 'warning'}>MCQ 1-30 / SBA 31-50</Badge>}
          </div>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-surface-dark"
          role="progressbar"
          aria-valuenow={written}
          aria-valuemin={0}
          aria-valuemax={target}
        >
          <div
            className={cn('h-full rounded-full transition-[width]', written >= target ? 'bg-brand-500' : 'bg-brand-600')}
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* ── Questions ── */}
      {questions.length === 0 ? (
        <Card>
          <EmptyState
            title="No questions yet"
            description={`Add the first ${TYPE_LABELS[settings.type]} question. The target for this paper is ${target}.`}
            action={
              <Button onClick={addQuestion} isLoading={questionsMutation.isPending} disabled={locked}>
                <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
                Add question
              </Button>
            }
          />
        </Card>
      ) : (
        <fieldset disabled={locked} className="space-y-4 disabled:opacity-80">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              marksLabel={`${Math.round(question.marks * (question.type === QUESTION_TYPES.MTF ? question.options.length : 1) * 1000) / 1000} marks`}
              allowTypeChange={isMixed}
              onChange={(patch) => patchQuestion(question.id, patch)}
              onBlur={flushQuestion(question.id)}
              onDuplicate={() => duplicateQuestion(question.id)}
              onDelete={() => setDeleting(question)}
              onMove={(delta) => moveQuestion(question.id, delta)}
              canMoveUp={index > 0}
              canMoveDown={index < questions.length - 1}
            />
          ))}

          <div className="flex justify-center">
            <Button variant="secondary" onClick={addQuestion} isLoading={questionsMutation.isPending}>
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Add question {written + 1}
            </Button>
          </div>
        </fieldset>
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete question"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => removeQuestion(deleting.id)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600 dark:text-brand-200">
          Delete question {questions.findIndex((q) => q.id === deleting?.id) + 1}? The ones after it move up.
        </p>
      </Modal>
    </div>
  );
}
