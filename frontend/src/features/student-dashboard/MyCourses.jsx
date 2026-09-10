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
import { formatDate } from '@/lib/utils';

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

      {/* ── Main Section Container ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Section title header */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
          {(() => {
            const Icon = TABS.find((t) => t.id === activeTab)?.icon;
            return Icon ? <Icon aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-400" /> : null;
          })()}
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {TABS.find((t) => t.id === activeTab)?.label}
          </span>
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
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-brand-700"
                  >
                    <div>
                      {/* Course / Batch Title */}
                      <h2 className="text-base font-bold leading-snug text-slate-900 sm:text-lg dark:text-white">
                        {course.title}
                      </h2>

                      {/* Discipline & Reg No chips */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                          Discipline:
                          <strong className="font-semibold text-slate-800 dark:text-slate-200">{course.category || 'Medicine & Allied'}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                          Reg No:
                          <strong className="font-semibold text-slate-800 dark:text-slate-200">{course.regNo ?? '—'}</strong>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-5 space-y-2">
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

                      {/* Notice / Validity text */}
                      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                        {course.status === 'pending_payment'
                          ? 'Access opens as soon as the academy confirms your course fee payment.'
                          : course.status === 'expired'
                            ? `Access to this batch ended on ${formatDate(course.expiresOn)}.`
                            : `Your batch access remains active till ${formatDate(course.expiresOn)}. The date is reviewed after the exam circular.`}
                      </p>
                    </div>

                    {/* Primary action — only for a running batch. */}
                    {isActive && (
                      <Link
                        to={`/dashboard/course/${course.slug}`}
                        className="mt-6 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                      >
                        <FaPlay aria-hidden="true" className="h-3 w-3" />
                        {course.nextLesson ? 'Continue Course' : 'Open Course'}
                      </Link>
                    )}

                    {isActive && course.nextLesson && (
                      <p className="mt-2 truncate text-center text-[11px] text-slate-500 dark:text-slate-400">
                        Up next: {course.nextLesson.title}
                      </p>
                    )}

                    {/* Secondary actions */}
                    <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
                      <Link
                        to={scheduleUrl}
                        className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-slate-800"
                      >
                        View Schedule
                      </Link>

                      <Link
                        to={`/dashboard/course/${course.slug}`}
                        className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-slate-800"
                      >
                        Course Hub
                      </Link>

                      <Link
                        to="/dashboard/exams"
                        className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-slate-800"
                      >
                        My Exam Performance
                      </Link>

                      {isActive ? (
                        <Link
                          to="/dashboard/subscriptions"
                          className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-slate-800"
                        >
                          Subscriptions
                        </Link>
                      ) : (
                        <Link
                          to={`/dashboard/checkout/${course.slug}`}
                          className="flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-center text-xs font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
                        >
                          {course.status === 'expired' ? 'Renew Access' : 'Pay Course Fee'}
                        </Link>
                      )}
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
