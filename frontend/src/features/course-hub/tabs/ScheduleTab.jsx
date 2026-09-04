import { useCourseSchedule } from '../api/courseHub.queries.js';
import Spinner from '@/components/ui/Spinner.jsx';

/**
 * Schedule tab — displays the batch routine table directly inside the
 * Course Hub, reusing the same table structure as CourseSchedule.jsx.
 */
export default function ScheduleTab({ courseSlug }) {
  const { data: schedule = [], isLoading } = useCourseSchedule(courseSlug);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Loading schedule…" />
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          No schedule available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Routine Table ── */}
      <div className="overflow-hidden rounded-xl border-2 border-brand-500 bg-white shadow-sm dark:border-brand-600 dark:bg-surface-dark-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-brand-600 text-white">
              <tr className="divide-x divide-brand-400/50">
                <th className="w-1/4 py-3 px-4 text-center font-bold">Date &amp; Time</th>
                <th className="w-1/4 py-3 px-4 text-center font-bold">Exam</th>
                <th className="w-1/4 py-3 px-4 text-center font-bold">Solve Class</th>
                <th className="w-1/4 py-3 px-4 text-center font-bold">Lecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-200 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
              {schedule.map((row) => (
                <tr
                  key={row.id}
                  className="divide-x divide-brand-200 transition-colors hover:bg-brand-50/50 dark:divide-slate-800 dark:hover:bg-slate-900/40"
                >
                  {/* Date & Time */}
                  <td className="whitespace-pre-line py-3 px-4 text-xs font-semibold sm:text-sm text-slate-800 dark:text-slate-200">
                    {row.dateTime}
                  </td>

                  {/* Exam */}
                  <td className="py-3 px-4 text-center text-xs sm:text-sm font-medium">
                    {row.exam === 'NO EXAM' ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
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
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        NO CLASS
                      </span>
                    ) : (
                      <span className="text-emerald-900 font-semibold dark:text-emerald-300">
                        {row.solveClass}
                      </span>
                    )}
                  </td>

                  {/* Lecture */}
                  <td className="py-3 px-4 text-xs sm:text-sm font-medium">
                    {row.lecture === 'NO CLASS' ? (
                      <span className="block text-center font-semibold text-slate-700 dark:text-slate-300">
                        NO CLASS
                      </span>
                    ) : (
                      <span className="text-slate-900 font-semibold dark:text-white">
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
        <div className="border-t border-brand-400 bg-white py-3 text-center text-sm font-bold text-slate-900 dark:border-slate-800 dark:bg-surface-dark-subtle dark:text-white">
          To Be Continued...
        </div>
      </div>

      {/* ── N.B. Note ── */}
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        N.B: Schedule can be changed in any emergency/unavoidable reason.
      </p>
    </div>
  );
}
