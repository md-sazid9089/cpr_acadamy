import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';
import { FaChevronDown } from 'react-icons/fa6';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useNotices } from '@/features/student-dashboard/api/dashboard.queries.js';
import { EMPTY_READ_NOTICES, useNoticeReadStore } from '@/features/student-dashboard/notice-read-store.js';
import { isNoticeUnread } from '@/features/student-dashboard/notices.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/batches', label: 'Batches' },
  { to: '/faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

const STUDENT_LINKS = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/dashboard/courses', label: 'My Courses' },
  { to: '/dashboard/exams', label: 'My Exams' },
  { to: '/dashboard/payments', label: 'Payments' },
  { to: '/dashboard/subscriptions', label: 'Subscriptions' },
  { to: '/batches', label: 'Available Batches' },
  { to: '/dashboard/notice', label: 'Notices' },
  { to: '/dashboard/complaints', label: 'Complaint Box' },
  { to: '/dashboard/exam-positions', label: 'Exam Positions' },
  { to: '/dashboard/progress', label: 'Progress' },
  { to: '/dashboard/account', label: 'My Account' },
];

const linkClasses = ({ isActive }) =>
  cn(
    'rounded-lg px-4 py-2.5 text-base font-medium transition-colors',
    // Green wash on hover, not just green text, so the target reads as a
    // control rather than a colour change.
    'hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-300',
    isActive
      ? 'text-brand-700 dark:text-brand-400'
      : 'text-stone-600 dark:text-brand-200',
  );

/** Two-letter fallback shown when the user has no avatar image. */
function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Avatar with image or initials fallback. */
function Avatar({ user, className }) {
  const src = user?.photoUrl ?? user?.avatar ?? null;
  return src ? (
    <img
      src={src}
      alt=""
      className={cn('rounded-full object-cover', className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300',
        className,
      )}
    >
      {initialsOf(user?.fullName) || 'U'}
    </span>
  );
}

/** Desktop profile control: avatar + name that opens a Dashboard/Logout menu. */
function ProfileMenu({ user, dashboardPath, onLogout }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-brand-50 dark:border-stone-200 dark:bg-surface-dark dark:hover:bg-surface-dark"
      >
        <Avatar user={user} className="h-9 w-9 text-sm" />
        <span className="max-w-[10rem] truncate text-sm font-semibold text-stone-800 dark:text-brand-200">
          {user?.fullName ?? 'Account'}
        </span>
        <svg
          className={cn('h-4 w-4 text-stone-500 transition-transform', open && 'rotate-180')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 dark:border-stone-200 dark:bg-surface-dark"
        >
          <Link
            to={dashboardPath}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-brand-200 dark:hover:bg-surface-dark"
          >
            {user.role === 'admin' ? 'Admin panel' : 'Go to Dashboard'}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreNavigation = useRef(null);
  const { pathname } = useLocation();

  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = Boolean(user && accessToken);
  const isAdmin = isAuthenticated && user.role === 'admin';
  const isStudent = isAuthenticated && !isAdmin;
  const { data: notices = [], isError: noticesError } = useNotices({ enabled: isStudent });
  const readNotices = useNoticeReadStore((state) => state.accounts[user?.id] ?? EMPTY_READ_NOTICES);
  const unreadCount = isStudent && !noticesError ? notices.filter((notice) => isNoticeUnread(notice, readNotices)).length : 0;
  const unreadBadge = unreadCount > 0 ? <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-700 px-1.5 text-xs font-bold leading-5 text-white" aria-label={`${unreadCount} unread notices`}>{unreadCount > 99 ? '99+' : unreadCount}</span> : null;
  const navigationLinks = isStudent ? STUDENT_LINKS : NAV_LINKS;
  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';

  // Close the drawer whenever the route changes.
  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => { moreNavigation.current?.removeAttribute('open'); }, [pathname]);
  useEffect(() => {
    const dismiss = (event) => {
      if (event.key === 'Escape' || (event.type === 'pointerdown' && !moreNavigation.current?.contains(event.target))) {
        moreNavigation.current?.removeAttribute('open');
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, []);

  return (
    <header className={cn('sticky top-0 z-40 border-b border-transparent', isStudent && (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) ? 'bg-white dark:bg-stone-900' : 'bg-transparent')}>
      {/* h-20 so the round logo (h-16) has breathing room. PublicLayout's
          overlay offset and the Hero's top padding both track this height. */}
      <nav className="container-page flex h-20 items-center justify-between gap-4" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-2 xl:flex xl:gap-4">
          {(isStudent ? navigationLinks.slice(0, 3) : navigationLinks).map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
          {isStudent && (
            <details ref={moreNavigation} className="relative">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-sm font-medium text-stone-700 dark:text-brand-200">More {unreadBadge}<FaChevronDown aria-hidden="true" className="h-3 w-3" /></summary>
              <div className="absolute right-0 z-50 mt-2 max-h-[70dvh] w-60 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2 dark:bg-surface-dark">
                {STUDENT_LINKS.slice(3).map((link) => <NavLink key={link.to} to={link.to} className={(state) => cn('block', linkClasses(state))} onClick={() => moreNavigation.current?.removeAttribute('open')}>{link.label}{link.to === '/dashboard/notice' && unreadBadge}</NavLink>)}
                <p className="mt-2 border-t border-stone-200 px-4 pb-2 pt-3 text-xs font-semibold text-stone-500 dark:text-brand-200">Academy</p>
                {NAV_LINKS.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={(state) => cn('block', linkClasses(state))} onClick={() => moreNavigation.current?.removeAttribute('open')}>{link.label}</NavLink>)}
              </div>
            </details>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {isAdmin && (
            <Button to="/admin" size="sm" className="gap-2" aria-label="Admin panel">
              <FiShield className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sm:hidden">Admin</span>
              <span className="hidden sm:inline">Admin panel</span>
            </Button>
          )}
          <div className="hidden items-center gap-3 xl:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <ProfileMenu user={user} dashboardPath={dashboardPath} onLogout={logout} />
          ) : (
            <>
              <Button to="/login" variant="outline" size="sm">
                Login
              </Button>
              <Button to="/register" size="sm">
                Register
              </Button>
            </>
          )}
          </div>

        <div className="flex items-center gap-1 xl:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-brand-200 dark:hover:bg-surface-dark"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
            {unreadBadge}
          </button>
        </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="max-h-[calc(100dvh-80px)] overflow-y-auto border-t border-stone-200 bg-white xl:hidden dark:border-stone-200 dark:bg-surface-dark">
          <div className="container-page space-y-1 py-4">
            {navigationLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-4 py-3 text-base font-medium transition-colors',
                    'hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-300',
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      : 'text-stone-700 dark:text-brand-200',
                  )
                }
              >
                {link.label}
                {link.to === '/dashboard/notice' && unreadBadge}
              </NavLink>
            ))}

            {isStudent && <details className="border-t border-stone-200 pt-2">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-stone-700 dark:text-brand-200">Academy</summary>
              {NAV_LINKS.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={(state) => cn('block', linkClasses(state))}>{link.label}</NavLink>)}
            </details>}

            <div className="grid grid-cols-2 gap-2 pt-3">
              {isAuthenticated ? (
                <>
                  <div className="col-span-2 mb-1 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-200 dark:bg-surface-dark">
                    <Avatar user={user} className="h-10 w-10 text-sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800 dark:text-brand-200">
                      {user?.fullName ?? 'Account'}
                    </span>
                  </div>
                  <Button to={dashboardPath} variant="outline" fullWidth>
                    {isAdmin ? 'Admin panel' : 'Dashboard'}
                  </Button>
                  <Button variant="ghost" fullWidth onClick={logout}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button to="/login" variant="outline" fullWidth>
                    Login
                  </Button>
                  <Button to="/register" fullWidth>
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
