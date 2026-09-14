import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaTrophy, FaUsers, FaChartSimple, FaArrowTrendUp, FaChevronLeft, FaChevronRight, FaRotateRight } from 'react-icons/fa6';
import { fetchPositionExams, fetchExamPositions } from './api/exams.api.js';
import { demoExams, demoPositions } from './demo-positions.js';
import DashboardPageHeader from '@/features/student-dashboard/components/DashboardPageHeader.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { formatDateTime } from '@/lib/utils';

const SELECT = 'mt-1 h-11 w-full min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-surface-dark dark:text-brand-200';
const number = new Intl.NumberFormat('en', { maximumFractionDigits: 3 });
const displayMark = value => value == null ? '--' : number.format(value);

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
  const statistics = [
    { label: 'Students ranked', value: number.format(data.participants), icon: FaUsers },
    { label: 'Highest mark', value: displayMark(data.highestScore), icon: FaArrowTrendUp },
    { label: 'Average mark', value: displayMark(data.averageScore), icon: FaChartSimple },
  ];

  return (
    <div className="space-y-6" aria-busy={isFetching}>
      <section aria-labelledby="your-position" className="border-y border-brand-300 bg-brand-50/80 px-4 py-5 sm:px-6 dark:bg-brand-950/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="your-position" className="text-sm font-bold text-brand-700 dark:text-brand-300">Your exam position</h2>
          <Badge tone={data.provisional ? 'neutral' : 'success'}>{data.provisional ? 'Provisional' : 'Final'}</Badge>
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-lg border border-brand-300 bg-white text-brand-700 dark:bg-surface-dark dark:text-brand-300">
              <FaTrophy aria-hidden="true" className="h-4 w-4" />
              <span className="mt-1 text-xl font-extrabold tabular-nums">{me ? `#${number.format(me.rank)}` : '--'}</span>
            </div>
            <div className="min-w-0">
              <p className="break-words text-base font-bold text-stone-900 dark:text-white">{me?.name ?? 'No submitted result'}</p>
              {me ? <>
                <p className="mt-1 text-sm text-stone-600 dark:text-brand-200">{me.tied ? 'Joint position' : 'Position'} {number.format(me.rank)} of {number.format(data.participants)}</p>
                <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">{displayMark(me.score)} / {displayMark(me.totalMarks)} marks</p>
              </> : <p className="mt-1 text-sm text-stone-600 dark:text-brand-200">Not ranked in this exam</p>}
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 border-t border-brand-200 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {statistics.map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 self-center">
              <dt className="flex flex-col gap-2 text-xs text-stone-600 dark:text-brand-200"><Icon aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-300" />{label}</dt>
              <dd className="mt-1 break-words text-lg font-bold tabular-nums text-stone-900 dark:text-white">{value}</dd>
            </div>)}
          </dl>
        </div>
      </section>

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
                  <th scope="col" className="w-24 px-3 py-3 text-right sm:w-36 sm:px-5">Marks</th>
                  <th scope="col" className="hidden w-32 px-5 py-3 text-right sm:table-cell">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {data.items.map((entry, index) => <tr key={page * limit + index} aria-current={entry.isMe ? 'true' : undefined} className={entry.isMe ? 'bg-brand-50 dark:bg-brand-950' : 'even:bg-stone-50/70 dark:even:bg-surface-dark/60'}>
                  <td className="px-3 py-4 align-top sm:px-5">
                    <span className={`font-bold tabular-nums ${entry.rank <= 3 ? 'text-brand-700 dark:text-brand-300' : 'text-stone-700 dark:text-brand-200'}`}>#{number.format(entry.rank)}</span>
                    {entry.tied && <span className="mt-0.5 block text-xs text-stone-500 dark:text-brand-200">Joint</span>}
                  </td>
                  <th scope="row" className="break-words px-3 py-4 font-medium text-stone-900 sm:px-5 dark:text-white">
                    {entry.name}{entry.isMe && <span className="ml-2 inline-block text-xs font-bold text-brand-700 dark:text-brand-300">You</span>}
                    <span className="mt-1 block text-xs font-normal text-stone-500 sm:hidden dark:text-brand-200">{entry.passed ? 'Passed' : 'Not passed'}</span>
                  </th>
                  <td className="px-3 py-4 text-right tabular-nums sm:px-5"><span className="font-semibold text-stone-900 dark:text-white">{displayMark(entry.score)}</span><span className="block text-xs text-stone-500 sm:inline dark:text-brand-200"> / {displayMark(entry.totalMarks)}</span></td>
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
              <div className="grid gap-4 border-b border-stone-200 pb-5 sm:grid-cols-2">
                <label className="min-w-0 text-xs font-semibold text-stone-600 dark:text-brand-200">Course
                  <select className={SELECT} value={courseId} onChange={event => setParams(event.target.value ? { courseId: event.target.value } : {})}>
                    <option value="">All courses</option>
                    {courses.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
                  </select>
                </label>
                <label className="min-w-0 text-xs font-semibold text-stone-600 dark:text-brand-200">Exam
                  <select className={SELECT} value={selected?.id ?? ''} onChange={event => setParams({ examId: event.target.value })}>
                    {!selected && <option value="">No exams</option>}
                    {filtered.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                  </select>
                </label>
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