import { createContext, useContext, useEffect, useState } from 'react';

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

export function DashboardTourProvider({ children }: { children: React.ReactNode }) {
  // -1 = not yet initialized (prevents flash on SSR)
  const [tourStep, setTourStep] = useState(-1);

  useEffect(() => {
    const val = localStorage.getItem(LS_KEY);
    // Запускаємо тур тільки якщо ключ відсутній (перший запуск)
    // 'in-progress' означає що тур вже стартував, але юзер перезавантажив сторінку
    if (val === null) {
      localStorage.setItem(LS_KEY, 'in-progress');
      const t = setTimeout(() => setTourStep(0), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  function handleNextStep() {
    if (tourStep < 2) {
      setTourStep(prev => prev + 1);
    } else {
      setTourStep(-1);
      localStorage.setItem(LS_KEY, 'true');
    }
  }

  function closeTour() {
    setTourStep(-1);
    localStorage.setItem(LS_KEY, 'true');
  }

  return (
    <TourContext.Provider value={{ tourStep, handleNextStep, closeTour }}>
      {children}
    </TourContext.Provider>
  );
}
