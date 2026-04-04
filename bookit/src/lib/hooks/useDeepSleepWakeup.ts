'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient, onlineManager } from '@tanstack/react-query';
import { resetFetchController } from '@/lib/supabase/client';

const HEARTBEAT_INTERVAL = 5_000;
const FREEZE_THRESHOLD = 60_000; // браузер throttles setInterval до ~1хв у фоні

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
        if (!onlineManager.isOnline()) onlineManager.setOnline(true);

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
