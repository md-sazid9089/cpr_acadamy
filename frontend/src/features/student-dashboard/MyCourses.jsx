import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaTriangleExclamation, FaClockRotateLeft, FaPlay } from 'react-icons/fa6';
import { useMyCourses } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardTabs from './components/DashboardTabs.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { CATEGORY_SLUGS } from '@/constants';

const TABS = [
  { id: 'active', label: 'Active Batches', icon: FaCheck, iconColor: 'text-emerald-500' },
  { id: 'unpaid', label: 'Unpaid Batches', icon: FaTriangleExclamation, iconColor: 'text-amber-500' },
  { id: 'previous', label: 'Previous Batches', icon: FaClockRotateLeft, iconColor: 'text-brand-500' },
];

export default function MyCourses() {
  const { data: courses = [], isLoading } = useMyCourses();
  const [activeTab, setActiveTab] = useState('active');

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading your courses…" />
      </div>
    );
  }

  // Filter courses by tab status
  const filteredCourses = courses.filter((course) => {
    if (activeTab === 'active') return course.status === 'active' || !course.status;
    if (activeTab === 'unpaid') return course.status === 'pending_payment';
    if (activeTab === 'previous') return course.status === 'expired';
    return true;
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="My Courses" backTo="/dashboard" />

      <DashboardTabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

      {/* ── Main Section Container with Blue Header Bar ── */}
      <div className="overflow-hidden rounded-2xl border border-brand-400 bg-brand-50 shadow-sm dark:border-slate-700 dark:bg-surface-dark-subtle">
        {/* Blue Title Header Strip */}
        <div className="bg-brand-600 px-6 py-3 text-sm font-bold text-white sm:text-base">
          {TABS.find((t) => t.id === activeTab)?.label}
        </div>

        <div className="p-6">
          {filteredCourses.length === 0 ? (
            <EmptyState
              title={`No ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} found`}
              description="Browse our active batches and enroll to start learning."
              action={<Button to="/batches">Browse Batches</Button>}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredCourses.map((course) => {
                const categorySlug = CATEGORY_SLUGS[course.category] || 'fcps';
                const scheduleUrl = `/courses/${categorySlug}/${course.slug}/schedule`;
                const progressValue = course.progress ?? 0;
                // Read the record, not the tab: a card is only resumable when
                // the enrolment itself is running.
                const isActive = course.status === 'active' || !course.status;

                return (
                  <div
                    key={course.id}
                    className="flex flex-col justify-between rounded-2xl border-2 border-brand-300 bg-white p-6 shadow-sm transition-all hover:border-brand-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div>
                      {/* Course / Batch Title */}
                      <h2 className="text-center text-base font-bold text-brand-600 sm:text-lg dark:text-brand-300">
                        {course.title}
                      </h2>

                      {/* Discipline & Reg No Badge Box */}
                      <div className="my-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-xl bg-emerald-50/80 px-4 py-2 text-xs font-semibold text-slate-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-slate-300">
                        <span>
                          Discipline: <strong className="text-emerald-700 dark:text-emerald-400">{course.category || 'Medicine & Allied'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Reg No: <strong className="text-emerald-700 dark:text-emerald-400">2607{course.id.replace(/\D/g, '') || '6732'}</strong>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>Progress</span>
                          <span>{progressValue}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                      </div>

                      {/* Notice / Validity text */}
                      <p className="mt-3 text-center text-[11px] font-semibold leading-relaxed text-accent-600 dark:text-accent-400">
                        Your batch will remain active till "{course.category || 'FCPS P-I'}, December'26 final exam
                        (Expected 3rd December'26. Date will be reviewed &amp; adjusted after exam circular)"
                      </p>
                    </div>

                    {/* Primary action — only for a running batch, and only when
                        we know where the student left off. */}
                    {isActive && course.nextLesson && (
                      <Link
                        to={`/learn/${course.slug}/${course.nextLesson.id}`}
                        className="mt-6 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-center text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                      >
                        <FaPlay aria-hidden="true" className="h-3 w-3" />
                        Continue Course
                      </Link>
                    )}

                    {isActive && course.nextLesson && (
                      <p className="mt-2 truncate text-center text-[11px] text-slate-500 dark:text-slate-400">
                        Up next: {course.nextLesson.title}
                      </p>
                    )}

                    {/* 4 Action Buttons in 2x2 Grid */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Link
                        to={scheduleUrl}
                        className="flex items-center justify-center rounded-xl bg-brand-100 px-3 py-2.5 text-center text-xs font-bold text-brand-700 shadow-sm transition hover:bg-brand-200 dark:bg-slate-800 dark:text-brand-300 dark:hover:bg-slate-700"
                      >
                        View Schedule
                      </Link>

                      <Link
                        to={`/dashboard/learn/${course.slug}`}
                        className="flex items-center justify-center rounded-xl bg-brand-100 px-3 py-2.5 text-center text-xs font-bold text-brand-700 shadow-sm transition hover:bg-brand-200 dark:bg-slate-800 dark:text-brand-300 dark:hover:bg-slate-700"
                      >
                        Confusing Questions
                      </Link>

                      <Link
                        to="/dashboard/exams"
                        className="flex items-center justify-center rounded-xl bg-brand-100 px-3 py-2.5 text-center text-xs font-bold text-brand-700 shadow-sm transition hover:bg-brand-200 dark:bg-slate-800 dark:text-brand-300 dark:hover:bg-slate-700"
                      >
                        My Exam Performance
                      </Link>

                      <Link
                        to={`/dashboard/checkout/${course.slug}`}
                        className="flex items-center justify-center rounded-xl bg-brand-100 px-3 py-2.5 text-center text-xs font-bold text-brand-700 shadow-sm transition hover:bg-brand-200 dark:bg-slate-800 dark:text-brand-300 dark:hover:bg-slate-700"
                      >
                        Pay Course Fee
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
