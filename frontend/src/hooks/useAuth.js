import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { FORCED_LOGOUT_EVENT } from '@/constants';

/** Convenience selector hook so components don't reach into the store shape. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const setSession = useAuthStore((s) => s.setSession);

  return {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isApproved: user?.status === 'active',
    role: user?.role ?? null,
    logout,
    setSession,
  };
}

/**
 * Redirects to /login when the api-client reports that the session was revoked
 * — typically because the account signed in on another device.
 * Mounted once, in App.
 */
export function useForcedLogoutRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => navigate('/login', { replace: true });
    window.addEventListener(FORCED_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(FORCED_LOGOUT_EVENT, handler);
  }, [navigate]);
}
