'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect, type ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { useGridNavigationStore } from '@/stores/gridNavigationStore';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 1 minute
            staleTime: 1 * 60 * 1000,
            // Cache is garbage collected after 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests 1 time
            retry: 1,
            // Refetch on window focus
            refetchOnWindowFocus: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  const { pruneOldSnapshots, clearNavigationStack } = useGridNavigationStore();

  // Prune old snapshots on mount
  useEffect(() => {
    pruneOldSnapshots();
  }, [pruneOldSnapshots]);

  // Clear navigation stack on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      clearNavigationStack();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [clearNavigationStack]);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </SessionProvider>
  );
}
