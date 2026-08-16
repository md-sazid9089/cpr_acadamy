import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SbaQuestion from './components/SbaQuestion.jsx';
import MtfQuestion from './components/MtfQuestion.jsx';
import { fetchExamResult } from './api/exams.api.js';
import Card, { CardBody, CardHeader, StatCard } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { QUESTION_TYPES } from '@/constants';
import { formatDateTime } from '@/lib/utils';

/** Score summary plus per-question review at /dashboard/exams/:examId/result. */
export default function ExamResult() {
  const { examId } = useParams();

  const { data: result, isLoading } = useQuery({
    queryKey: ['exams', 'result', examId],
    queryFn: () => fetchExamResult(examId),
    enabled: Boolean(examId),
  });

  if (isLoading || !result) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading result…" />
      </div>
    );
  }

  const percentage = Math.round((result.score / result.totalMarks) * 100);

  return (
    <div className="space-y-6">
      <Card className="p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Your score</p>
        <p className="mt-1 text-4xl font-extrabold text-brand-700 dark:text-brand-400">
          {result.score}
          <span className="text-xl text-slate-400"> / {result.totalMarks}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {percentage}% · submitted {formatDateTime(result.submittedAt)}
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Correct" value={result.correctCount} />
        <StatCard label="Wrong" value={result.wrongCount} />
        <StatCard label="Skipped" value={result.skippedCount} />
        <StatCard label="Rank" value={`#${result.rank}`} hint={`of ${result.participants} candidates`} />
      </div>

      <Card>
        <CardHeader title="Answer review" description="Correct answers with explanations." />
        <CardBody className="space-y-6">
          {result.review?.map((question, index) => (
            <div key={question.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Badge tone="brand">Question {index + 1}</Badge>
                <Badge tone="neutral">
                  {question.type === QUESTION_TYPES.SBA ? 'SBA' : 'MTF'}
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {question.stem}
              </p>

              <div className="mt-4">
                {question.type === QUESTION_TYPES.SBA ? (
                  <SbaQuestion
                    question={question}
                    value={question.yourAnswer}
                    correctAnswer={question.correctAnswer}
                    readOnly
                  />
                ) : (
                  <MtfQuestion
                    question={question}
                    value={question.yourAnswer}
                    correctAnswer={question.correctAnswer}
                    readOnly
                  />
                )}
              </div>

              {question.explanation && (
                <div className="mt-4 rounded-lg bg-surface-subtle p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Explanation</p>
                  <p className="mt-1">{question.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="flex gap-3">
        <Button to="/dashboard/exams" variant="outline">
          Back to exams
        </Button>
        <Button to="/dashboard/progress">See progress report</Button>
      </div>
    </div>
  );
}
