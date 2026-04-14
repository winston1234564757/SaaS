'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import { markTourSeen } from '@/app/(master)/dashboard/actions';

interface TourContextValue {
  tourStep: number;
  handleNextStep: () => void;
  closeTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  tourStep: -1,
  handleNextStep: () => {},
  closeTour: () => {},
});

export function useTourStep() {
  return useContext(TourContext);
}

export function DashboardTourProvider({ children }: { children: React.ReactNode }) {
  const { masterProfile, isLoading, refresh } = useMasterContext();
  const { showToast } = useToast();
  const [tourStep, setTourStep] = useState(-1);
  // Prevents re-evaluation after profile refreshes post-completion
  const [evaluated, setEvaluated] = useState(false);

  useEffect(() => {
    // Wait for profile load; only evaluate once per mount
    if (isLoading || evaluated) return;
    setEvaluated(true);

    const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
    const hasSeen = seenTours?.dashboard ?? masterProfile?.has_seen_tour ?? false;
    if (hasSeen) return;

    const t = setTimeout(() => setTourStep(0), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const { mutate: completeTour } = useMutation({
    mutationFn: () => markTourSeen('dashboard'),
    onMutate: () => {
      // Optimistic: hide tour immediately before server confirms
      setTourStep(-1);
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося зберегти прогрес туру',
      });
    },
    onSuccess: () => {
      // Re-sync masterProfile so seen_tours reflects new state
      refresh();
    },
  });

  function handleNextStep() {
    if (tourStep < 2) {
      setTourStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }

  function closeTour() {
    completeTour();
  }

  return (
    <TourContext.Provider value={{ tourStep, handleNextStep, closeTour }}>
      {children}
    </TourContext.Provider>
  );
}
