import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaCircleCheck } from 'react-icons/fa6';
import { useCourseExams } from '../api/courseHub.queries.js';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const EXAM_TABS = [
  { id: 'sba', label: 'SBA', description: 'Single Best Answer' },
  { id: 'mcq', label: 'MCQ', description: 'True / False' },
];

function ExamCard({ exam }) {
  const isRunning = exam.status === 'running';
  const isPublished = exam.status === 'published';

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700">
      <div>
        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {exam.title}
        </h3>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={exam.status} />
          <Badge tone="brand">{exam.type}</Badge>
        </div>

        {/* Meta */}
        <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Scheduled:</span>{' '}
            {formatDateTime(exam.scheduledAt)}
          </p>
          <p>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Duration:</span>{' '}
            {exam.durationMinutes} minutes
          </p>
          <p>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Questions:</span>{' '}
            {exam.questionCount} · {exam.totalMarks} marks
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="mt-4">
        {isRunning ? (
          <Link to={`/dashboard/exams/${exam.id}`}>
            <Button fullWidth size="sm">
              <FaClipboardList aria-hidden="true" className="h-3 w-3" />
              Start Exam
            </Button>
          </Link>
        ) : isPublished ? (
          <Link to={`/dashboard/exams/${exam.id}/result`}>
            <Button fullWidth variant="outline" size="sm">
              <FaCircleCheck aria-hidden="true" className="h-3 w-3" />
              View Result
            </Button>
          </Link>
        ) : (
          <Button fullWidth variant="outline" size="sm" disabled>
            Not open yet
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Exam tab — shows SBA and MCQ exam categories with a sub-tab toggle.
 * SBA = Single Best Answer (option-based, pick one of A–E).
 * MCQ = Multiple True/False (each stem answered True or False).
 */
export default function ExamTab({ courseSlug }) {
  const [activeType, setActiveType] = useState('sba');
  const { data: exams, isLoading } = useCourseExams(courseSlug);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Loading exams…" />
      </div>
    );
  }

  const currentExams = activeType === 'sba' ? (exams?.sba ?? []) : (exams?.mcq ?? []);

  return (
    <div className="space-y-5">
      {/* ── Sub-tab toggle: SBA | MCQ ── */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {EXAM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveType(tab.id)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-center text-xs font-semibold transition-all sm:text-sm',
              activeType === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <span className="block">{tab.label}</span>
            <span className="block text-[10px] font-medium opacity-80">{tab.description}</span>
          </button>
        ))}
      </div>

      {/* ── Exam cards ── */}
      {currentExams.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <FaClipboardList aria-hidden="true" className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
            No {activeType === 'sba' ? 'SBA' : 'MCQ'} exams available yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {currentExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
}
