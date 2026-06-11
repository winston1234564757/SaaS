'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import { markTourSeen } from '@/app/(master)/dashboard/actions';

export interface TourStep {
  title: string;
  text: string;
  emptyHint?: string;
}

// v3 — 17 steps covering every widget on the dashboard
export const TOUR_STEPS: TourStep[] = [
  {
    // step 0 — FrostGreeting
    title: 'Твій робочий простір',
    text: 'Щоранку тут — зведення дня. Торкнись будь-якого запису, щоб переглянути деталі.',
  },
  {
    // step 1 — FrostMetricsStrip
    title: 'Ключові метрики',
    text: 'Записи, доходи, клієнти — одним поглядом. Порівняння з минулим тижнем оновлюється щодня.',
  },
  {
    // step 2 — AdaptiveContextStrip
    title: 'Контекст дня',
    text: 'Ця стрічка підлаштовується: тихий день — підказки що зробити, активний — пріоритети.',
  },
  {
    // step 3 — QuickActions / FrostActionsBar
    title: 'Швидкі дії',
    text: 'Flash Sale, Сторіс, Клієнти, Аналітика — найважливіші розділи за один тап.',
  },
  {
    // step 4 — FreeSlotsWidget
    title: 'Вільні слоти',
    text: 'Ранок, день, вечір — три блоки з доступними годинами. Тисни на слот, щоб одразу записати клієнта.',
  },
  {
    // step 5 — ScheduleWidget
    title: 'Розклад',
    text: 'Записи на сьогодні у хронологічному порядку. Тисни на запис, щоб підтвердити або перенести.',
    emptyHint: 'Щойно з\'явиться перший запис — він буде саме тут.',
  },
  {
    // step 6 — WeeklyChartWidget
    title: 'Тижневий графік',
    text: 'Де піки, а де вільно — видно одразу. Використовуй це для планування Flash-акцій.',
    emptyHint: 'Графік заповниться після перших записів.',
  },
  {
    // step 7 — PeakHoursWidget
    title: 'Години піку',
    text: 'Теплова карта завантаженості по годинах і днях тижня. Темніший колір — більше записів.',
  },
  {
    // step 8 — MonthlyCalendarWidget
    title: 'Календар місяця',
    text: 'Загальна картина зайнятості на місяць. Дні з записами виділені — тисни, щоб переглянути.',
  },
  {
    // step 9 — InsightsRow
    title: 'Клієнтські інсайти',
    text: 'Топ-клієнт та середній чек за тиждень. Оновлюється щодня.',
    emptyHint: 'Після перших записів тут з\'явиться топ-клієнт та середній чек.',
  },
  {
    // step 10 — CancellationRateWidget
    title: 'Рівень скасувань',
    text: 'Відсоток скасованих записів за 30 днів. Якщо зростає — варто переглянути нагадування для клієнтів.',
  },
  {
    // step 11 — TopServicesWidget
    title: 'Топ послуги',
    text: 'Які послуги замовляють найчастіше. Підказка для флеш-акцій та розстановки пріоритетів.',
  },
  {
    // step 12 — NextFreeDaysWidget
    title: 'Вільні дні',
    text: 'Найближчі дні з великою кількістю вільних слотів — ідеально для запуску Flash Sale.',
  },
  {
    // step 13 — ChannelHealthWidget
    title: 'Канали сповіщень',
    text: 'Telegram та Push — ключові канали для нагадувань клієнтам. Зелений означає підключено і працює.',
  },
  {
    // step 14 — ClientAlertsWidget
    title: 'Клієнти без каналів',
    text: 'Клієнти, які ще не підключили жоден канал сповіщень. Надішли їм запрошення — скоротиш кількість no-show.',
  },
  {
    // step 15 — ReferralBoostWidget
    title: 'Реферальна програма',
    text: 'Запрошуй колег — отримуй знижки на тариф. Чим більше рефералів, тим більший бонус.',
  },
  {
    // step 16 — Academy (no widget target)
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
  startTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  tourStep: -1,
  totalSteps: TOTAL,
  currentStepData: null,
  handleNextStep: () => {},
  closeTour: () => {},
  startTour: () => {},
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

  function startTour() {
    setEvaluated(true);
    setTourStep(0);
  }

  const currentStepData = tourStep >= 0 && tourStep < TOTAL ? TOUR_STEPS[tourStep] : null;

  return (
    <TourContext.Provider value={{ tourStep, totalSteps: TOTAL, currentStepData, handleNextStep, closeTour, startTour }}>
      {children}
    </TourContext.Provider>
  );
}
