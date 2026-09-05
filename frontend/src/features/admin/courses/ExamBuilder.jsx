import { useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaArrowLeftLong, FaCheck, FaPlus } from 'react-icons/fa6';
import {
  createQuestion,
  deleteQuestion,
  duplicateQuestion,
  fetchAdminExam,
  reorderQuestions,
  updateExam,
  updateQuestion,
} from '../api/admin.api.js';
import { computeTotalMarks, deductionPerWrong, marksPerQuestionTotal, stemsPerQuestion } from '../utils/marking.js';
import { adminExamKey, adminExamsKey } from './keys.js';
import { TYPE_LABELS } from './CourseExamsTab.jsx';
import QuestionCard, { isQuestionComplete } from './QuestionCard.jsx';
import Card, { CardBody, CardHeader } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { QUESTION_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

/** ISO -> value for <input type="datetime-local"> in the admin's own zone. */
function toLocalInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
      <div className="flex min-h-screen items-start justify-center pt-20">
        <Spinner size="lg" label="Loading exam…" />
      </div>
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
    status: exam.status,
    scheduledAt: toLocalInput(exam.scheduledAt),
    durationMinutes: exam.durationMinutes,
    questionCount: exam.questionCount,
    marksPerQuestion: exam.marksPerQuestion ?? 1,
    deductionPercent: exam.deductionPercent ?? 0,
  });
  const [questions, setQuestions] = useState(exam.questions);
  const [dirty, setDirty] = useState(() => new Set());
  const [deleting, setDeleting] = useState(null);

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: adminExamsKey(course.id) });

  // ── Settings ──
  const settingsMutation = useMutation({
    mutationFn: updateExam,
    onSuccess: (saved) => {
      queryClient.setQueryData(adminExamKey(exam.id), (prev) => ({ ...saved, questions: prev?.questions ?? saved.questions }));
      invalidateList();
    },
  });

  const saveSettings = (event) => {
    event.preventDefault();
    settingsMutation.mutate({
      id: exam.id,
      title: settings.title.trim(),
      type: settings.type,
      status: settings.status,
      scheduledAt: settings.scheduledAt ? new Date(settings.scheduledAt).toISOString() : exam.scheduledAt,
      durationMinutes: Number(settings.durationMinutes) || 0,
      questionCount: Number(settings.questionCount) || 0,
      marksPerQuestion: Number(settings.marksPerQuestion) || 0,
      deductionPercent: Math.min(100, Math.max(0, Number(settings.deductionPercent) || 0)),
    });
  };

  const setField = (field) => (event) => setSettings((prev) => ({ ...prev, [field]: event.target.value }));

  // ── Questions ──
  const questionMutation = useMutation({ mutationFn: updateQuestion, onSuccess: invalidateList });

  const addMutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: (created) => {
      setQuestions((prev) => [...prev, created]);
      invalidateList();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateQuestion,
    onSuccess: (copy, { questionId }) => {
      setQuestions((prev) => {
        const at = prev.findIndex((q) => q.id === questionId) + 1;
        return [...prev.slice(0, at), copy, ...prev.slice(at)];
      });
      invalidateList();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: (_, { questionId }) => {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setDeleting(null);
      invalidateList();
    },
  });

  const reorderMutation = useMutation({ mutationFn: reorderQuestions });

  const patchQuestion = (questionId, patch) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...patch } : q)));
    setDirty((prev) => new Set(prev).add(questionId));
  };

  /** Persist a card's edits once focus leaves it entirely. */
  const flushQuestion = (questionId) => (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (!dirty.has(questionId)) return;
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    questionMutation.mutate({ examId: exam.id, questionId, ...question });
    setDirty((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  };

  const moveQuestion = (questionId, delta) => {
    setQuestions((prev) => {
      const from = prev.findIndex((q) => q.id === questionId);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      reorderMutation.mutate({ examId: exam.id, questionIds: next.map((q) => q.id) });
      return next;
    });
  };

  // ── Derived ──
  const marking = {
    type: settings.type,
    questionCount: Number(settings.questionCount) || 0,
    marksPerQuestion: Number(settings.marksPerQuestion) || 0,
    deductionPercent: Number(settings.deductionPercent) || 0,
  };
  const totalMarks = computeTotalMarks(marking);
  const deduction = deductionPerWrong(marking);
  const perQuestion = marksPerQuestionTotal(marking);
  const stems = stemsPerQuestion(settings.type);
  const isMtf = settings.type === QUESTION_TYPES.MTF;

  const written = questions.length;
  const target = marking.questionCount;
  const incomplete = useMemo(() => questions.filter((q) => !isQuestionComplete(q)).length, [questions]);
  const progress = target > 0 ? Math.min(100, Math.round((written / target) * 100)) : 0;
  const typeLocked = questions.length > 0;

  const marksLabel = isMtf
    ? `${stems} × ${marking.marksPerQuestion} = ${perQuestion} marks`
    : `${perQuestion} ${perQuestion === 1 ? 'mark' : 'marks'}`;

  return (
    <div className="space-y-5">
      <Link
        to={`/admin/courses/${course.id}/exams`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <FaArrowLeftLong aria-hidden="true" className="h-3 w-3" />
        All exams
      </Link>

      {/* ── Settings ── */}
      <Card>
        <form onSubmit={saveSettings}>
          <CardHeader
            title="Exam settings"
            description="Type, schedule, duration and marking. Total marks are worked out from these — they are never typed."
            action={
              <div className="flex items-center gap-3">
                {settingsMutation.isSuccess && !settingsMutation.isPending && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <FaCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                <Button type="submit" size="sm" isLoading={settingsMutation.isPending}>
                  Save settings
                </Button>
              </div>
            }
          />
          <CardBody className="space-y-4">
            <Input label="Exam title" required value={settings.title} onChange={setField('title')} />

            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Question type"
                value={settings.type}
                onChange={setField('type')}
                disabled={typeLocked}
              >
                <option value={QUESTION_TYPES.SBA}>SBA — single best answer</option>
                <option value={QUESTION_TYPES.MTF}>MCQ — five true/false statements</option>
              </Select>
              <Input
                label="Scheduled at"
                type="datetime-local"
                required
                value={settings.scheduledAt}
                onChange={setField('scheduledAt')}
              />
              <Select label="Status" value={settings.status} onChange={setField('status')}>
                <option value="upcoming">Upcoming</option>
                <option value="running">Running</option>
                <option value="published">Published</option>
              </Select>
            </div>
            {typeLocked && (
              <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
                Question type is locked while the paper has questions — delete them to change it.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-4">
              <Input
                label="Duration (min)"
                type="number"
                required
                min={5}
                max={300}
                value={settings.durationMinutes}
                onChange={setField('durationMinutes')}
              />
              <Input
                label="Target questions"
                type="number"
                required
                min={1}
                value={settings.questionCount}
                onChange={setField('questionCount')}
                hint="How many the paper should have."
              />
              <Input
                label={isMtf ? 'Marks per statement' : 'Marks per question'}
                type="number"
                required
                min={0}
                step={0.5}
                value={settings.marksPerQuestion}
                onChange={setField('marksPerQuestion')}
              />
              <Input
                label="Deduction (%)"
                type="number"
                required
                min={0}
                max={100}
                step={5}
                value={settings.deductionPercent}
                onChange={setField('deductionPercent')}
                hint="Of the marks per answer, taken for a wrong one."
              />
            </div>

            <p
              className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900 dark:bg-brand-950/60 dark:text-brand-200"
              aria-live="polite"
            >
              {target} {target === 1 ? 'question' : 'questions'}
              {isMtf && <> × {stems} statements</>} × {marking.marksPerQuestion} {marking.marksPerQuestion === 1 ? 'mark' : 'marks'} ={' '}
              <strong>{totalMarks} marks</strong>
              {' · '}
              {deduction > 0 ? (
                <>
                  wrong {isMtf ? 'statement' : 'answer'} <strong>−{deduction}</strong>
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
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {written} of {target} questions written
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {incomplete > 0
                ? `${incomplete} ${incomplete === 1 ? 'question is' : 'questions are'} missing a stem, an option or the answer key.`
                : written >= target && target > 0
                  ? 'Paper is complete.'
                  : 'Add questions below. Each one saves when you move on from it.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={isMtf ? 'info' : 'brand'}>{TYPE_LABELS[settings.type]}</Badge>
            {incomplete > 0 && <Badge tone="warning">{incomplete} incomplete</Badge>}
            {written >= target && target > 0 && incomplete === 0 && <Badge tone="success">Complete</Badge>}
          </div>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={written}
          aria-valuemin={0}
          aria-valuemax={target}
        >
          <div
            className={cn('h-full rounded-full transition-[width]', written >= target ? 'bg-emerald-500' : 'bg-brand-600')}
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
              <Button onClick={() => addMutation.mutate({ examId: exam.id })} isLoading={addMutation.isPending}>
                <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
                Add question
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              marksLabel={marksLabel}
              onChange={(patch) => patchQuestion(question.id, patch)}
              onBlur={flushQuestion(question.id)}
              onDuplicate={() => duplicateMutation.mutate({ examId: exam.id, questionId: question.id })}
              onDelete={() => setDeleting(question)}
              onMove={(delta) => moveQuestion(question.id, delta)}
              canMoveUp={index > 0}
              canMoveDown={index < questions.length - 1}
            />
          ))}

          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => addMutation.mutate({ examId: exam.id })} isLoading={addMutation.isPending}>
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Add question {written + 1}
            </Button>
          </div>
        </div>
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
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ examId: exam.id, questionId: deleting.id })}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Delete question {questions.findIndex((q) => q.id === deleting?.id) + 1}? The ones after it move up.
        </p>
      </Modal>
    </div>
  );
}
