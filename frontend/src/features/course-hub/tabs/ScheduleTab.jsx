import { useCourseSchedule } from '../api/courseHub.queries.js';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';

/**
 * Schedule tab — displays the batch routine table directly inside the
 * Course Hub, reusing the same table structure as CourseSchedule.jsx.
 */
export default function ScheduleTab({ courseSlug }) {
  const { data: schedule = [], isLoading } = useCourseSchedule(courseSlug);

  if (isLoading) {
    return (
      <ContentSkeleton label="Loading schedule" />
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-semibold text-stone-500 dark:text-brand-200">
          No schedule available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Routine Table ── */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200">
              <tr className="divide-x divide-stone-200 dark:divide-stone-200">
                <th className="w-1/4 py-3 px-4 text-center font-semibold">Date &amp; Time</th>
                <th className="w-1/4 py-3 px-4 text-center font-semibold">Exam</th>
                <th className="w-1/4 py-3 px-4 text-center font-semibold">Solve Class</th>
                <th className="w-1/4 py-3 px-4 text-center font-semibold">Lecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800 dark:divide-stone-200 dark:text-brand-200">
              {schedule.map((row) => (
                <tr
                  key={row.id}
                  className="divide-x divide-stone-200 transition-colors hover:bg-stone-50 dark:divide-stone-200 dark:hover:bg-surface-dark"
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
        <div className="border-t border-stone-200 bg-stone-50 py-3 text-center text-sm font-semibold text-stone-700 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200">
          To Be Continued...
        </div>
      </div>

      {/* ── N.B. Note ── */}
      <p className="text-xs font-semibold text-stone-700 dark:text-brand-200">
        N.B: Schedule can be changed in any emergency/unavoidable reason.
      </p>
    </div>
  );
}
