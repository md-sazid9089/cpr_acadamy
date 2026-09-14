import { useNavigate } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa6';
import { useCourseVideos } from '../api/courseHub.queries.js';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';

/**
 * Format an ISO date string as "DD Mon YYYY".
 * e.g. '2026-07-25' -> '25 Jul 2026'
 */
function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * At a Glance tab — shows video lessons grouped by release date with Play
 * buttons, matching the reference UI. Each date group shows a blue header
 * strip with date and time, followed by video cards with red Play buttons.
 */
export default function AtAGlanceTab({ courseSlug }) {
  const navigate = useNavigate();
  const { data: videoGroups = [], isLoading } = useCourseVideos(courseSlug);

  if (isLoading) {
    return (
      <ContentSkeleton label="Loading videos" />
    );
  }

  if (videoGroups.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-semibold text-stone-500 dark:text-brand-200">
          No videos available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videoGroups.map((group) => (
        <div
          key={group.date}
          className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark"
        >
          {/* ── Date header strip ── */}
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50/80 px-4 py-3 dark:border-stone-200 dark:bg-surface-dark">
            <span className="text-xs font-semibold text-stone-900 sm:text-sm dark:text-white">
              {formatDateLabel(group.date)}
            </span>
            <span className="text-xs font-medium text-brand-600 sm:text-sm dark:text-brand-400">{group.time}</span>
          </div>

          {/* ── Video entries ── */}
          <div className="divide-y divide-stone-200 dark:divide-stone-200">
            {group.videos.map((video) => (
              <div
                key={video.id}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-stone-50 dark:hover:bg-surface-dark"
              >
                {/* Play button */}
                <button
                  type="button"
                  onClick={() => navigate(`/learn/${courseSlug}/${video.id}`)}
                  className="mt-0.5 flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white border border-stone-200 transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-dark"
                  aria-label={`Play ${video.title}`}
                >
                  <FaPlay aria-hidden="true" className="h-3 w-3" />
                </button>

                {/* Video info */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-relaxed text-stone-800 sm:text-sm dark:text-brand-200">
                    {video.title}
                  </p>
                  {video.duration && (
                    <p className="mt-0.5 text-[11px] text-stone-500 dark:text-brand-200">
                      Duration: {video.duration}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
