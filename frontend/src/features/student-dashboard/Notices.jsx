import { FaThumbtack } from 'react-icons/fa6';
import { useNotices } from './api/dashboard.queries.js';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardPanel from './components/DashboardPanel.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { formatDateTime } from '@/lib/utils';

/** Badge tone per notice category. */
const CATEGORY_TONE = {
  Exam: 'warning',
  Class: 'success',
  Payment: 'brand',
  General: 'neutral',
};

/** /dashboard/notice — batch and academy-wide announcements. */
export default function Notices() {
  const { data: notices = [], isLoading } = useNotices();

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Notice" backTo="/dashboard" />

      <DashboardPanel title="Notice Board">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" label="Loading notices…" />
          </div>
        ) : notices.length === 0 ? (
          <EmptyState
            title="No notices yet"
            description="Announcements about your batch, classes, exams and payments will appear here."
          />
        ) : (
          <ul className="space-y-4">
            {notices.map((notice) => (
              <li
                key={notice.id}
                className="rounded-xl border-2 border-brand-300 bg-white p-5 shadow-sm transition-all hover:border-brand-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {notice.pinned && (
                      <FaThumbtack
                        aria-hidden="true"
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-accent-500"
                      />
                    )}
                    <h2 className="text-sm font-bold text-brand-600 sm:text-base dark:text-brand-300">
                      {notice.title}
                    </h2>
                  </div>
                  <Badge tone={CATEGORY_TONE[notice.category] ?? 'neutral'}>{notice.category}</Badge>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {notice.body}
                </p>

                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  {formatDateTime(notice.publishedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>
    </div>
  );
}
