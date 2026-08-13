import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { watchSystemTheme } from '@/lib/theme';
import { watchAuthAcrossTabs } from '@/lib/auth';

/** One QueryClient per app instance, with defaults suited to this data. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        // A revoked session (401) is handled by the axios interceptor, so
        // retrying it here would only delay the redirect to /login.
        retry: (failureCount, error) => (error?.status === 401 ? false : failureCount < 2),
      },
      mutations: { retry: 0 },
    },
  });
}

/** Wraps the tree in every client-side provider and global listener. */
export default function AppProviders({ children }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    const unwatchTheme = watchSystemTheme();
    const unwatchAuth = watchAuthAcrossTabs();
    return () => {
      unwatchTheme();
      unwatchAuth();
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
