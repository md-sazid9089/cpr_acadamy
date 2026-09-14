import { Link, useParams } from 'react-router-dom';
import { FaPrint, FaArrowLeftLong } from 'react-icons/fa6';
import { useCourse } from './api/courses.queries.js';
import { useEnrollAction } from './hooks/useEnrollAction.js';
import { useCourseSchedule } from '@/features/course-hub/api/courseHub.queries.js';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { CONTACT, CATEGORY_SLUGS } from '@/constants';

export default function CourseSchedule() {
  const { slug } = useParams();
  const { data: course, isLoading, isError } = useCourse(slug);
  const { data: routine = [], isLoading: routineLoading } = useCourseSchedule(course?.slug);
  const onEnroll = useEnrollAction();

  if (!slug || isError || (!isLoading && !course)) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Batch not found"
          description="Pick a batch to see its class and exam routine."
          action={<Button to="/batches">Browse batches</Button>}
        />
      </div>
    );
  }

  if (isLoading || routineLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-surface-dark">
        <Spinner size="lg" label="Loading schedule…" />
      </div>
    );
  }

  const courseData = course;

  const categorySlug = CATEGORY_SLUGS[courseData.category] || 'fcps';
  const detailUrl = `/courses/${categorySlug}/${courseData.slug}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white py-8 dark:bg-surface-dark print:bg-white print:py-0">
      <div className="container-page max-w-6xl">
        {/* ── Breadcrumb ── */}
        <div className="mb-4 flex items-center justify-between text-xs font-medium text-stone-500 print:hidden dark:text-brand-200">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400">Home</Link>
            <span>/</span>
            <Link to="/batches" className="hover:text-brand-600 dark:hover:text-brand-400">Batches</Link>
            <span>/</span>
            <Link to={detailUrl} className="hover:text-brand-600 dark:hover:text-brand-400">{courseData.title}</Link>
            <span>/</span>
            <span className="font-semibold text-brand-700 dark:text-brand-400">Schedule</span>
          </div>

          <Link
            to={detailUrl}
            className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            <FaArrowLeftLong className="h-3 w-3" />
            Back to Course Details
          </Link>
        </div>

        {/* ── Top Action Header Row ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl dark:text-white">
            Batch Schedule
          </h1>

          <div className="flex items-center gap-3 print:hidden">
            <Button variant="outline" size="md" onClick={handlePrint}>
              <FaPrint className="h-4 w-4" />
              Print
            </Button>

            <Button
              size="md"
              className="px-6 font-bold"
              onClick={() => onEnroll(courseData)}
            >
              Enroll
            </Button>
          </div>
        </div>

        {/* ── Batch Info Box ── */}
        <div className="mb-6 overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
          {/* Blue title bar */}
          <div className="bg-brand-600 px-5 py-3 text-sm font-bold text-white sm:text-base">
            {courseData.title}
          </div>

          {/* Details */}
          <div className="space-y-1.5 bg-brand-50 p-5 text-sm text-stone-800 dark:bg-surface-dark dark:text-brand-200">
            <p>
              <strong className="font-bold text-stone-900 dark:text-white">Year:</strong> {new Date(courseData.startsOn || courseData.createdAt || Date.now()).getFullYear()}
            </p>
            <p>
              <strong className="font-bold text-stone-900 dark:text-white">Course:</strong> {courseData.category === 'FCPS' ? 'FCPS Part-1' : courseData.category}
            </p>
            <p>
              <strong className="font-bold text-stone-900 dark:text-white">Session:</strong> {courseData.session || '—'}
            </p>
          </div>
        </div>

        {/* ── Routine Table ── */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-brand-600 text-white">
                <tr className="divide-x divide-stone-200">
                  <th className="w-1/4 py-3 px-4 text-center font-bold">Date &amp; Time</th>
                  <th className="w-1/4 py-3 px-4 text-center font-bold">Exam</th>
                  <th className="w-1/4 py-3 px-4 text-center font-bold">Solve Class</th>
                  <th className="w-1/4 py-3 px-4 text-center font-bold">Lecture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-800 dark:divide-stone-200 dark:text-brand-200">
                {routine.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-stone-500 dark:text-brand-200">
                      The routine for this batch has not been published yet.
                    </td>
                  </tr>
                )}
                {routine.map((row) => (
                  <tr
                    key={row.id}
                    className="divide-x divide-stone-200 transition-colors hover:bg-brand-50/50 dark:divide-stone-200 dark:hover:bg-surface-dark"
                  >
                    {/* Date & Time */}
                    <td className="whitespace-pre-line py-3 px-4 text-xs font-semibold sm:text-sm text-stone-800 dark:text-brand-200">
                      {row.dateTime}
                    </td>

                    {/* Exam */}
                    <td className="py-3 px-4 text-center text-xs sm:text-sm font-medium">
                      {row.exam === 'NO EXAM' ? (
                        <span className="font-semibold text-stone-700 dark:text-brand-200">
                          NO EXAM
                        </span>
                      ) : (
                        <span className="text-brand-900 font-semibold dark:text-brand-300">
                          {row.exam}
                        </span>
                      )}
                    </td>

                    {/* Solve Class */}
                    <td className="py-3 px-4 text-center text-xs sm:text-sm font-medium">
                      {row.solveClass === 'NO CLASS' ? (
                        <span className="font-semibold text-stone-700 dark:text-brand-200">
                          NO CLASS
                        </span>
                      ) : (
                        <span className="text-brand-900 font-semibold dark:text-brand-300">
                          {row.solveClass}
                        </span>
                      )}
                    </td>

                    {/* Lecture */}
                    <td className="py-3 px-4 text-xs sm:text-sm font-medium">
                      {row.lecture === 'NO CLASS' ? (
                        <span className="block text-center font-semibold text-stone-700 dark:text-brand-200">
                          NO CLASS
                        </span>
                      ) : (
                        <span className="text-stone-900 font-semibold dark:text-white">
                          {row.lecture}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Banner */}
          <div className="border-t border-stone-200 bg-white py-3 text-center text-sm font-bold text-stone-900 dark:border-stone-200 dark:bg-surface-dark-subtle dark:text-white">
            To Be Continued...
          </div>
        </div>

        {/* ── N.B. Note ── */}
        <p className="mt-3 text-xs font-semibold text-stone-700 dark:text-brand-200">
          N.B: Schedule can be changed in any emergency/unavoidable reason.
        </p>

        {/* ── Footer Contact Box ── */}
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-200 dark:bg-surface-dark-subtle">
          <p className="text-sm font-bold text-stone-900 dark:text-white">
            Address: <span className="font-normal text-stone-700 dark:text-brand-200">{CONTACT.address}</span>
          </p>
          <p className="mt-2 text-sm font-bold text-stone-900 dark:text-white">
            Contact: <span className="font-normal text-stone-700 dark:text-brand-200">{CONTACT.phone}</span>
          </p>
          <p className="mt-2 text-sm font-bold text-stone-900 dark:text-white">
            For Result Please Visit:{' '}
            <a href="https://cprmedicalacademy.com" target="_blank" rel="noreferrer" className="text-brand-700 hover:underline dark:text-brand-400">
              www.cprmedicalacademy.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
