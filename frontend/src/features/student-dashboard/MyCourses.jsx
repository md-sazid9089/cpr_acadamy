import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaTriangleExclamation, FaClockRotateLeft, FaPlay } from 'react-icons/fa6';
import { useMyCourses } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardTabs from './components/DashboardTabs.jsx';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { CATEGORY_SLUGS } from '@/constants';
import { formatDate } from '@/lib/utils';

const TABS = [
  { id: 'active', label: 'Active Batches', icon: FaCheck, iconColor: 'text-brand-500' },
  { id: 'unpaid', label: 'Unpaid Batches', icon: FaTriangleExclamation, iconColor: 'text-brand-500' },
  { id: 'previous', label: 'Previous Batches', icon: FaClockRotateLeft, iconColor: 'text-brand-500' },
];

export default function MyCourses() {
  const { data: courses = [], isLoading } = useMyCourses();
  const [activeTab, setActiveTab] = useState('active');

  if (isLoading) {
    return (
      <ContentSkeleton variant="cards" label="Loading your courses" />
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
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark">
        {/* Section title header */}
        <div className="flex items-center gap-2.5 border-b border-stone-200 bg-stone-50/80 px-6 py-4 dark:border-stone-200 dark:bg-surface-dark">
          {(() => {
            const Icon = TABS.find((t) => t.id === activeTab)?.icon;
            return Icon ? <Icon aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-400" /> : null;
          })()}
          <span className="text-sm font-semibold text-stone-900 dark:text-white">
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
                    className="group flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-200 dark:border-stone-200 dark:bg-surface-dark dark:hover:border-stone-200"
                  >
                    <div>
                      {/* Course / Batch Title */}
                      <h2 className="text-base font-bold leading-snug text-stone-900 sm:text-lg dark:text-white">
                        {course.title}
                      </h2>

                      {/* Discipline & Reg No chips */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-stone-600 dark:text-brand-200">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 dark:bg-surface-dark">
                          Discipline:
                          <strong className="font-semibold text-stone-800 dark:text-brand-200">{course.category || 'Medicine & Allied'}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 dark:bg-surface-dark">
                          Reg No:
                          <strong className="font-semibold text-stone-800 dark:text-brand-200">{course.regNo ?? '—'}</strong>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-brand-200">
                          <span>Progress</span>
                          <span className="text-stone-900 dark:text-white">{progressValue}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-surface-dark">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                      </div>

                      {/* Notice / Validity text */}
                      <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-brand-800 dark:bg-brand-950/30 dark:text-brand-300">
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
                        className="mt-6 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-center text-sm font-semibold text-white border border-stone-200 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
                      >
                        <FaPlay aria-hidden="true" className="h-3 w-3" />
                        {course.nextLesson ? 'Continue Course' : 'Open Course'}
                      </Link>
                    )}

                    {isActive && course.nextLesson && (
                      <p className="mt-2 truncate text-center text-[11px] text-stone-500 dark:text-brand-200">
                        Up next: {course.nextLesson.title}
                      </p>
                    )}

                    {/* Secondary actions */}
                    <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-stone-200 pt-5 dark:border-stone-200">
                      <Link
                        to={scheduleUrl}
                        className="flex items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-stone-700 transition hover:border-stone-200 hover:bg-brand-50 hover:text-brand-700 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:border-stone-200 dark:hover:bg-surface-dark"
                      >
                        View Schedule
                      </Link>

                      <Link
                        to={`/dashboard/course/${course.slug}`}
                        className="flex items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-stone-700 transition hover:border-stone-200 hover:bg-brand-50 hover:text-brand-700 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:border-stone-200 dark:hover:bg-surface-dark"
                      >
                        Course Hub
                      </Link>

                      <Link
                        to="/dashboard/exams"
                        className="flex items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-stone-700 transition hover:border-stone-200 hover:bg-brand-50 hover:text-brand-700 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:border-stone-200 dark:hover:bg-surface-dark"
                      >
                        My Exam Performance
                      </Link>

                      {isActive ? (
                        <Link
                          to="/dashboard/subscriptions"
                          className="flex items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-stone-700 transition hover:border-stone-200 hover:bg-brand-50 hover:text-brand-700 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:border-stone-200 dark:hover:bg-surface-dark"
                        >
                          Subscriptions
                        </Link>
                      ) : (
                        <Link
                          to={`/dashboard/checkout/${course.slug}`}
                          className="flex items-center justify-center rounded-lg border border-stone-200 bg-brand-50 px-3 py-2.5 text-center text-xs font-semibold text-brand-800 transition hover:border-stone-200 hover:bg-brand-100 dark:border-stone-200 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-950/50"
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
