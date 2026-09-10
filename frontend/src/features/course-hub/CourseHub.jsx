import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaEye, FaClipboardList, FaCalendarDays, FaMagnifyingGlass } from 'react-icons/fa6';
import AtAGlanceTab from './tabs/AtAGlanceTab.jsx';
import ExamTab from './tabs/ExamTab.jsx';
import ScheduleTab from './tabs/ScheduleTab.jsx';
import DashboardPageHeader from '@/features/student-dashboard/components/DashboardPageHeader.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Button from '@/components/ui/Button.jsx';
import { useMyCourses } from '@/features/student-dashboard/api/dashboard.queries.js';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'at-a-glance', label: 'At a glance', icon: FaEye },
  { id: 'exam', label: 'Exam', icon: FaClipboardList },
  { id: 'schedule', label: 'Schedule', icon: FaCalendarDays },
];

/**
 * Course Hub page at /dashboard/course/:slug.
 *
 * The "Continue Course" button on My Courses navigates here.  Three tabbed
 * sections — At a Glance (videos by date), Exam (SBA & MCQ), and Schedule
 * (batch routine) — let the student choose what to do next.
 */
export default function CourseHub() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('at-a-glance');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: courses = [], isLoading: coursesLoading } = useMyCourses();
  const course = courses.find((c) => c.slug === slug);

  if (coursesLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading course…" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-5">
        <DashboardPageHeader title="Course" backTo="/dashboard/courses" />
        <EmptyState
          title="You are not enrolled in this batch"
          description="Only batches you have enrolled in appear here. Browse the catalogue to find it."
          action={<Button to="/batches">Browse batches</Button>}
        />
      </div>
    );
  }

  const progressValue = course?.progress ?? 0;

  return (
    <div className="space-y-5">
      <DashboardPageHeader title={course?.title ?? 'Course'} backTo="/dashboard/courses" />

      {/* ── Course Info Card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Section title header */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white sm:text-base">
          {course?.title ?? 'Course Details'}
        </div>

        <div className="space-y-5 p-5">
          {/* Reg No */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              Reg No:
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                {course?.regNo ?? '—'}
              </strong>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Progress</span>
              <span className="text-slate-900 dark:text-white">{progressValue}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>

          {/* Search Schedule */}
          <div className="relative">
            <FaMagnifyingGlass
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              aria-label="Search schedule"
              placeholder="Search Schedule"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-800',
                'placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
                'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-brand-500',
              )}
            />
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div
        role="tablist"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-3 gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-white' : 'text-brand-500')}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Panels ── */}
      <div role="tabpanel">
        {activeTab === 'at-a-glance' && <AtAGlanceTab courseSlug={slug} />}
        {activeTab === 'exam' && <ExamTab courseSlug={slug} />}
        {activeTab === 'schedule' && <ScheduleTab courseSlug={slug} />}
      </div>
    </div>
  );
}
