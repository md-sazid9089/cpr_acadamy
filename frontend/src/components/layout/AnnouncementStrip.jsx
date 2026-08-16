import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGift, FaPhone, FaStethoscope } from 'react-icons/fa6';

// TODO: replace with GET /announcements (TanStack Query) once the backend exists.
const ANNOUNCEMENTS = [
  {
    icon: FaGift,
    text: 'Early-bird offer: 25% off the FCPS Part-1 January batch — enrol before 30 September.',
  },
  { icon: FaStethoscope, text: 'New BCS (Health) written batch starts 5 October. Limited seats.' },
  { icon: FaPhone, text: 'Admission helpline: +880 1700-000000 (10 AM – 8 PM)' },
];

/** Thin promo bar that sits above the navbar, dismissible for the session. */
export default function AnnouncementStrip() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative bg-brand-700 text-white dark:bg-brand-900">
      <div className="container-page flex items-center gap-4 py-2">
        <div className="flex-1 overflow-hidden">
          {/* Duplicated once so the -50% marquee translate loops seamlessly. */}
          <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap text-xs font-medium sm:text-sm">
            {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((item, index) => {
              const Icon = item.icon;
              return (
                <span key={index} className="flex items-center gap-10">
                  <span className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand-200" />
                    {item.text}
                  </span>
                  <span aria-hidden="true" className="text-brand-300">
                    •
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <Link
          to="/courses"
          className="hidden shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/25 sm:block"
        >
          View offers
        </Link>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcements"
          className="shrink-0 rounded p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
