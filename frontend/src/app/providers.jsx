import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { watchSystemTheme } from '@/lib/theme';
import { useAuthStore, watchAuthAcrossTabs } from '@/lib/auth';
import apiClient from '@/lib/api-client';
import { watchSessionCache } from '@/lib/session-cache';

/**
 * The persisted session is trusted for the first paint, then checked once
 * against the server. A revoked token is logged out by the api-client
 * interceptor; a changed account status (e.g. approved overnight) is picked up.
 */
function revalidateSession() {
  const { accessToken, setUser } = useAuthStore.getState();
  if (!accessToken) return;
  apiClient
    .get('/auth/me')
    .then(({ data }) => {
      if (useAuthStore.getState().accessToken === accessToken) setUser(data);
    })
    .catch(() => {});
}

/** One QueryClient per app instance, with defaults suited to this data. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        // Never retry a 4xx: the request was answered, the answer just wasn't
        // what we wanted. A revoked session (401) is handled by the axios
        // interceptor, and retrying a 404 only makes "not found" pages sit on a
        // spinner for several seconds before showing the error.
        retry: (failureCount, error) => {
          const status = error?.status;
          if (status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}

/** Wraps the tree in every client-side provider and global listener. */
export default function AppProviders({ children }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    const unwatchCache = watchSessionCache(queryClient, useAuthStore);
    const unwatchTheme = watchSystemTheme();
    const unwatchAuth = watchAuthAcrossTabs();
    revalidateSession();
    return () => {
      unwatchCache();
      unwatchTheme();
      unwatchAuth();
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
