'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient, onlineManager } from '@tanstack/react-query';
import { resetFetchController } from '@/lib/supabase/client';

const HEARTBEAT_INTERVAL = 5_000; // 5с
const FREEZE_THRESHOLD = 60_000;  // 60с — ловимо глибокий сон (браузер throttles setInterval до 1хв)

export function useDeepSleepWakeup() {
  const queryClient = useQueryClient();
  const lastTickRef = useRef(Date.now());
  const isRunning = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      if (elapsed <= FREEZE_THRESHOLD) return;
      if (isRunning.current) return;
      isRunning.current = true;

      console.warn(`[DeepSleep] JS був заморожений ${Math.round(elapsed / 1000)}с — відновлення`);

      try {
        onlineManager.setOnline(true);

        // Та сама послідовність що і в useSessionWakeup:
        // abort → 500ms wait → cancelQueries → invalidateQueries.
        // Без refreshSession() — з autoRefreshToken:false немає lock contention,
        // token оновиться автоматично через __loadSession при першому API call.
        resetFetchController();

        await new Promise(r => setTimeout(r, 500));

        queryClient.cancelQueries();
        queryClient.invalidateQueries({ type: 'active' });
      } finally {
        isRunning.current = false;
      }
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [queryClient]);
}
