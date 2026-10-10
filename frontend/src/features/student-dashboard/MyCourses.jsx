import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTriangleExclamation, FaClockRotateLeft, FaPlay, FaCircleInfo, FaBookOpen, FaFilePdf, FaRegCalendar, FaChartLine } from 'react-icons/fa6';
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

// Within this many days of the end date, the access note turns into a warning.
const EXPIRY_WARNING_DAYS = 14;
const DAY_MS = 86400000;

function lessonMeta(lesson) {
  const kind = lesson.hasVideo && lesson.hasNotes ? 'Video + notes' : lesson.hasVideo ? 'Video' : lesson.hasNotes ? 'Notes' : 'Lesson';
  return lesson.durationMinutes ? `${kind} · ${lesson.durationMinutes} min` : kind;
}

function AccessNote({ course }) {
  if (course.status === 'pending_payment') {
    return (
      <p className="course-access">
        <FaCircleInfo aria-hidden="true" />
        <span>
          {course.awaitingApproval
            ? 'Your payment is submitted and awaiting admin approval. Access opens as soon as it’s confirmed.'
            : 'Complete your payment to start this batch.'}
        </span>
      </p>
    );
  }
  if (course.status === 'expired') {
    return (
      <p className="course-access">
        <FaCircleInfo aria-hidden="true" />
        <span>Access ended on <strong>{formatDate(course.expiresOn)}</strong>.</span>
      </p>
    );
  }
  const daysLeft = Math.ceil((new Date(course.expiresOn).getTime() - Date.now()) / DAY_MS);
  if (daysLeft <= EXPIRY_WARNING_DAYS) {
    return (
      <p className="course-access course-access--warn">
        <FaTriangleExclamation aria-hidden="true" />
        <span>
          Access ends in <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong> ({formatDate(course.expiresOn)}).
          Finish your remaining lessons before then.
        </span>
      </p>
    );
  }
  return (
    <p className="course-access">
      <FaCircleInfo aria-hidden="true" />
      <span>Access until <strong>{formatDate(course.expiresOn)}</strong>. May be extended after the exam circular.</span>
    </p>
  );
}

function CourseCard({ course }) {
  const categorySlug = CATEGORY_SLUGS[course.category] || 'fcps';
  const hubUrl = `/dashboard/course/${course.slug}`;
  const isCompleted = course.lessonCount > 0 && course.completedLessons === course.lessonCount && !course.nextLesson;
  // Read the record, not the tab: a card is only resumable when
  // the enrolment itself is running.
  const isActive = course.status === 'active' || !course.status;
  const percent = course.lessonCount ? Math.round((course.completedLessons / course.lessonCount) * 100) : 0;
  const next = isActive && !isCompleted ? course.nextLesson : null;

  return (
    <article className="batch-card">
      <header>
        <div className="course-title-row">
          <h2 className="text-lg font-bold leading-snug">{course.title}</h2>
          <span className="course-chip">{course.category || 'Medicine & Allied'}</span>
        </div>
        <p className="course-reg">Reg no. {course.regNo ?? '—'}</p>
      </header>

      {course.status !== 'pending_payment' && course.lessonCount > 0 && (
        <div className="course-progress">
          <div className="course-progress-label">
            <strong>{isCompleted ? <><FaCheck aria-hidden="true" /> All {course.lessonCount} lessons done</> : `${course.completedLessons} of ${course.lessonCount} lessons`}</strong>
            <span>{percent}%</span>
          </div>
          <div
            className="course-bar"
            role="progressbar"
            aria-label="Lessons completed"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      <div className="course-card-body">
        {next && (
          <div className="course-next">
            <div className="course-next-thumb" aria-hidden="true">
              {next.hasVideo || !next.hasNotes ? <FaPlay /> : <FaFilePdf />}
            </div>
            <div className="min-w-0">
              <p className="course-next-label">Up next</p>
              <p className="course-next-title">{next.title}</p>
              <p className="course-next-meta">{lessonMeta(next)}</p>
            </div>
          </div>
        )}

        {course.awaitingApproval ? (
          <span className="course-primary-action course-primary-action--pending">
            <FaClockRotateLeft aria-hidden="true" /> Waiting for Approval
          </span>
        ) : (
          <Link to={isActive ? hubUrl : `/dashboard/checkout/${course.slug}`} className="course-primary-action">
            {isCompleted && isActive ? <FaBookOpen aria-hidden="true" /> : isActive ? <FaPlay aria-hidden="true" /> : null}
            {isActive
              ? isCompleted ? 'Review materials' : next ? 'Continue lesson' : 'Open course'
              : course.status === 'expired' ? 'Renew access' : 'Pay course fee'}
          </Link>
        )}

        <AccessNote course={course} />
      </div>

      <nav aria-label={`${course.title} links`} className="course-actions">
        <Link to={`/courses/${categorySlug}/${course.slug}/schedule`}>
          <FaRegCalendar aria-hidden="true" />
          Schedule
        </Link>
        <Link to={hubUrl}>
          <FaBookOpen aria-hidden="true" />
          Course hub
        </Link>
        <Link to="/dashboard/exams">
          <FaChartLine aria-hidden="true" />
          Exam results
        </Link>
      </nav>
    </article>
  );
}

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
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
      </section>}
    </div>
  );
}
