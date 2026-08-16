import { useState } from 'react';
import { CONTACT } from '@/constants';

const PRESET_MESSAGE = encodeURIComponent(
  "Assalamu alaikum, I'd like to know more about CPR Medical Academy courses.",
);

/** Sticky bottom-right WhatsApp-style contact bubble with a small popover. */
export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp}?text=${PRESET_MESSAGE}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 animate-fade-in overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 dark:bg-surface-dark-subtle dark:ring-slate-800">
          <div className="bg-brand-600 px-4 py-3 text-white">
            <p className="text-sm font-semibold">CPR Medical Academy</p>
            <p className="text-xs text-brand-100">Typically replies within a few minutes</p>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Questions about admission, batch timing or payment? Message us on WhatsApp or call the
              helpline.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Chat on WhatsApp
            </a>
            <a
              href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200"
            >
              Call {CONTACT.phone}
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close chat options' : 'Open chat options'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.06c-.25.69-1.44 1.32-1.99 1.4-.53.08-1.17.11-1.89-.12-.44-.14-1-.32-1.72-.64-3.03-1.31-5.01-4.37-5.16-4.57-.15-.2-1.23-1.64-1.23-3.13 0-1.49.78-2.22 1.06-2.53.28-.31.61-.38.81-.38.2 0 .4 0 .58.01.19.01.44-.07.68.52.25.6.85 2.08.93 2.23.08.15.13.33.03.53-.1.2-.15.33-.3.5-.15.18-.31.39-.44.53-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.68-.15.28.1 1.76.83 2.06.98.3.15.5.23.58.35.07.13.07.73-.18 1.42z" />
          </svg>
        )}
      </button>
    </div>
  );
}
