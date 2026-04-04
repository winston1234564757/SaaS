'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSessionWakeup } from '@/lib/hooks/useSessionWakeup';
import { useDeepSleepWakeup } from '@/lib/hooks/useDeepSleepWakeup';

function WakeupGuard({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  useSessionWakeup();
  useDeepSleepWakeup();

  // Дебаг-хелпер: window.__qc = queryClient
  // Після деплою: window.__qc.getQueryCache().getAll().map(q => ({key: q.queryKey, ...q.state}))
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__qc = queryClient;
    }
  }, [queryClient]);

  return <>{children}</>;
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,   // 5 хв — після фону дані залишаються свіжими
            gcTime: 10 * 60 * 1000,      // 10 хв — кеш живе довше, менше cold fetches
            refetchOnWindowFocus: false, // ВИМКНЕНО — realtime + invalidateQueries достатньо; масовий залп при wake-up вбивав Supabase Web Lock
            refetchOnReconnect: true,
            networkMode: 'offlineFirst', // offline queries не зависають у pending
            retry: 2,
            retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 15000), // exponential backoff: 1s, 2s, 4s... max 15s
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WakeupGuard queryClient={queryClient}>{children}</WakeupGuard>
    </QueryClientProvider>
  );
}