import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaXmark } from 'react-icons/fa6';
import LessonSidebar from './LessonSidebar.jsx';
import { cn } from '@/lib/utils';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet holding the lesson sidebar on small screens.
 *
 * Closes on backdrop click, Escape, and lesson selection; locks body scroll,
 * traps Tab inside itself, and returns focus to whatever opened it.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} props.sidebarProps  Forwarded to LessonSidebar.
 */
export default function MobileLessonSheet({ open, onClose, sidebarProps }) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    // Move focus into the sheet without landing on the search field, which
    // would raise the keyboard over the list the user came to read.
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Lessons">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'absolute inset-x-0 bottom-0 flex h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl',
          'animate-slide-up motion-reduce:animate-none',
          'focus:outline-none dark:bg-surface-dark-subtle',
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-4 pb-1 pt-3">
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lessons"
            className={cn(
              'rounded-lg p-2 text-slate-500 transition-colors duration-150 hover:bg-slate-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              'dark:hover:bg-slate-800',
            )}
          >
            <FaXmark aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <LessonSidebar {...sidebarProps} className="min-h-0 flex-1" />
      </div>
    </div>,
    document.body,
  );
}
