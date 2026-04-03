import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options) => {
          const controller = new AbortController();

          // Auth-ендпоінти (token refresh) потребують більше часу:
          // 5с на Web Lock acquire + мережевий запит
          const urlStr = typeof url === 'string' ? url : (url as Request).url;
          const isAuth = urlStr.includes('/auth/');
          const timeout = isAuth ? 30_000 : 15_000;

          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
          } catch (error: unknown) {
            clearTimeout(timeoutId);

            if (error instanceof DOMException && error.name === 'AbortError') {
              console.warn('[Supabase] Таймаут запиту:', urlStr);
            }
            // Зберігаємо оригінальну помилку — Supabase перевіряє error.name
            throw error;
          }
        },
      },
    }
  );
}