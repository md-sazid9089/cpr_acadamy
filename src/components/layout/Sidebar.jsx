import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ICONS = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  book: 'M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z M8 3v18',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  clipboard: 'M9 4h6v3H9zM7 5H5v16h14V5h-2',
  wallet: 'M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H4a1 1 0 01-1-1zM3 7l1-3h13M17 13h2',
  users: 'M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9.5 8a3.5 3.5 0 100-7 3.5 3.5 0 000 7M22 20v-2a4 4 0 00-3-3.87',
  report: 'M14 3v5h5M6 3h9l5 5v13H6zM9 13h6M9 17h4',
  play: 'M6 4l14 8-14 8z',
};

function Icon({ name }) {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[name] ?? ICONS.grid} />
    </svg>
  );
}

/** Student navigation. Kept beside the admin set so both stay in one file. */
export const STUDENT_NAV = [
  { to: '/dashboard', label: 'Overview', icon: 'grid', end: true },
  { to: '/dashboard/courses', label: 'My Courses', icon: 'book' },
  { to: '/dashboard/progress', label: 'Progress', icon: 'chart' },
  { to: '/dashboard/exams', label: 'Upcoming Exams', icon: 'clipboard' },
  { to: '/dashboard/payments', label: 'Payment History', icon: 'wallet' },
];

export const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/admin/students', label: 'Students', icon: 'users' },
  { to: '/admin/courses', label: 'Courses', icon: 'book' },
  { to: '/admin/reports', label: 'Reports', icon: 'report' },
];

/** Vertical nav for the dashboard shells; slides in as a drawer on mobile. */
export default function Sidebar({ items, title = 'Menu', open = false, onClose, footer }) {
  const content = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label={title}>
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </p>

      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
            )
          }
        >
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}

      {footer && <div className="mt-auto pt-4">{footer}</div>}
    </nav>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-surface-dark-subtle">
        <div className="sticky top-16">{content}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl dark:bg-surface-dark-subtle">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
