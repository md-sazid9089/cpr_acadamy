import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FaRegStar, FaStar } from 'react-icons/fa6';
import ExamTimer from './components/ExamTimer.jsx';
import SbaQuestion from './components/SbaQuestion.jsx';
import MtfQuestion from './components/MtfQuestion.jsx';
import { fetchExamPaper, saveAnswer, submitExam } from './api/exams.api.js';
import Card from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { QUESTION_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

/** Has this question been answered at all? MTF counts any marked stem. */
function isAnswered(answer) {
  if (answer == null) return false;
  if (typeof answer === 'string') return answer.length > 0;
  return Object.keys(answer).length > 0;
}

/** Exam-taking screen at /dashboard/exams/:examId. */
export default function ExamRunner() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [flagged, setFlagged] = useState(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: paper, isLoading } = useQuery({
    queryKey: ['exams', 'paper', examId],
    queryFn: () => fetchExamPaper(examId),
    enabled: Boolean(examId),
    // A paper must not be refetched mid-attempt — that would reshuffle state.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const submitMutation = useMutation({
    mutationFn: submitExam,
    onSuccess: () => navigate(`/dashboard/exams/${examId}/result`, { replace: true }),
  });

  const questions = paper?.questions ?? [];
  const current = questions[index];

  const answeredCount = useMemo(
    () => questions.filter((question) => isAnswered(answers[question.id])).length,
    [questions, answers],
  );

  const handleAnswer = useCallback(
    (questionId, answer) => {
      setAnswers((previous) => ({ ...previous, [questionId]: answer }));
      // Autosave so a dropped connection doesn't lose the attempt.
      saveAnswer({ examId, questionId, answer }).catch(() => {
        /* TODO: queue and retry once the API is real. */
      });
    },
    [examId],
  );

  const handleSubmit = useCallback(() => {
    submitMutation.mutate({ examId, answers });
  }, [examId, answers, submitMutation]);

  const toggleFlag = (questionId) => {
    setFlagged((previous) => {
      const next = new Set(previous);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  if (isLoading || !current) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading exam paper…" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="space-y-5 lg:col-span-3">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">{paper.title}</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {questions.length} questions · {paper.totalMarks} marks
              {paper.negativeMarking ? ` · −${paper.negativeMarking} per wrong answer` : ''}
            </p>
          </div>

          {/* Auto-submits the moment the countdown reaches zero. */}
          <ExamTimer
            endsAt={paper.endsAt}
            durationMinutes={paper.durationMinutes}
            onExpire={handleSubmit}
          />
        </Card>

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
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
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

          <p className="mt-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {current.stem}
          </p>

          <div className="mt-5">
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
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
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
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Question palette</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {answeredCount} of {questions.length} answered
          </p>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((question, questionIndex) => {
              const answered = isAnswered(answers[question.id]);
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setIndex(questionIndex)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                    questionIndex === index
                      ? 'bg-brand-600 text-white'
                      : flagged.has(question.id)
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : answered
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
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
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You have answered <strong>{answeredCount}</strong> of {questions.length} questions
          {flagged.size > 0 && `, with ${flagged.size} flagged for review`}.
        </p>
      </Modal>
    </div>
  );
}
