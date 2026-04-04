// src/lib/hooks/useSessionWakeup.ts
'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { resetFetchController } from '@/lib/supabase/client';

export function useSessionWakeup() {
  const queryClient = useQueryClient();
  const lastHiddenAt = useRef(Date.now());
  const isRunning = useRef(false);

  useEffect(() => {
    async function handleVisibilityChange() {
      if (document.hidden) {
        lastHiddenAt.current = Date.now();
        return;
      }

      if (isRunning.current) return;
      isRunning.current = true;

      const gap = Date.now() - lastHiddenAt.current;
      console.debug(`[Wakeup] gap=${gap}ms`);

      try {
        // Abortуємо in-flight Supabase fetches. Supabase's _onVisibilityChanged
        // тримає lockAcquired=true під час _recoverAndRefresh() — якщо він робить
        // мережевий fetch, abort звільнить lock раніше ніж через 8s timeout.
        resetFetchController();

        // 500ms: чекаємо поки Supabase's _acquireLock finally{lockAcquired=false}
        // виконається після abort. Без цього: queries стартують поки lock ще зайнятий
        // і потрапляють в pendingInLock.
        await new Promise(r => setTimeout(r, 500));

        queryClient.cancelQueries();
        queryClient.invalidateQueries({ type: 'active' });

        console.debug('[Wakeup] done');
      } finally {
        isRunning.current = false;
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);
}
