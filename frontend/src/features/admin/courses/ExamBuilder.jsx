import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaArrowLeftLong, FaCheck, FaPlus, FaTriangleExclamation } from 'react-icons/fa6';
import { blankQuestion, fetchAdminExam, updateExam } from '../api/admin.api.js';
import { adminExamKey, adminExamsKey } from './keys.js';
import { TYPE_LABELS } from './CourseExamsTab.jsx';
import QuestionCard, { isQuestionComplete } from './QuestionCard.jsx';
import Card from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { EXAM_KIND_INFO, EXAM_TYPES, QUESTION_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

const KIND_LABELS = {
  [EXAM_TYPES.PRACTICE]: EXAM_KIND_INFO.practice.label,
  [EXAM_TYPES.MOCK]: EXAM_KIND_INFO.mock.label,
  [EXAM_TYPES.LIVE]: EXAM_KIND_INFO.live.label,
};

const CLOSING_HINTS = {
  [EXAM_TYPES.PRACTICE]: 'Optional for practice papers.',
  [EXAM_TYPES.MOCK]: 'Required. Last moment a student may start; papers still running are cut off here.',
  [EXAM_TYPES.LIVE]: 'Required. End of the live window; the shared clock still stops at start time + duration.',
};

/** One titled block of the editor: heading and description on the left, an optional action on the right. */
function Section({ id, title, description, action, children }) {
  return (
    <Card id={id} className="scroll-mt-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-stone-500 dark:text-brand-200">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </Card>
  );
}

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
  const navigate = useNavigate();

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
    sbaMarks: exam.sbaMarks ?? 2,
    mtfMarks: exam.mtfMarks ?? 0.4,
    deductionPercent: exam.deductionPercent ?? 0,
    passMark: exam.passMark ?? 70,
  });
  const [questions, setQuestions] = useState(exam.questions ?? []);
  const [dirty, setDirty] = useState(() => new Set());
  const [deleting, setDeleting] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const navigatingRef = useRef(false);

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: adminExamsKey(course.id) });

  const remember = (saved) => {
    // A save response carries no attempt count; keep the known one so a locked paper stays locked.
    queryClient.setQueryData(adminExamKey(exam.id), (previous) => ({ ...saved, attemptCount: previous?.attemptCount ?? saved.attemptCount }));
    invalidateList();
    setSaveError(null);
    setSavedAt(Date.now());
  };

  // ── Settings ──
  const settingsMutation = useMutation({
    mutationFn: updateExam,
    onSuccess: (data) => {
      remember(data);
      if (navigatingRef.current) {
        navigate(`/admin/courses/${course.id}/exams`);
      }
    },
    onError: (error) => {
      setSaveError(error.message);
      navigatingRef.current = false;
    },
  });

  const saveSettings = (event) => {
    event.preventDefault();
    const timed = settings.kind !== EXAM_TYPES.PRACTICE;
    if (locked) {
      // Students have started: only the schedule may move (see the banner), so send nothing else.
      settingsMutation.mutate({
        id: exam.id,
        ...(closingLocked ? {} : { closesAt: timed || settings.closesAt ? fromLocalInput(settings.closesAt) : null }),
        resultsAt: settings.resultsAt ? fromLocalInput(settings.resultsAt) : null,
      });
      return;
    }
    settingsMutation.mutate({
      id: exam.id,
      title: settings.title.trim(),
      type: settings.type,
      kind: settings.kind,
      isPublished: settings.isPublished === 'published',
      scheduledAt: fromLocalInput(settings.scheduledAt) ?? exam.scheduledAt,
      closesAt: timed || settings.closesAt ? fromLocalInput(settings.closesAt) : null,
      resultsAt: settings.resultsAt ? fromLocalInput(settings.resultsAt) : null,
      durationMinutes: Number(settings.durationMinutes) || 0,
      questionCount: Number(settings.questionCount) || 0,
      sbaMarks: typeMarks.sba,
      mtfMarks: typeMarks.mtf,
      deductionPercent: Number(settings.deductionPercent),
      passMark: Number(settings.passMark),
      questions,
    });
  };

  const setField = (field) => (event) => setSettings((prev) => ({
    ...prev,
    [field]: event.target.value,
  }));

  // Marks belong to a question type, not to single questions: changing them updates every question of that type.
  const typeMarks = { sba: Number(settings.sbaMarks) || 0, mtf: Number(settings.mtfMarks) || 0 };
  const setTypeMarks = (type) => (event) => {
    const { value } = event.target;
    setSettings((prev) => ({ ...prev, [type === QUESTION_TYPES.MTF ? 'mtfMarks' : 'sbaMarks']: value }));
    const marks = Number(value);
    if (marks > 0) setQuestions((prev) => prev.map((q) => (q.type === type ? { ...q, marks } : q)));
  };

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
  // Once students have started, the paper is frozen but the schedule can still move, until results are out
  // (no release time at all means results show on submit). A live exam's closing time stays fixed.
  const resultsOut = locked && (!exam.resultsReleaseAt || new Date(exam.resultsReleaseAt).getTime() <= Date.now());
  const closingLocked = locked && (resultsOut || exam.kind === EXAM_TYPES.LIVE);

  const persist = (list) => questionsMutation.mutate(list);

  const patchQuestion = (questionId, patch) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...patch } : q)));
    setDirty((prev) => new Set(prev).add(questionId));
  };

  /** Persist a card's edits once focus leaves it entirely. */
  const flushQuestion = (questionId) => (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (!dirty.has(questionId)) return;
    
    // Defer the flush slightly so if this blur was caused by clicking "Add Question"
    // or another structural action, that action's synchronous setQuestions(next) 
    // runs first. Then we persist whatever the latest state is.
    setTimeout(() => {
      persist(latest.current);
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }, 0);
  };

  // Edits still pending when the admin leaves the page are flushed on unmount.
  useEffect(() => () => {
    if (dirty.size) persist(latest.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The paper never holds more questions than its target: raise the target first.
  const targetReached = () => {
    const limit = Number(settings.questionCount) || 0;
    return limit > 0 && latest.current.length >= limit;
  };

  // A Mixed paper takes MCQ and SBA questions in any order, so the creator picks the type of each one added.
  const addQuestion = (requestedType) => {
    if (targetReached()) return;
    const type = settings.type === 'mixed' ? (requestedType === QUESTION_TYPES.SBA ? QUESTION_TYPES.SBA : QUESTION_TYPES.MTF) : settings.type;
    const next = [...questions, blankQuestion(type, typeMarks[type] || undefined)];
    setQuestions(next);
    persist(next);
  };

  /** One "Add question" button, or an "Add MCQ" / "Add SBA" pair on a Mixed paper. */
  const addButtons = ({ variant, disabled }) => {
    if (disabled && questions.length > 0) {
      return (
        <Button variant={variant} disabled>
          <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
          Target reached
        </Button>
      );
    }
    const choices = settings.type === 'mixed'
      ? [['Add MCQ', QUESTION_TYPES.MTF], ['Add SBA', QUESTION_TYPES.SBA]]
      : [[questions.length === 0 ? 'Add question' : `Add question ${questions.length + 1}`, settings.type]];
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {choices.map(([label, type]) => (
          <Button key={label} variant={variant} onClick={() => addQuestion(type)} isLoading={questionsMutation.isPending} disabled={disabled}>
            <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>
    );
  };

  const duplicateQuestion = (questionId) => {
    const at = questions.findIndex((q) => q.id === questionId);
    if (at < 0 || targetReached()) return;
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
    deductionPercent: Number(settings.deductionPercent) || 0,
  };
  const totalMarks = Math.round(questions.reduce((total, question) => total + Number(question.marks) * (question.type === QUESTION_TYPES.MTF ? question.options.length : 1), 0) * 1000) / 1000;
  const isMixed = settings.type === 'mixed';
  const isMtf = settings.type === QUESTION_TYPES.MTF;
  const isTimed = settings.kind !== EXAM_TYPES.PRACTICE;
  // A mixed paper must stay inside the range this course allows (set under the course's Detail tab).
  const deductionRange = isMixed
    ? { min: course.mixedNegativeMarkingMin ?? 0, max: course.mixedNegativeMarkingMax ?? 1000 }
    : { min: 0, max: 1000 };
  const passRange = isMixed
    ? { min: course.mixedPassMarkMin ?? 0, max: course.mixedPassMarkMax ?? 100 }
    : { min: 0, max: 100 };

  const written = questions.length;
  const target = marking.questionCount;
  const incomplete = useMemo(() => questions.filter((q) => !isQuestionComplete(q)).length, [questions]);
  const typeLocked = locked;
  const saving = settingsMutation.isPending || questionsMutation.isPending;

  const mixedReady = true;
  const complete = written === target && target > 0 && incomplete === 0 && mixedReady;
  const atTarget = target > 0 && written >= target;
  // Why this exam cannot be published yet (null when it can). Shown under Visibility and in the draft notice.
  const publishBlocker = target < 1
    ? 'Set a target of at least 1 question.'
    : written < target
      ? `Write all ${target} questions first (${written} written so far).`
      : written > target
        ? `The paper has ${written - target} more ${written - target === 1 ? 'question' : 'questions'} than the target of ${target}.`
        : incomplete > 0
          ? `${incomplete} ${incomplete === 1 ? 'question still needs' : 'questions still need'} a stem, every option and an answer key.`
          : null;

  const round3 = (n) => Math.round(n * 1000) / 1000;
  const passNeeded = round3(totalMarks * (Number(settings.passMark) || 0) / 100);
  const penalty = (type) => round3(typeMarks[type] * marking.deductionPercent / 100);
  const showSbaMarks = settings.type !== QUESTION_TYPES.MTF;
  const showMtfMarks = settings.type !== QUESTION_TYPES.SBA;
  const writtenPercent = target > 0 ? Math.min(100, Math.round((written / target) * 100)) : 0;
  const scrollToQuestions = () => document.getElementById('exam-questions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const optional = (text) => (
    <>
      {text} <span className="font-normal text-stone-400 dark:text-brand-200">(optional)</span>
    </>
  );
  const totals = [
    ['Total marks', totalMarks, written < target ? `From ${written} of ${target} questions` : null],
    ['Needed to pass', passNeeded, null],
    isMixed
      ? ['Wrong answer', `−${penalty(QUESTION_TYPES.SBA)} / −${penalty(QUESTION_TYPES.MTF)}`, 'per SBA / per MCQ statement']
      : ['Wrong answer', `−${penalty(settings.type)}`, isMtf ? 'per statement' : 'per question'],
    ['Blank answer', 0, null],
  ];

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-brand-200">
        <Link to={`/admin/courses/${course.id}/exams`} className="inline-flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400">
          <FaArrowLeftLong aria-hidden="true" className="h-3 w-3" />
          Exams
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-semibold text-stone-900 dark:text-white">{settings.title || 'Untitled exam'}</span>
      </nav>

      {settings.isPublished === 'draft' && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
        >
          <p className="flex items-start gap-2">
            <FaTriangleExclamation aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>Draft:</strong> students can’t see this exam yet.{' '}
              {publishBlocker ?? 'Everything is in place: set Visibility to Published and save to open it to students.'}
            </span>
          </p>
          {!locked && written < target && (
            <button type="button" onClick={scrollToQuestions} className="font-semibold underline underline-offset-4 hover:text-brand-700 dark:hover:text-white">
              Add questions
            </button>
          )}
        </div>
      )}

      {locked && (
        <p className="flex items-start gap-2 rounded-xl border border-stone-200 bg-brand-50 p-3 text-sm text-brand-900 dark:border-stone-200 dark:bg-brand-950/40 dark:text-brand-200">
          <FaTriangleExclamation aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {exam.attemptCount} {exam.attemptCount === 1 ? 'student has' : 'students have'} already sat this paper, so its questions and
            marking can no longer be changed. {resultsOut
              ? 'Its results are already out, so the schedule is fixed too.'
              : closingLocked
                ? 'You can still change when results are released.'
                : 'You can still move the closing time later, for students who missed it, and change when results are released.'}{' '}
            Create a new exam for a revised paper.
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
      <form id="exam-settings-form" onSubmit={saveSettings} className="space-y-5">
        <Section title="Basics" description="What the exam is called and how it behaves.">
          <Input label="Exam title" required value={settings.title} onChange={setField('title')} disabled={locked} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Question type"
              required
              value={settings.type}
              onChange={setField('type')}
              disabled={typeLocked}
              hint={typeLocked ? 'Locked while the paper has questions. Delete them to change it.' : undefined}
            >
              <option value={QUESTION_TYPES.SBA}>SBA (single best answer)</option>
              <option value={QUESTION_TYPES.MTF}>MCQ (multiple true/false)</option>
              <option value="mixed">Mixed (MCQ and SBA)</option>
            </Select>
            <Select
              label="Exam kind"
              required
              value={settings.kind}
              onChange={setField('kind')}
              disabled={locked}
              hint={EXAM_KIND_INFO[settings.kind]?.summary}
            >
              {Object.entries(KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Visibility"
              disabled={locked}
              value={settings.isPublished}
              onChange={setField('isPublished')}
              hint={publishBlocker ?? undefined}
            >
              <option value="draft">Draft (hidden from students)</option>
              <option value="published" disabled={Boolean(publishBlocker)}>
                Published (students can sit it)
              </option>
            </Select>
          </div>
        </Section>

        <Section title="Timing" description="When students can take it and when they see results.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_9rem]">
            <Input label="Opens" type="datetime-local" required value={settings.scheduledAt} onChange={setField('scheduledAt')} disabled={locked} />
            <Input
              label={isTimed ? 'Closes' : optional('Closes')}
              type="datetime-local"
              required={isTimed}
              min={settings.scheduledAt || undefined}
              value={settings.closesAt}
              onChange={setField('closesAt')}
              disabled={closingLocked}
              hint={locked && !closingLocked ? 'Later only. Students who have not sat it yet can start until this time.' : CLOSING_HINTS[settings.kind]}
            />
            <Input
              label={optional('Results released')}
              type="datetime-local"
              min={settings.closesAt || settings.scheduledAt || undefined}
              value={settings.resultsAt}
              onChange={setField('resultsAt')}
              disabled={resultsOut}
              hint={settings.closesAt
                ? 'Leave blank to release when the exam closes. Can’t be before closing.'
                : 'Leave blank to show results as soon as a student submits. Can’t be before the exam opens.'}
            />
            <Input
              label="Duration"
              type="number"
              required
              min={1}
              max={600}
              suffix="min"
              value={settings.durationMinutes}
              onChange={setField('durationMinutes')}
              disabled={locked}
            />
          </div>
        </Section>

        <Section title="Marking" description="Totals are calculated from these values.">
          <fieldset disabled={locked} className={cn('grid gap-4 sm:grid-cols-2', isMixed ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
            <Input
              label="Questions"
              type="number"
              required
              min={Math.max(1, written)}
              max={500}
              value={settings.questionCount}
              onChange={setField('questionCount')}
              hint={written > 0 ? `How many the paper should have. At least the ${written} already written.` : 'How many the paper should have.'}
            />
            {showSbaMarks && (
              <Input
                label="SBA marks"
                type="number"
                required
                min={0.05}
                max={100}
                step={0.05}
                value={settings.sbaMarks}
                onChange={setTypeMarks(QUESTION_TYPES.SBA)}
                hint="Every SBA question in this paper carries these marks."
              />
            )}
            {showMtfMarks && (
              <Input
                label="MCQ marks per statement"
                type="number"
                required
                min={0.05}
                max={100}
                step={0.05}
                value={settings.mtfMarks}
                onChange={setTypeMarks(QUESTION_TYPES.MTF)}
                hint={`Every true/false statement carries these, so each MCQ is worth ${round3(typeMarks.mtf * 5)}.`}
              />
            )}
            <Input
              label="Wrong-answer penalty"
              type="number"
              required
              min={deductionRange.min}
              max={deductionRange.max}
              step={0.001}
              suffix="%"
              value={settings.deductionPercent}
              onChange={setField('deductionPercent')}
              hint={isMixed
                ? `Mixed policy for this course: ${deductionRange.min}% to ${deductionRange.max}%.`
                : `Share of a ${isMtf ? 'statement' : 'question'}’s marks lost when wrong.`}
            />
            <Input
              label="Pass mark"
              type="number"
              min={passRange.min}
              max={passRange.max}
              step={0.001}
              required
              suffix="%"
              value={settings.passMark}
              onChange={setField('passMark')}
              hint={isMixed ? `Mixed policy for this course: ${passRange.min}% to ${passRange.max}%.` : undefined}
            />
          </fieldset>

          <dl className="grid grid-cols-2 overflow-hidden rounded-xl bg-brand-50 sm:grid-cols-4 dark:bg-brand-950/60" aria-live="polite">
            {totals.map(([term, value, note], index) => (
              <div
                key={term}
                className={cn(
                  'border-brand-100 px-4 py-3 dark:border-brand-900',
                  index % 2 === 1 && 'border-l',
                  index > 1 && 'border-t sm:border-t-0',
                  index === 2 && 'sm:border-l',
                )}
              >
                <dt className="text-xs text-stone-500 dark:text-brand-200">{term}</dt>
                <dd className="mt-0.5 text-lg font-bold text-stone-900 dark:text-white">{value}</dd>
                {note && <dd className="text-xs text-stone-500 dark:text-brand-200">{note}</dd>}
              </div>
            ))}
          </dl>
        </Section>

        {/* Saves in place: the admin stays on this exam. */}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 rounded-card border border-stone-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-stone-200 dark:bg-surface-dark-subtle/95">
          {savedAt && !saving && !saveError && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-400">
              <FaCheck aria-hidden="true" className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          {saving && <span className="text-sm font-medium text-stone-500">Saving...</span>}
          <Button type="submit" isLoading={settingsMutation.isPending} disabled={resultsOut}>
            Save settings
          </Button>
        </div>
      </form>

      {/* ── Questions ── */}
      <Section
        id="exam-questions"
        title="Questions"
        description={incomplete > 0
          ? `${written} of ${target} written. ${incomplete} ${incomplete === 1 ? 'question is' : 'questions are'} missing a stem, an option or the answer key.`
          : complete
            ? `${written} of ${target} written. The paper is complete.`
            : `${written} of ${target} written. Each question saves when you move to the next.`}
        action={locked ? null : addButtons({ variant: 'primary', disabled: atTarget })}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isMtf ? 'info' : 'brand'}>{TYPE_LABELS[settings.type]}</Badge>
          {questionsMutation.isPending && <Badge tone="neutral">Saving…</Badge>}
          {incomplete > 0 && <Badge tone="warning">{incomplete} incomplete</Badge>}
          {complete && <Badge tone="success">Complete</Badge>}
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-surface-dark"
          role="progressbar"
          aria-label="Questions written"
          aria-valuenow={writtenPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="block h-full rounded-full bg-brand-500 transition-[width]" style={{ width: `${writtenPercent}%` }} />
        </div>
      </Section>

      {questions.length > 0 && (
        <fieldset disabled={locked} className="space-y-4 disabled:opacity-80">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              marksLabel={`${Math.round(question.marks * (question.type === QUESTION_TYPES.MTF ? question.options.length : 1) * 1000) / 1000} marks`}
              allowTypeChange={isMixed}
              typeMarks={typeMarks}
              onChange={(patch) => patchQuestion(question.id, patch)}
              onBlur={flushQuestion(question.id)}
              onDuplicate={() => duplicateQuestion(question.id)}
              onDelete={() => setDeleting(question)}
              onMove={(delta) => moveQuestion(question.id, delta)}
              canDuplicate={!atTarget}
              canMoveUp={index > 0}
              canMoveDown={index < questions.length - 1}
            />
          ))}

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            {addButtons({ variant: 'secondary', disabled: atTarget })}
            <Button
              variant="outline"
              onClick={() => {
                const form = document.getElementById('exam-settings-form');
                if (!form) { navigate(`/admin/courses/${course.id}/exams`); return; }
                // Only leave once the settings are valid and saved; an invalid form stays put with its messages.
                if (!form.reportValidity()) return;
                navigatingRef.current = true;
                form.requestSubmit();
              }}
              isLoading={settingsMutation.isPending}
            >
              Done building
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
