import { useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar, { ADMIN_NAV } from './Sidebar.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuthStore } from '@/lib/auth';
import { useForcedLogoutRedirect } from '@/hooks/useAuth';
import { ROLES } from '@/constants';

/**
 * Shell for /dashboard/* and /admin/*.
 * Student dashboard is full-width (matching Genesis reference), while
 * Admin keeps the administrative sidebar.
 */
export default function DashboardLayout({ variant = ROLES.STUDENT }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAdmin = variant === ROLES.ADMIN;

  // Sends the student to /login if the backend revokes this session mid-visit.
  useForcedLogoutRedirect();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-surface-dark">
        <Navbar />
        <main className="container-page py-8">
          <Outlet />
        </main>
        <ScrollRestoration />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-subtle dark:bg-surface-dark">
      <Navbar />

      <div className="container-page flex gap-0 lg:gap-8">
        <Sidebar
          items={ADMIN_NAV}
          title="Administration"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <div className="min-w-0 flex-1 py-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Admin panel
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage students, courses and reports.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              Menu
            </Button>
          </div>

          <Outlet />
        </div>
      </div>

      <ScrollRestoration />
    </div>
  );
}
