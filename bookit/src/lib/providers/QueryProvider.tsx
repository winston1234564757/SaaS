'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // Дані свіжі 30 секунд. Потім - фонове оновлення.
            refetchOnWindowFocus: true, // ✅ ВМИКАЄМО НАЗАД. Преміум має оновлюватись!
            refetchOnReconnect: true, // ✅ Оновлювати автоматично, коли ловить інтернет
            retry: 3, // ✅ Якщо Supabase впав по таймауту (8 сек) - пробуємо ще 3 рази
            retryDelay: 2000, // ✅ Чекаємо 2 секунди між спробами (даємо 4G/WiFi підключитись)
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}