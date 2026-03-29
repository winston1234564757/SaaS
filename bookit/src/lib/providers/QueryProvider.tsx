'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, focusManager, onlineManager, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/toast/context';
import type { SafeResult } from '@/lib/supabase/safeQuery';
import { createClient } from '@/lib/supabase/client';
import { RefCapture } from '@/components/shared/RefCapture';

function createQueryClient(showToast: ReturnType<typeof useToast>['showToast']) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'always',       // ігнорує navigator.onLine — завжди виконує queryFn
        staleTime: 30000,            // 30 sec defaults
        gcTime:    1000 * 60 * 15,   // 15 min — keep cache alive across navigation
        refetchOnWindowFocus: true,  // wake up stale queries on tab return
        refetchOnMount: true,        // refetch on component mount
        refetchOnReconnect: true,    // wake up on network restore
        retry: 2,                    // two retries — first may hit stale token after sleep
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000), // 1s, 2s, 4s, 8s
      },
      mutations: {
        networkMode: 'always',       // мутації теж не зупиняються при offline
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

/**
 * Universal wake-up — web + PWA.
 *
 * НЕ викликає refreshSession() вручну — це спричиняло GoTrue lock contention:
 * кілька concurrent refreshSession() змагались за один Web Lock, через 5s
 * GoTrue примусово відбирав lock і вбивав попередній refresh → мертвий токен.
 *
 * Supabase-js сам оновлює токен per-request через внутрішній _getSession().
 * Ми лише:
 *   1. Виводимо TQ з "paused" стану (onlineManager.setOnline + onFocus)
 *   2. Чистимо error state після довгого сну (resetQueries)
 *   3. TOKEN_REFRESHED → resetQueries в useAuthQuerySync нижче
 */
function useAggressiveWakeup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let hiddenAt: number | null = null;
    let waking = false;

    const cleanup = focusManager.setEventListener((onFocus) => {
      const handleVisibility = () => {
        if (document.visibilityState === 'hidden') {
          hiddenAt = Date.now();
          return;
        }
        if (document.visibilityState !== 'visible') return;
        if (waking) return;

        waking = true;

        // Виводимо TQ з "paused" стану — браузер міг не стріляти `online` при поверненні.
        onlineManager.setOnline(true);

        const elapsed = hiddenAt !== null ? Date.now() - hiddenAt : 0;
        hiddenAt = null;

        if (elapsed >= 60_000) {
          // Після 1+ хвилини: очищуємо error state і тригеримо чистий refetch.
          // Якщо токен протермінований — supabase-js оновить його per-request,
          // useAuthQuerySync отримає TOKEN_REFRESHED і зробить ще один resetQueries.
          queryClient.resetQueries({ type: 'active' });
        }

        onFocus(true);
        waking = false;
      };

      const handleFocus = () => {
        if (document.visibilityState === 'visible' && !waking) onFocus(true);
      };

      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('focus', handleFocus);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', handleFocus);
      };
    });

    return cleanup;
  }, [queryClient]);
}

/**
 * PWA deep sleep detection — для мобільних браузерів, де JS повністю заморожується.
 * Не викликає refreshSession() з тієї ж причини: lock contention.
 * Supabase оновить токен per-request самостійно.
 */
function useDeepSleepWakeup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let lastTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTime;

      if (elapsed > 180_000) {
        onlineManager.setOnline(true);
        queryClient.resetQueries({ type: 'active' });
      }

      lastTime = now;
    }, 5000);

    return () => clearInterval(interval);
  }, [queryClient]);
}

/**
 * FIX #3: Слухаємо TOKEN_REFRESHED від Supabase.
 *
 * Коли Supabase успішно оновлює JWT (фоново або явно), він емітить TOKEN_REFRESHED.
 * Без цього listener queryClient не знає про свіжий токен — запити в error state
 * залишаються мертвими до наступного F5.
 *
 * resetQueries({ type: 'active' }): очищує error state тільки у АКТИВНИХ запитів
 * (тих що зараз маунтовані). Inactive (кешовані) не чіпаємо — вони оновляться при mount.
 */
function useAuthQuerySync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'TOKEN_REFRESHED') {
        queryClient.resetQueries({ type: 'active' });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);
}

function SessionWakeup() {
  useAggressiveWakeup();
  useDeepSleepWakeup();
  useAuthQuerySync();
  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [client] = useState(() => createQueryClient(showToast));

  return (
    <QueryClientProvider client={client}>
      <RefCapture />
      <SessionWakeup />
      {children}
    </QueryClientProvider>
  );
}

