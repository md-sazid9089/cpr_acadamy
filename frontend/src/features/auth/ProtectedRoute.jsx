import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { ACCOUNT_STATUS } from '@/constants';

/**
 * Route guard. Wraps a route element (or renders an <Outlet/> when used as a
 * layout route).
 *
 * Rules, in order:
 *   1. No session            -> /login, remembering where the user was headed.
 *   2. Session not approved  -> /pending-approval (OTP done, admin has not
 *                               activated the account yet).
 *   3. Wrong role            -> bounced to that role's own home.
 *
 * Auth is intentionally thin for now: it trusts the persisted Zustand session.
 * TODO: revalidate against GET /auth/me on mount once the API exists, so a
 * revoked session is caught before any protected data is requested.
 *
 * @param {{ role?: 'student' | 'admin' | 'instructor', children?: import('react').ReactNode }} props
 */
export default function ProtectedRoute({ role, children }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.status !== ACCOUNT_STATUS.ACTIVE) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children ?? <Outlet />;
}
