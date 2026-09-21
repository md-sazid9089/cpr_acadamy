import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaTrophy, FaUsers, FaChartSimple, FaArrowTrendUp, FaChevronLeft, FaChevronRight, FaRotateRight } from 'react-icons/fa6';
import { fetchPositionExams, fetchExamPositions } from './api/exams.api.js';
import { demoExams, demoPositions } from './demo-positions.js';
import DashboardPageHeader from '@/features/student-dashboard/components/DashboardPageHeader.jsx';
import { StatCard } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { Select } from '@/components/ui/Input.jsx';
import { cn, formatDateTime } from '@/lib/utils';

const number = new Intl.NumberFormat('en', { maximumFractionDigits: 3 });
const displayMark = value => value == null ? '--' : number.format(value);

/** 3px proportional bar — how a score compares to the exam's top score. */
function ScoreBar({ share, className }) {
  return (
    <div className={cn('h-[3px] overflow-hidden rounded-full bg-stone-200 dark:bg-white/10', className)}>
      <div className="h-full rounded-full bg-brand-400 dark:bg-brand-500" style={{ width: `${share}%` }} />
    </div>
  );
}

function Standings({ examId, demo = false }) {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [demo ? 'exams-demo' : 'exams', 'positions', examId, page, limit],
    queryFn: ({ signal }) => demo ? demoPositions(examId, { limit, offset: page * limit }) : fetchExamPositions(examId, { limit, offset: page * limit, signal }),
    refetchInterval: demo ? false : 30000,
    retry: false,
  });

  if (isLoading) return <ContentSkeleton variant="table" label="Loading positions" />;
  if (error || !data) return <EmptyState
    title={error?.code === 'RESULTS_NOT_RELEASED' ? 'Positions not released yet' : 'Positions unavailable'}
    description={error?.message}
    action={<Button variant="outline" onClick={() => refetch()}><FaRotateRight aria-hidden="true" />Retry</Button>}
  />;

  const me = data.me;
  const pages = Math.max(1, Math.ceil(data.participants / limit));
  // Numbers alone don't say much — the average tile earns its keep by comparing it to your own score.
  const aboveAvg = me && data.averageScore != null ? Math.round((me.score - data.averageScore) * 1000) / 1000 : null;
  const scoreShare = value => data.highestScore ? Math.min(100, Math.max(4, (value / data.highestScore) * 100)) : 0;

  return (
    <div className="space-y-6" aria-busy={isFetching}>
      {/* 1. Self-comparison: one clear read — rank, score, and where it sits versus the top score. */}
      <section aria-labelledby="your-position" className="rounded-2xl border border-brand-200 bg-brand-50/80 p-5 sm:p-6 dark:border-brand-900 dark:bg-brand-950/40">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-brand-300 bg-white text-brand-700 dark:bg-surface-dark dark:text-brand-300">
            {me?.rank === 1 && <FaTrophy aria-hidden="true" className="h-3.5 w-3.5" />}
            <span className="text-lg font-extrabold tabular-nums">{me ? `#${number.format(me.rank)}` : '--'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="your-position" className="text-sm font-bold text-stone-900 dark:text-white">Your position</h2>
              <Badge tone={data.provisional ? 'neutral' : 'success'}>{data.provisional ? 'Provisional' : 'Final'}</Badge>
            </div>
            {me ? (
              <>
                <p className="mt-1 truncate text-sm font-semibold text-stone-900 dark:text-white">{me.name}</p>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-brand-200">{me.tied ? 'Joint position' : 'Position'} {number.format(me.rank)} of {number.format(data.participants)}</p>
                <p className="mt-1 text-base font-bold text-brand-700 dark:text-brand-300">
                  {displayMark(me.score)} <span className="font-normal text-stone-500 dark:text-brand-200">/ {displayMark(me.totalMarks)} marks</span>
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-white">No submitted result</p>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-brand-200">Not ranked in this exam</p>
              </>
            )}
          </div>
        </div>
        {me && data.highestScore ? (
          <div className="mt-4">
            <ScoreBar share={scoreShare(me.score)} className="h-1.5 bg-white dark:bg-surface-dark" />
            <p className="mt-1.5 text-[11px] text-stone-500 dark:text-brand-200">Your score vs. the top score of {displayMark(data.highestScore)}</p>
          </div>
        ) : null}
      </section>

      {/* 2. KPI tiles — each number carries its own interpretation, not just a raw figure. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Students ranked" value={number.format(data.participants)} icon={<FaUsers aria-hidden="true" />} />
        <StatCard label="Highest mark" value={displayMark(data.highestScore)} icon={<FaArrowTrendUp aria-hidden="true" />} />
        <StatCard
          label="Average mark"
          value={displayMark(data.averageScore)}
          icon={<FaChartSimple aria-hidden="true" />}
          hint={aboveAvg == null ? undefined : `You scored ${aboveAvg >= 0 ? '+' : ''}${number.format(aboveAvg)} ${aboveAvg >= 0 ? 'above' : 'below'} avg`}
        />
      </div>

      {/* 3. Peer comparison. */}
      <section aria-labelledby="standings-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="standings-title" className="text-base font-bold text-stone-900 dark:text-white">Exam standings</h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">{data.pending ? `${number.format(data.pending)} ${data.pending === 1 ? 'attempt' : 'attempts'} awaiting submission or processing` : `${number.format(data.participants)} submitted ${data.participants === 1 ? 'result' : 'results'}`}</p>
          </div>
          <div className="flex items-center gap-3">
            {me && !demo && <Button size="sm" variant="outline" to={`/dashboard/exams/${examId}/result`}>My result</Button>}
            <Button size="sm" variant="outline" title="Refresh positions" aria-label="Refresh positions" disabled={isFetching} onClick={() => refetch()}><FaRotateRight aria-hidden="true" className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /></Button>
          </div>
        </div>

        {!data.participants ? <EmptyState title="No submitted results yet" /> : <>
          <div className="overflow-x-auto border-y border-stone-200 bg-white/80 dark:bg-surface-dark-subtle/80">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">{data.exam.title}: student positions ordered by highest mark. Equal marks share a position.</caption>
              <thead className="bg-stone-100 text-xs text-stone-600 dark:bg-surface-dark dark:text-brand-200">
                <tr>
                  <th scope="col" className="w-20 px-3 py-3 sm:w-28 sm:px-5">Position</th>
                  <th scope="col" className="px-3 py-3 sm:px-5">Student</th>
                  <th scope="col" className="w-28 px-3 py-3 text-right sm:w-40 sm:px-5">Score</th>
                  <th scope="col" className="hidden w-32 px-5 py-3 text-right sm:table-cell">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {data.items.map((entry, index) => <tr key={page * limit + index} aria-current={entry.isMe ? 'true' : undefined} className={entry.isMe ? 'bg-brand-50 dark:bg-brand-950' : 'even:bg-stone-50/70 dark:even:bg-surface-dark/60'}>
                  <td className="px-3 py-4 align-top sm:px-5">
                    <span className={`inline-flex items-center gap-1 font-bold tabular-nums ${entry.rank <= 3 ? 'text-brand-700 dark:text-brand-300' : 'text-stone-700 dark:text-brand-200'}`}>
                      {entry.rank === 1 && <FaTrophy aria-hidden="true" className="h-3 w-3" />}
                      #{number.format(entry.rank)}
                    </span>
                    {entry.tied && <span className="mt-0.5 block text-xs text-stone-500 dark:text-brand-200">Joint</span>}
                  </td>
                  <th scope="row" className="break-words px-3 py-4 font-medium text-stone-900 sm:px-5 dark:text-white">
                    {entry.name}{entry.isMe && <span className="ml-2 inline-block text-xs font-bold text-brand-700 dark:text-brand-300">You</span>}
                    <span className="mt-1 block text-xs font-normal text-stone-500 sm:hidden dark:text-brand-200">{entry.passed ? 'Passed' : 'Not passed'}</span>
                  </th>
                  <td className="px-3 py-4 text-right sm:px-5">
                    <span className="tabular-nums"><span className="font-semibold text-stone-900 dark:text-white">{displayMark(entry.score)}</span><span className="block text-xs text-stone-500 sm:inline dark:text-brand-200"> / {displayMark(entry.totalMarks)}</span></span>
                    <ScoreBar share={scoreShare(entry.score)} className="mt-1.5 ml-auto w-16" />
                  </td>
                  <td className="hidden px-5 py-4 text-right sm:table-cell"><Badge tone={entry.passed ? 'success' : 'neutral'}>{entry.passed ? 'Passed' : 'Not passed'}</Badge></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600 dark:text-brand-200">
            <p role="status">Showing {data.items.length ? number.format(page * limit + 1) : 0}-{data.items.length ? number.format(page * limit + data.items.length) : 0} of {number.format(data.participants)} {data.participants === 1 ? 'student' : 'students'}</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">Rows
                <select aria-label="Rows per page" value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(0); }} className="h-10 rounded-lg border border-stone-200 bg-white px-2 dark:bg-surface-dark">{[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}</select>
              </label>
              <nav aria-label="Standings pages" className="flex items-center gap-2">
                <Button size="sm" variant="outline" aria-label="Previous page" title="Previous page" disabled={!page || isFetching} onClick={() => setPage(value => value - 1)}><FaChevronLeft aria-hidden="true" /></Button>
                <span className="min-w-16 text-center tabular-nums">{page + 1} / {pages}</span>
                <Button size="sm" variant="outline" aria-label="Next page" title="Next page" disabled={page + 1 >= pages || isFetching} onClick={() => setPage(value => value + 1)}><FaChevronRight aria-hidden="true" /></Button>
              </nav>
            </div>
          </div>
        </>}
      </section>
    </div>
  );
}

export default function ExamPositions({ demo = false } = {}) {
  const [params, setParams] = useSearchParams();
  const { data: exams = [], isLoading, error, refetch } = useQuery({
    queryKey: [demo ? 'exams-demo' : 'exams', 'position-options'],
    queryFn: demo ? () => demoExams : fetchPositionExams,
  });
  const requestedExam = exams.find(exam => exam.id === params.get('examId'));
  const courseId = requestedExam?.courseId ?? params.get('courseId') ?? '';
  const courses = [...new Map(exams.map(exam => [exam.courseId, exam.courseTitle])).entries()];
  const filtered = exams.filter(exam => !courseId || exam.courseId === courseId);
  const released = exam => !exam.resultsAt || new Date(exam.resultsAt).getTime() <= Date.now();
  const selected = requestedExam ?? filtered.find(exam => exam.status === 'submitted' && released(exam)) ?? filtered.find(released) ?? filtered[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DashboardPageHeader title="Exam Positions" backTo={demo ? '/' : '/dashboard/exams'} showDashboardLink={!demo} />
      {demo ? <div role="note" className="flex flex-wrap items-center gap-3 border-b border-stone-200 pb-4 text-sm text-stone-600 dark:text-brand-200">
        <Badge tone="neutral">Demo data</Badge><span>Fictional students and scores</span>
      </div> : import.meta.env?.DEV && <div className="flex justify-end"><Button variant="outline" to="/demo/exam-positions">Preview sample data</Button></div>}
      {isLoading ? <ContentSkeleton variant="table" label="Loading exams" />
        : error ? <EmptyState title="Exams unavailable" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} />
          : params.has('examId') && !requestedExam ? <EmptyState title="Exam unavailable" action={<Button variant="outline" onClick={() => setParams({})}>All exam positions</Button>} />
          : !exams.length ? <EmptyState title="No exams available" action={<Button to="/dashboard/courses">My courses</Button>} />
            : <>
              {/* Course and exam side by side — one glance to see and change both. */}
              <div className="grid gap-4 border-b border-stone-200 pb-5 sm:grid-cols-2">
                {courses.length > 1 && (
                  <Select
                    label="Course"
                    value={courseId}
                    onChange={event => setParams(event.target.value ? { courseId: event.target.value } : {})}
                  >
                    <option value="">All courses</option>
                    {courses.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
                  </Select>
                )}
                <Select
                  label="Exam"
                  value={selected?.id ?? ''}
                  onChange={event => setParams({ examId: event.target.value })}
                >
                  {!selected && <option value="">No exams</option>}
                  {filtered.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                </Select>
              </div>
              {selected && <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="min-w-0 break-words text-lg font-bold text-stone-900 dark:text-white">{selected.title}</h2>
                <p className="text-xs text-stone-500 dark:text-brand-200">{selected.totalMarks} marks / {selected.durationMinutes} min{!released(selected) && ` / Results ${formatDateTime(selected.resultsAt)}`}</p>
              </div>}
              {selected ? <Standings key={`${demo}:${selected.id}`} examId={selected.id} demo={demo} /> : <EmptyState title="No exams in this course" />}
            </>}
    </div>
  );
}
