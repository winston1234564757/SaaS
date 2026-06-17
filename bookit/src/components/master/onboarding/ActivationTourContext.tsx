'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMasterContext } from '@/lib/supabase/context';
import { saveActivationTourStep, completeActivationTour } from '@/app/(master)/dashboard/actions';

export interface ActivationStep {
  route: string;
  tourKey: string;
  title: string;
  text: string;
  cta?: string;
}

export const ACTIVATION_STEPS: ActivationStep[] = [
  {
    route: '/dashboard',
    tourKey: 'act-0',
    title: 'Твій розклад відкритий',
    text: 'Клієнти вже можуть записатись — ось твої вільні слоти на сьогодні.',
  },
  {
    route: '/dashboard',
    tourKey: 'act-1',
    title: 'Це твоя сторінка',
    text: 'Скопіюй лінк і постав у Instagram bio — і клієнти самі знайдуть тебе.',
  },
  {
    route: '/dashboard/settings',
    tourKey: 'act-2',
    title: 'Telegram — твій пульс',
    text: "Підключи Telegram — дізнавайся про кожен новий запис миттєво, навіть якщо закрив додаток.",
    cta: 'Підключити',
  },
  {
    route: '/dashboard/clients',
    tourKey: 'act-3',
    title: 'Твоя клієнтська база',
    text: "Кожен клієнт, що запишеться через лінк, автоматично з'явиться тут. VIP, нові, в зоні ризику — все видно одразу.",
  },
  {
    route: '/dashboard/flash',
    tourKey: 'act-4',
    title: 'Порожній слот — не проблема',
    text: 'Якщо вільний час нікого не зацікавив — запусти Flash Sale. Знижка приваблює клієнтів за лічені хвилини.',
  },
  {
    route: '/dashboard/marketing',
    tourKey: 'act-5',
    title: 'Перша сторіс за 30 секунд',
    text: 'Обери вільний слот — система сама створить красиву сторіс для Instagram. Клієнти побачать тебе в стрічці.',
  },
  {
    route: '/dashboard',
    tourKey: 'act-6',
    title: 'Все готово',
    text: "Коли прийде перший запис — він з'явиться тут. Telegram повідомить тебе миттєво.",
    cta: 'Завершити',
  },
];

const TOTAL = ACTIVATION_STEPS.length;

interface ActivationTourContextValue {
  tourStep: number;
  totalSteps: number;
  currentStepData: ActivationStep | null;
  handleNextStep: () => void;
  closeTour: () => void;
}

const ActivationTourContext = createContext<ActivationTourContextValue>({
  tourStep: -1,
  totalSteps: TOTAL,
  currentStepData: null,
  handleNextStep: () => {},
  closeTour: () => {},
});

export function useActivationTour() {
  return useContext(ActivationTourContext);
}

export function ActivationTourProvider({ children }: { children: React.ReactNode }) {
  const { masterProfile, isLoading } = useMasterContext();
  const router = useRouter();
  const [tourStep, setTourStep] = useState(-1);
  const [evaluated, setEvaluated] = useState(false);

  useEffect(() => {
    if (isLoading || evaluated) return;
    setEvaluated(true);

    const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
    const seenOldTour = seenTours?.dashboard_v2 === true || masterProfile?.has_seen_tour === true;
    const seenNewTour = seenTours?.activation_v1 === true;
    if (seenOldTour || seenNewTour) return;

    const savedStep = masterProfile?.activation_tour_step;
    if (savedStep === null || savedStep === undefined) return;

    const delay = savedStep > 0 ? 800 : 1200;
    const t = setTimeout(() => setTourStep(savedStep), delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  function handleNextStep() {
    const next = tourStep + 1;
    if (next >= TOTAL) {
      setTourStep(-1);
      completeActivationTour().catch(console.error);
      return;
    }

    saveActivationTourStep(next).catch(console.error);
    setTourStep(next);

    const nextRoute = ACTIVATION_STEPS[next].route;
    if (typeof window !== 'undefined' && window.location.pathname !== nextRoute) {
      router.push(nextRoute);
    }
  }

  function closeTour() {
    setTourStep(-1);
    completeActivationTour().catch(console.error);
  }

  const currentStepData = tourStep >= 0 && tourStep < TOTAL ? ACTIVATION_STEPS[tourStep] : null;

  return (
    <ActivationTourContext.Provider value={{ tourStep, totalSteps: TOTAL, currentStepData, handleNextStep, closeTour }}>
      {children}
    </ActivationTourContext.Provider>
  );
}
