import { useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar, { ADMIN_NAV, STUDENT_NAV } from './Sidebar.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuthStore } from '@/lib/auth';
import { useForcedLogoutRedirect } from '@/hooks/useAuth';
import { ROLES } from '@/constants';

/**
 * Shell for /dashboard/* and /admin/*. Picks its nav from the role so both
 * protected areas share one layout.
 */
export default function DashboardLayout({ variant = ROLES.STUDENT }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAdmin = variant === ROLES.ADMIN;

  // Sends the student to /login if the backend revokes this session mid-visit.
  useForcedLogoutRedirect();

  return (
    <div className="min-h-screen bg-surface-subtle dark:bg-surface-dark">
      <Navbar />

      <div className="container-page flex gap-0 lg:gap-8">
        <Sidebar
          items={isAdmin ? ADMIN_NAV : STUDENT_NAV}
          title={isAdmin ? 'Administration' : 'Student area'}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <div className="min-w-0 flex-1 py-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAdmin ? 'Admin panel' : `Welcome back${user?.fullName ? `, ${user.fullName}` : ''}`}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isAdmin
                  ? 'Manage students, courses and reports.'
                  : 'Your courses, progress, exams and payments in one place.'}
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
