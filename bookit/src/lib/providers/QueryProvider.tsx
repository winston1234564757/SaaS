'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToast } from '@/lib/toast/context';
import type { SafeResult } from '@/lib/supabase/safeQuery';

function createQueryClient(showToast: ReturnType<typeof useToast>['showToast']) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
      },
      mutations: {
        retry: 0,
        onError: (error: unknown) => {
          const supaError = (error as { __safeResult?: SafeResult<unknown> | null })?.__safeResult;
          if (supaError?.isRlsError) {
            showToast({
              type: 'error',
              title: 'Помилка доступу до даних',
              message: 'Не вдалося зберегти або завантажити дані. Перевірте права доступу (RLS) або оновіть сторінку.',
            });
          }
        },
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [client] = useState(() => createQueryClient(showToast));

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

