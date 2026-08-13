import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { CONTACT, COURSE_CATEGORIES, CATEGORY_SLUGS } from '@/constants';

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/courses', label: 'All Courses' },
  { to: '/class', label: 'Class Routine' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/login', label: 'Student Login' },
];

// External resources doctors actually use — mirrors Synapse's "Useful Websites".
const USEFUL_WEBSITES = [
  { href: 'https://bcps.edu.bd', label: 'BCPS Bangladesh' },
  { href: 'https://www.bmdc.org.bd', label: 'BM&DC' },
  { href: 'http://www.dghs.gov.bd', label: 'DGHS' },
  { href: 'https://bpsc.gov.bd', label: 'Bangladesh Public Service Commission' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov', label: 'PubMed' },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-surface-subtle dark:border-slate-800 dark:bg-surface-dark-subtle">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-slate-600 dark:text-slate-400">
            Structured, exam-focused preparation for FCPS, BCS (Health) and MBBS professional
            examinations — taught by clinicians who have sat the same papers.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              { label: 'Facebook', href: 'https://facebook.com' },
              { label: 'YouTube', href: 'https://youtube.com' },
              { label: 'LinkedIn', href: 'https://linkedin.com' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-brand-400"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
            Quick Links
          </h3>
          <ul className="mt-4 space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-slate-600 transition-colors hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
            Categories
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {COURSE_CATEGORIES.map((category) => (
              <li key={category}>
                <Link
                  to={`/courses/${CATEGORY_SLUGS[category]}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li>{CONTACT.address}</li>
            <li>
              <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="hover:text-brand-700 dark:hover:text-brand-400">
                {CONTACT.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className="hover:text-brand-700 dark:hover:text-brand-400">
                {CONTACT.email}
              </a>
            </li>
            <li className="text-xs">{CONTACT.hours}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
            Useful Websites
          </h3>
          <ul className="mt-4 space-y-2.5">
            {USEFUL_WEBSITES.map((site) => (
              <li key={site.href}>
                <a
                  href={site.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400"
                >
                  {site.label}
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row dark:text-slate-400">
          <p>© {new Date().getFullYear()} CPR Medical Academy. All rights reserved.</p>
          <p className="flex gap-4">
            <Link to="/faq" className="hover:text-brand-700 dark:hover:text-brand-400">
              Refund Policy
            </Link>
            <Link to="/faq" className="hover:text-brand-700 dark:hover:text-brand-400">
              Terms &amp; Privacy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
