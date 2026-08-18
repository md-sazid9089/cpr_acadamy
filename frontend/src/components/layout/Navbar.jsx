import { useEffect, useState } from 'react';
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
            <>
              <Button to={dashboardPath} variant="outline" size="sm">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
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
