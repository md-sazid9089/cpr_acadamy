import { useState } from 'react';
import Button from '@/components/ui/Button.jsx';
import { cn } from '@/lib/utils';

/**
 * Read-only notes viewer.
 *
 * Downloading, printing, text selection and the context menu are all blocked,
 * and every page carries the student's identity as a watermark. This raises the
 * effort of copying licensed material; it is not a substitute for server-side
 * protection.
 * TODO: render real pages with pdf.js from a signed, per-session URL, and
 * stamp the watermark server-side so it cannot be removed in the DOM.
 */
export default function SecurePdfViewer({ title, pageCount = 14, watermark = 'CPR Medical Academy' }) {
  const [page, setPage] = useState(1);

  return (
    <div className="rounded-xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4 dark:border-stone-200">
        <div>
          <p className="text-sm font-semibold text-stone-900 dark:text-white">{title}</p>
          <p className="text-xs text-stone-500 dark:text-brand-200">
            Page {page} of {pageCount} · view only
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <div
        onContextMenu={(event) => event.preventDefault()}
        onCopy={(event) => event.preventDefault()}
        className={cn(
          'relative flex aspect-[1/1.414] items-center justify-center overflow-hidden bg-surface-subtle',
          'select-none-secure dark:bg-surface-dark',
        )}
      >
        {/* Repeating diagonal watermark across the page area. */}
        <div className="pointer-events-none absolute inset-0 flex flex-wrap content-center justify-center gap-10 opacity-[0.08]">
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={index}
              className="whitespace-nowrap text-lg font-bold text-stone-900 dark:text-white"
              style={{ transform: 'rotate(-30deg)' }}
            >
              {watermark}
            </span>
          ))}
        </div>

        <p className="relative text-sm text-stone-400">
          Secure PDF page {page} — renderer not connected yet
        </p>
      </div>

      <p className="border-t border-stone-200 p-3 text-center text-xs text-stone-500 dark:border-stone-200 dark:text-brand-200">
        This material is licensed to your account only. Sharing or redistributing it will suspend
        your access.
      </p>
    </div>
  );
}
