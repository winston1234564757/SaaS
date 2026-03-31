import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // 🚨 ПРЕМІУМ-ФІКС: Примусовий таймаут для всіх запитів
        fetch: async (url, options) => {
          const controller = new AbortController();
          // Якщо база не відповіла за 8 секунд — вбиваємо запит (щоб не було вічного спінера)
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            // Кидаємо помилку, щоб React Query зрозумів, що треба спробувати ще раз
            throw error; 
          }
        },
      },
    }
  );
}