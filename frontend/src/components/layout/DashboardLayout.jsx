import { useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { FaArrowRightFromBracket, FaBars } from 'react-icons/fa6';
import Navbar from './Navbar.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Sidebar, { ADMIN_NAV } from './Sidebar.jsx';
import Button from '@/components/ui/Button.jsx';
import MolecularBackground from '@/components/ui/backgrounds/MolecularBackground.jsx';
import { useAuthStore } from '@/lib/auth';
import { useForcedLogoutRedirect } from '@/hooks/useAuth';
import usePageTitle from '@/hooks/usePageTitle.js';
import { ROLES } from '@/constants';

/**
 * Shell for /dashboard/* and /admin/*.
 * Student dashboard is full-width (matching Genesis reference), while the
 * admin panel is sidebar-only — no public navbar — so the sidebar carries the
 * logo, theme switch and log-out.
 */
export default function DashboardLayout({ variant = ROLES.STUDENT }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = variant === ROLES.ADMIN;
  const { pathname } = useLocation();
  const isCoursesPage = pathname.replace(/\/$/, '') === '/dashboard/courses';
  const isNoticesPage = pathname.replace(/\/$/, '') === '/dashboard/notice';
  const isPaymentsPage = pathname.replace(/\/$/, '') === '/dashboard/payments';
  const isInvoicePage = pathname.startsWith('/dashboard/invoices/');

  // Sends the student to /login if the backend revokes this session mid-visit.
  useForcedLogoutRedirect();
  usePageTitle();

  if (!isAdmin) {
    return (
      <div className={`relative isolate min-h-screen bg-surface-light dark:bg-surface-dark ${isCoursesPage ? 'course-dashboard-layout' : ''} ${isNoticesPage ? 'notice-dashboard-layout' : ''} ${isPaymentsPage || isInvoicePage ? 'payment-dashboard-layout' : ''} ${isInvoicePage ? 'invoice-print-layout' : ''}`}>
        {!isCoursesPage && !isNoticesPage && !isPaymentsPage && !isInvoicePage && <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <MolecularBackground />
        </div>}
        <Navbar />
        <main className="dashboard-content container-page relative z-10 py-8">
          <Outlet />
        </main>
        <ScrollRestoration />
      </div>
    );
  }

  const sidebarHeader = (
    <div className="flex items-center justify-between gap-2 px-1">
      <Logo compact className="ml-0 lg:ml-0" />
      <ThemeToggle />
    </div>
  );

  const sidebarFooter = (
    <div className="space-y-2 border-t border-stone-200 pt-4 dark:border-stone-200">
      <div className="px-3">
        <p className="truncate text-sm font-semibold text-stone-900 dark:text-white">{user?.fullName ?? 'Admin'}</p>
        <p className="truncate text-xs text-stone-500 dark:text-brand-200">{user?.mobile}</p>
      </div>
      <Button variant="ghost" size="sm" fullWidth className="justify-start" onClick={logout}>
        <FaArrowRightFromBracket aria-hidden="true" className="h-3.5 w-3.5" />
        Log out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-subtle dark:bg-surface-dark">
      <div className="flex">
        <Sidebar
          items={ADMIN_NAV}
          title="Administration"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          header={sidebarHeader}
          footer={sidebarFooter}
        />

        <div className="relative isolate min-h-screen min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <MolecularBackground />
          </div>
          {/* Mobile top bar: the sidebar is a drawer below lg, so this is the only chrome. */}
          <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-stone-200 bg-white/90 px-4 py-2 backdrop-blur lg:hidden dark:border-stone-200 dark:bg-surface-dark/90">
            <Logo compact className="ml-0" />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
                <FaBars aria-hidden="true" className="h-4 w-4" />
                Menu
              </Button>
            </div>
          </div>

          <main className="dashboard-content relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-stone-900 dark:text-white">Admin panel</h1>
              <p className="text-sm text-stone-500 dark:text-brand-200">
                Manage students, courses, revenue and reports.
              </p>
            </div>

            <Outlet />
          </main>
        </div>
      </div>

      <ScrollRestoration />
    </div>
  );
}
