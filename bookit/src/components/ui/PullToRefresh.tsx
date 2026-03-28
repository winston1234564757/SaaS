'use client';

import { useRef, useEffect, useState, useCallback, startTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * PullToRefresh — optimized with refs for touch state.
 *
 * Previous version re-registered all 3 event listeners on every
 * startY/isPulling/isRefreshing change (dozens of times per second
 * during touchmove). Now uses refs for mutable state and a single
 * stable useEffect for listener registration.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [visualState, setVisualState] = useState<'idle' | 'pulling' | 'refreshing'>('idle');
  const queryClient = useQueryClient();
  const router = useRouter();

  // Mutable refs — avoid re-registering listeners on every state change
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setVisualState('refreshing');
    try {
      await Promise.all([
        queryClient.invalidateQueries({ type: 'active' }),
        new Promise((res) => setTimeout(res, 500)),
      ]);
      startTransition(() => {
        router.refresh();
      });
    } finally {
      isRefreshingRef.current = false;
      setVisualState('idle');
    }
  }, [queryClient, router]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startYRef.current > 0) {
        const pullDistance = e.touches[0].clientY - startYRef.current;
        const wasPulling = isPullingRef.current;
        isPullingRef.current = pullDistance > 60;
        // Only update visual state when crossing the threshold
        if (isPullingRef.current !== wasPulling) {
          setVisualState(isPullingRef.current ? 'pulling' : 'idle');
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPullingRef.current && !isRefreshingRef.current) {
        isPullingRef.current = false;
        handleRefresh();
      } else {
        isPullingRef.current = false;
        if (!isRefreshingRef.current) setVisualState('idle');
      }
      startYRef.current = 0;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleRefresh]);

  return (
    <div className="relative min-h-full">
      {visualState !== 'idle' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-10 h-10 bg-white shadow-md rounded-full">
          <Loader2
            className={`w-5 h-5 ${
              visualState === 'refreshing' ? 'animate-spin' : ''
            } text-[#789A99]`}
          />
        </div>
      )}
      {children}
    </div>
  );
}
