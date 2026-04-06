'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { markTourSeen } from '@/app/(master)/dashboard/actions';

const LS_KEY = 'dashboardTourComplete';

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

export function DashboardTourProvider({
  children,
  initialHasSeenTour,
}: {
  children: React.ReactNode;
  initialHasSeenTour: boolean;
}) {
  // -1 = not yet initialized (prevents flash on SSR)
  const [tourStep, setTourStep] = useState(-1);

  useEffect(() => {
    // Якщо DB каже що тур вже бачили — пропускаємо на всіх пристроях
    if (initialHasSeenTour) return;

    const val = localStorage.getItem(LS_KEY);
    if (val === null) {
      localStorage.setItem(LS_KEY, 'in-progress');
      const t = setTimeout(() => setTourStep(0), 1000);
      return () => clearTimeout(t);
    }
    // 'in-progress' або 'true' — тур вже стартував або завершений
  }, [initialHasSeenTour]);

  function handleNextStep() {
    if (tourStep < 2) {
      setTourStep(prev => prev + 1);
    } else {
      finishTour();
    }
  }

  function closeTour() {
    finishTour();
  }

  function finishTour() {
    setTourStep(-1);
    localStorage.setItem(LS_KEY, 'true');
    void markTourSeen(); // fire-and-forget, DB persistence
  }

  return (
    <TourContext.Provider value={{ tourStep, handleNextStep, closeTour }}>
      {children}
    </TourContext.Provider>
  );
}
