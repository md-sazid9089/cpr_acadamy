import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTriangleExclamation, FaClockRotateLeft, FaPlay, FaCircleInfo, FaBookOpen } from 'react-icons/fa6';
import { useMyCourses } from './api/dashboard.queries.js';
import DashboardTabs from './components/DashboardTabs.jsx';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { CATEGORY_SLUGS } from '@/constants';
import { formatDate } from '@/lib/utils';
import './MyCourses.css';

const TABS = [
  { id: 'active', label: 'Active Batches', icon: FaCheck, iconColor: 'text-brand-500' },
  { id: 'unpaid', label: 'Unpaid Batches', icon: FaTriangleExclamation, iconColor: 'text-brand-500' },
  { id: 'previous', label: 'Previous Batches', icon: FaClockRotateLeft, iconColor: 'text-brand-500' },
];

export default function MyCourses() {
  const { data: courses = [], isLoading, isError, refetch } = useMyCourses();
  const [activeTab, setActiveTab] = useState('active');

  // Filter courses by tab status
  const filteredCourses = courses.filter((course) => {
    if (activeTab === 'active') return course.status === 'active' || !course.status;
    if (activeTab === 'unpaid') return course.status === 'pending_payment';
    if (activeTab === 'previous') return course.status === 'expired';
    return true;
  });

  return (
    <div className="my-courses mx-auto w-full max-w-7xl space-y-6">
      <nav aria-label="Breadcrumb" className="course-breadcrumb">
        <Link to="/dashboard">Dashboard</Link><span aria-hidden="true">/</span><span aria-current="page">My Courses</span>
      </nav>
      <div className="course-page-heading">
        <div className="course-page-title">
          <Link to="/dashboard" className="course-back" aria-label="Back to dashboard" title="Back to dashboard"><FaArrowLeft aria-hidden="true" /></Link>
          <h1 className="text-xl font-bold sm:text-2xl">My Courses</h1>
        </div>
        <Link className="course-text-link" to="/dashboard/subscriptions">Subscriptions</Link>
      </div>

      <DashboardTabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

      {isLoading ? <ContentSkeleton variant="cards" label="Loading your courses" /> : isError ? (
        <div role="alert" className="course-access-notice">
          <FaCircleInfo aria-hidden="true" />
          <div>
            <p>Your batches could not be loaded.</p>
            <button type="button" className="course-text-link" onClick={() => refetch()}>Try again</button>
          </div>
        </div>
      ) : <section aria-label="Batch list" className="space-y-4">
        <p className="course-count" role="status">{filteredCourses.length} {filteredCourses.length === 1 ? 'batch' : 'batches'}</p>
          {filteredCourses.length === 0 ? (
            <EmptyState
              title={`No ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} found`}
              description="Browse our active batches and enroll to start learning."
              action={<Button to="/batches">Browse Batches</Button>}
            />
          ) : (
            <div className={`course-grid grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 ${filteredCourses.length === 1 ? 'course-grid--single' : ''}`}>
              {filteredCourses.map((course) => {
                const categorySlug = CATEGORY_SLUGS[course.category] || 'fcps';
                const scheduleUrl = `/courses/${categorySlug}/${course.slug}/schedule`;
                const progressValue = course.progress ?? 0;
                const isCompleted = course.lessonCount > 0 && course.completedLessons === course.lessonCount && !course.nextLesson;
                // Read the record, not the tab: a card is only resumable when
                // the enrolment itself is running.
                const isActive = course.status === 'active' || !course.status;

                return (
                  <article
                    key={course.id}
                    className="batch-card"
                  >
                    <div>
                      {isCompleted && <span className="course-completed"><FaCheck aria-hidden="true" />Completed</span>}
                      {/* Course / Batch Title */}
                      <h2 className="text-base font-bold leading-snug text-stone-900 sm:text-lg dark:text-white">
                        {course.title}
                      </h2>

                      <dl className="course-details">
                        <div><dt>Discipline</dt><dd>{course.category || 'Medicine & Allied'}</dd></div>
                        <div><dt>Reg No</dt><dd>{course.regNo ?? '—'}</dd></div>
                      </dl>

                      {/* Progress Bar */}
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-brand-200">
                          <span>Progress</span>
                          <span className="text-stone-900 dark:text-white">{progressValue}%</span>
                        </div>
                        <progress className="course-progress" aria-label={`${course.title} progress`} max="100" value={progressValue} />
                      </div>

                      {/* Notice / Validity text */}
                      <div className="course-access-notice mt-4">
                        <FaCircleInfo aria-hidden="true" />
                        <p>
                        {course.status === 'pending_payment'
                          ? course.awaitingApproval
                            ? 'Your payment is submitted and awaiting admin approval. Access opens as soon as it’s confirmed.'
                            : 'Complete your payment to start this batch.'
                          : course.status === 'expired'
                            ? <>Access to this batch ended on <strong>{formatDate(course.expiresOn)}</strong>.</>
                            : <>Your batch access remains active till <strong>{formatDate(course.expiresOn)}</strong>. The date is reviewed after the exam circular.</>}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      {course.awaitingApproval ? (
                        <span className="course-primary-action course-primary-action--pending">
                          <FaClockRotateLeft aria-hidden="true" /> Waiting for Approval
                        </span>
                      ) : (
                        <Link
                          to={isActive ? `/dashboard/course/${course.slug}` : `/dashboard/checkout/${course.slug}`}
                          className="course-primary-action"
                        >
                          {isCompleted && isActive ? <FaBookOpen aria-hidden="true" /> : isActive ? <FaPlay aria-hidden="true" /> : null}
                          {isActive ? (isCompleted ? 'Review Materials' : course.nextLesson ? 'Continue Course' : 'Open Course') : course.status === 'expired' ? 'Renew Access' : 'Pay Course Fee'}
                        </Link>
                      )}

                    {isActive && !isCompleted && course.nextLesson && (
                      <p className="course-next-lesson">
                        Up next: {course.nextLesson.title}
                      </p>
                    )}

                    <nav aria-label={`${course.title} links`} className="course-secondary-links">
                      <Link
                        to={scheduleUrl}
                      >
                        View Schedule
                      </Link>

                      <Link
                        to={`/dashboard/course/${course.slug}`}
                      >
                        Course Hub
                      </Link>

                      <Link
                        to="/dashboard/exams"
                      >
                        My Exam Performance
                      </Link>

                    </nav>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </section>}
    </div>
  );
}
