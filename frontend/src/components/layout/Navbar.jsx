import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuthStore } from '@/lib/auth';
import { useScrolled } from '@/hooks/useScrolled';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/batches', label: 'Batches' },
  { to: '/class', label: 'Class' },
  { to: '/faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

const linkClasses = ({ isActive }) =>
  cn(
    'rounded-lg px-4 py-2.5 text-base font-medium transition-colors',
    // Green wash on hover, not just green text, so the target reads as a
    // control rather than a colour change.
    'hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-300',
    isActive
      ? 'text-brand-700 dark:text-brand-400'
      : 'text-slate-600 dark:text-slate-300',
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
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800"
      >
        <Avatar user={user} className="h-9 w-9 text-sm" />
        <span className="max-w-[10rem] truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {user?.fullName ?? 'Account'}
        </span>
        <svg
          className={cn('h-4 w-4 text-slate-500 transition-transform', open && 'rotate-180')}
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
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-surface-dark"
        >
          <Link
            to={dashboardPath}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Go to Dashboard
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
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
  const { pathname } = useLocation();
  const scrolled = useScrolled();
  const isSolid = scrolled || mobileOpen;

  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = Boolean(user && accessToken);
  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';

  // Close the drawer whenever the route changes.
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors duration-300',
        // Transparent while at the very top; the surface fades in on scroll.
        // The open mobile drawer counts as "solid" too, otherwise the panel
        // would hang off a see-through bar.
        isSolid
          ? 'border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-surface-dark/90'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      {/* h-20 so the round logo (h-16) has breathing room. PublicLayout's
          overlay offset and the Hero's top padding both track this height. */}
      <nav className="container-page flex h-20 items-center justify-between gap-4" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-2 lg:flex xl:gap-4">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
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

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-surface-dark">
          <div className="container-page space-y-1 py-4">
            {NAV_LINKS.map((link) => (
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
                      : 'text-slate-700 dark:text-slate-300',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="grid grid-cols-2 gap-2 pt-3">
              {isAuthenticated ? (
                <>
                  <div className="col-span-2 mb-1 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                    <Avatar user={user} className="h-10 w-10 text-sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {user?.fullName ?? 'Account'}
                    </span>
                  </div>
                  <Button to={dashboardPath} variant="outline" fullWidth>
                    Dashboard
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
