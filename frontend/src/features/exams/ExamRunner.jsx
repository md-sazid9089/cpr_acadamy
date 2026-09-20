import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegStar, FaStar } from 'react-icons/fa6';
import ExamTimer from './components/ExamTimer.jsx';
import SbaQuestion from './components/SbaQuestion.jsx';
import MtfQuestion from './components/MtfQuestion.jsx';
import { fetchExamPaper, saveAnswer, submitExam } from './api/exams.api.js';
import { answerState } from './answer-state.js';
import { createAnswerQueue } from './answer-queue.js';
import Card from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { QUESTION_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

/** Exam-taking screen at /dashboard/exams/:examId. */
export default function ExamRunner() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [flagged, setFlagged] = useState(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [otherTabOpen, setOtherTabOpen] = useState(false);
  const [versionConflict, setVersionConflict] = useState(false);
  const queue = useRef(null);
  const versionRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!examId || !('BroadcastChannel' in window)) return undefined;
    const tabId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const channel = new BroadcastChannel(`cpr-exam-attempt:${examId}`);
    const announce = () => channel.postMessage({ type: 'active', tabId });
    channel.onmessage = (event) => {
      if (event.data?.tabId === tabId) return;
      if (event.data?.type === 'active') { setOtherTabOpen(true); announce(); }
    };
    announce();
    return () => { channel.close(); };
  }, [examId]);

  useEffect(() => {
    const autosave = createAnswerQueue(async payload => {
      try {
        const saved = await saveAnswer({ examId, ...payload, version: versionRef.current });
        versionRef.current = saved.version;
      } catch (error) {
        if (error.code === 'ATTEMPT_VERSION_CONFLICT') setVersionConflict(true);
        throw error;
      }
    }, setSaveStatus);
    queue.current = autosave;
    const retry = () => { if (autosave.hasPending) void autosave.flush(); };
    const warn = (event) => {
      if (autosave.hasPending) { event.preventDefault(); event.returnValue = ''; }
    };
    const timer = window.setInterval(retry, 5000);
    window.addEventListener('online', retry);
    window.addEventListener('beforeunload', warn);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', retry);
      window.removeEventListener('beforeunload', warn);
      autosave.dispose();
    };
  }, [examId]);

  const { data: paper, isLoading, error } = useQuery({
    queryKey: ['exams', 'paper', examId],
    queryFn: () => fetchExamPaper(examId),
    enabled: Boolean(examId),
    // A paper must not be refetched mid-attempt — that would reshuffle state.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Resuming an attempt restores the answers already autosaved server-side.
  useEffect(() => {
    if (paper?.answers) setAnswers(paper.answers);
    if (paper?.version !== undefined) versionRef.current = paper.version;
  }, [paper]);

  // A paper that was already handed in has nothing left to answer.
  useEffect(() => {
    if (error?.code === 'ALREADY_SUBMITTED') navigate(`/dashboard/exams/${examId}/result`, { replace: true });
  }, [error, examId, navigate]);

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      await queue.current?.flush();
      return submitExam({ ...payload, version: versionRef.current });
    },
    onSuccess: () => {
      queue.current?.dispose();
      navigate(`/dashboard/exams/${examId}/result`, { replace: true });
    },
    onError: (failure) => {
      if (failure.code === 'ALREADY_SUBMITTED') navigate(`/dashboard/exams/${examId}/result`, { replace: true });
      if (failure.code === 'ATTEMPT_VERSION_CONFLICT') setVersionConflict(true);
    },
  });

  const questions = paper?.questions ?? [];
  const current = questions[index];

  const answeredCount = useMemo(
    () => questions.filter((question) => answerState(question, answers[question.id]) === 'answered').length,
    [questions, answers],
  );
  const partialCount = questions.filter(question => answerState(question, answers[question.id]) === 'partial').length;

  const handleAnswer = useCallback(
    (questionId, answer) => {
      setAnswers((previous) => ({ ...previous, [questionId]: answer }));
      queue.current?.enqueue(questionId, answer);
    },
    [examId],
  );

  const handleSubmit = useCallback(() => {
    submitMutation.mutate({ examId, answers });
  }, [examId, answers, submitMutation]);

  const reloadLatestAttempt = useCallback(async () => {
    const latest = await fetchExamPaper(examId);
    queue.current?.clear();
    setAnswers(latest.answers ?? {});
    versionRef.current = latest.version;
    setVersionConflict(false);
    setSaveStatus('saved');
    queryClient.setQueryData(['exams', 'paper', examId], latest);
  }, [examId, queryClient]);

  const toggleFlag = (questionId) => {
    setFlagged((previous) => {
      const next = new Set(previous);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  if (error && error.code !== 'ALREADY_SUBMITTED') {
    return (
      <EmptyState
        title="This exam is not available"
        description={error.message}
        action={<Button to="/dashboard/exams">Back to exams</Button>}
      />
    );
  }

  if (isLoading || !current) {
    return (
      <ContentSkeleton variant="exam" label="Loading exam paper" />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="space-y-5 lg:col-span-3">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h1 className="text-base font-bold text-stone-900 dark:text-white">{paper.title}</h1>
            <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">
              {questions.length} questions · {paper.totalMarks} marks
              {paper.negativeMarking ? ` · ${paper.negativeMarking}% deduction per wrong answer` : ' · No negative marking'}
            </p>
          </div>

          {/* Auto-submits the moment the countdown reaches zero. */}
          <ExamTimer
            endsAt={paper.endsAt}
            durationMinutes={paper.durationMinutes}
            onExpire={handleSubmit}
          />
        </Card>

        {otherTabOpen && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">This exam is also open in another tab. Use one tab only to avoid answer conflicts.</p>}
        {versionConflict && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">Answers were changed from another tab, so this tab did not overwrite them. <Button size="sm" variant="outline" onClick={reloadLatestAttempt} className="ml-3">Reload latest answers</Button></div>}

        <div role="status" aria-live="polite" className={saveStatus === 'error' ? 'text-sm text-red-700' : 'text-sm text-stone-600 dark:text-brand-200'}>
          {saveStatus === 'error' ? 'Answers not saved. Retrying...' : saveStatus === 'saving' ? 'Saving answers...' : 'All answers saved'}
          {saveStatus === 'error' && <Button size="sm" variant="outline" onClick={() => queue.current?.flush()} className="ml-3">Retry now</Button>}
        </div>
        {submitMutation.isError && <p role="alert" className="text-sm text-red-700">Submission failed: {submitMutation.error.message}</p>}

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge tone="brand">Question {index + 1}</Badge>
              <Badge tone="neutral">
                {current.type === QUESTION_TYPES.SBA ? 'Single Best Answer' : 'Multiple True/False'}
              </Badge>
            </div>

            <button
              type="button"
              onClick={() => toggleFlag(current.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                flagged.has(current.id)
                  ? 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                  : 'bg-stone-100 text-stone-600 dark:bg-surface-dark dark:text-brand-200',
              )}
            >
              <span className="flex items-center gap-1.5">
                {flagged.has(current.id) ? (
                  <>
                    <FaStar aria-hidden="true" className="h-3 w-3" /> Flagged
                  </>
                ) : (
                  <>
                    <FaRegStar aria-hidden="true" className="h-3 w-3" /> Flag for review
                  </>
                )}
              </span>
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-stone-800 dark:text-brand-200">
            {current.stem}
          </p>
          {current.imageUrl && <a href={current.imageUrl} target="_blank" rel="noreferrer" className="mt-4 block"><img src={current.imageUrl} alt={`Question ${index + 1} clinical image`} className="max-h-[32rem] w-full object-contain" /></a>}

          <fieldset disabled={submitMutation.isPending} className="mt-5">
            {current.type === QUESTION_TYPES.SBA ? (
              <SbaQuestion
                question={current}
                value={answers[current.id]}
                onChange={(optionId) => handleAnswer(current.id, optionId)}
              />
            ) : (
              <MtfQuestion
                question={current}
                value={answers[current.id]}
                onChange={(next) => handleAnswer(current.id, next)}
              />
            )}
          </fieldset>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-stone-200 pt-5 dark:border-stone-200">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
            >
              Previous
            </Button>

            {index === questions.length - 1 ? (
              <Button onClick={() => setConfirmOpen(true)}>Submit exam</Button>
            ) : (
              <Button onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}>
                Next question
              </Button>
            )}
          </div>
        </Card>
      </div>

      <aside>
        <Card className="sticky top-24 p-5">
          <p className="text-sm font-semibold text-stone-900 dark:text-white">Question palette</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">
            {answeredCount} of {questions.length} answered · {partialCount} partial
          </p>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((question, questionIndex) => {
              const state = answerState(question, answers[question.id]);
              return (
                <button
                  key={question.id}
                  type="button"
                  aria-label={`Question ${questionIndex + 1}: ${state}${flagged.has(question.id) ? ', flagged' : ''}`}
                  aria-current={questionIndex === index ? 'step' : undefined}
                  title={`${state}${flagged.has(question.id) ? ', flagged' : ''}`}
                  data-answer-state={state}
                  onClick={() => setIndex(questionIndex)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                    questionIndex === index && 'ring-2 ring-brand-600 ring-offset-2',
                    flagged.has(question.id) && 'underline decoration-2 underline-offset-4',
                    state === 'partial'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
                      : state === 'answered'
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                          : 'bg-stone-100 text-stone-500 dark:bg-surface-dark dark:text-brand-200',
                  )}
                >
                  {questionIndex + 1}
                </button>
              );
            })}
          </div>

          <Button fullWidth className="mt-5" onClick={() => setConfirmOpen(true)}>
            Submit exam
          </Button>
        </Card>
      </aside>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit this exam?"
        description="You cannot change your answers after submitting."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep working
            </Button>
            <Button isLoading={submitMutation.isPending} onClick={handleSubmit}>
              Submit now
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600 dark:text-brand-200">
          You have answered <strong>{answeredCount}</strong> of {questions.length} questions
          {partialCount > 0 && `, with ${partialCount} partially answered`}
          {flagged.size > 0 && `, with ${flagged.size} flagged for review`}.
        </p>
      </Modal>
    </div>
  );
}
