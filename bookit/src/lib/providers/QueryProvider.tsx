'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useSessionWakeup } from '@/lib/hooks/useSessionWakeup';
import { useDeepSleepWakeup } from '@/lib/hooks/useDeepSleepWakeup';

function WakeupGuard({ children }: { children: React.ReactNode }) {
  useSessionWakeup();
  useDeepSleepWakeup();
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
      <WakeupGuard>{children}</WakeupGuard>
    </QueryClientProvider>
  );
}