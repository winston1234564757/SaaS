'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import { markTourSeen } from '@/app/(master)/dashboard/actions';

export interface TourStep {
  title: string;
  text: string;
}

// v2 — 8 steps covering the full dashboard
export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Твій робочий простір',
    text: 'Кожного ранку тут — зведення дня. Щоб побачити деталі запису, просто торкнись його.',
  },
  {
    title: 'Контекст дня',
    text: 'Ця стрічка змінюється залежно від завантаженості. Якщо день тихий — вона підкаже що зробити.',
  },
  {
    title: 'Розклад',
    text: 'Записи на сьогодні у хронологічному порядку. Натисни на запис, щоб підтвердити, перенести або скасувати.',
  },
  {
    title: 'Тижневий графік',
    text: 'Де є піки, а де вільно — все видно одразу. Використовуй це, щоб запланувати флеш-акції.',
  },
  {
    title: 'Швидкі дії',
    text: 'Flash Sale, Сторіс, Клієнти, Аналітика — всі ключові розділи за один тап.',
  },
  {
    title: 'Реферальна програма',
    text: 'Запрошуй колег — і отримуй знижки на тариф. Чим більше рефералів, тим більший бонус.',
  },
  {
    title: 'Клієнтські інсайти',
    text: 'Тут — хто приходив частіше за всіх і який середній чек за тиждень. Оновлюється щодня.',
  },
  {
    title: 'BookIT Академія',
    text: 'Хочеш дізнатись більше про будь-яку функцію? В Академії — короткі пояснення по кожному розділу.',
  },
];

const TOUR_NAME = 'dashboard_v2';
const TOTAL = TOUR_STEPS.length;

interface TourContextValue {
  tourStep: number;
  totalSteps: number;
  currentStepData: TourStep | null;
  handleNextStep: () => void;
  closeTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  tourStep: -1,
  totalSteps: TOTAL,
  currentStepData: null,
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
  const [evaluated, setEvaluated] = useState(false);

  useEffect(() => {
    if (isLoading || evaluated) return;
    setEvaluated(true);

    const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
    // Check both v2 (new) and legacy dashboard tour
    const hasSeen = seenTours?.[TOUR_NAME] ?? seenTours?.dashboard ?? masterProfile?.has_seen_tour ?? false;
    if (hasSeen) return;

    const t = setTimeout(() => setTourStep(0), 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const { mutate: completeTour } = useMutation({
    mutationFn: () => markTourSeen(TOUR_NAME),
    onMutate: () => {
      setTourStep(-1);
    },
    onError: () => {
      showToast({ type: 'error', title: 'Помилка', message: 'Не вдалося зберегти прогрес туру' });
    },
    onSuccess: () => {
      refresh();
    },
  });

  function handleNextStep() {
    if (tourStep < TOTAL - 1) {
      setTourStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }

  function closeTour() {
    completeTour();
  }

  const currentStepData = tourStep >= 0 && tourStep < TOTAL ? TOUR_STEPS[tourStep] : null;

  return (
    <TourContext.Provider value={{ tourStep, totalSteps: TOTAL, currentStepData, handleNextStep, closeTour }}>
      {children}
    </TourContext.Provider>
  );
}
