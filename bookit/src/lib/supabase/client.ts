import { createBrowserClient } from '@supabase/ssr';

// ─── Глобальний kill switch для всіх in-flight Supabase запитів ───────────────
// При поверненні на вкладку — скидаємо контролер: всі pending fetch відразу
// отримують AbortError замість того щоб висіти до таймауту (15–30с).
let globalFetchController = new AbortController();

export function resetFetchController(): void {
  globalFetchController.abort('visibility-wakeup');
  globalFetchController = new AbortController();
}

// ─── Custom fetch з timeout + global abort ────────────────────────────────────
const customFetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const urlStr = typeof url === 'string' ? url : (url instanceof Request ? url.url : String(url));
  const isAuth = urlStr.includes('/auth/');
  // Auth timeout 8s: якщо fetch зависає (мережа після пробудження) → lock звільняється через 8s
  // замість 30s, щоб не блокувати всі queries нескінченно
  const timeout = isAuth ? 8_000 : 10_000;

  // Глобальний kill switch — спрацьовує при resetFetchController()
  const globalSignal = globalFetchController.signal;
  const onGlobalAbort = () => controller.abort('global-reset');
  if (globalSignal.aborted) {
    controller.abort('global-reset');
  } else {
    globalSignal.addEventListener('abort', onGlobalAbort, { once: true });
  }

  // Supabase / TanStack Query internal signal (якщо передано)
  const callerSignal = options?.signal;
  const onCallerAbort = () => controller.abort('caller-signal');
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort('caller-signal');
    } else {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    controller.abort('timeout');
    console.warn('[Supabase] fetch timeout:', urlStr);
  }, timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    globalSignal.removeEventListener('abort', onGlobalAbort);
    callerSignal?.removeEventListener('abort', onCallerAbort);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    globalSignal.removeEventListener('abort', onGlobalAbort);
    callerSignal?.removeEventListener('abort', onCallerAbort);
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(`[Supabase] fetch aborted (${controller.signal.reason ?? 'unknown'}):`, urlStr);
    }
    throw error;
  }
};

// ─── Singleton браузерного клієнта ────────────────────────────────────────────
let browserClient: ReturnType<typeof createBrowserClient> | undefined;

// Виправлений фіктивний Lock: задовольняє інтерфейс LockFunc, не блокує Web Locks API
const pwaDummyLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: pwaDummyLock,
        // autoRefreshToken: false — вимикаємо Supabase auto-refresh timer.
        // Без цього: при visibility change Supabase викликає _recoverAndRefresh()
        // всередині _acquireLock → lockAcquired = true → робить мережевий fetch
        // який зависає після пробудження → всі queries чекають в pendingInLock нескінченно.
        // З false: _recoverAndRefresh() пропускає fetch (localStorage read only) →
        // lock звільняється миттєво. Token refresh відбувається автоматично через
        // __loadSession при першому API call якщо token expired.
        autoRefreshToken: false,
        // flowType: 'implicit' — необхідно для verifyOtp({ type: 'email', token: hashed_token }).
        // PKCE flow (default в @supabase/ssr) вимагає code verifier якого немає
        // при server-side generateLink → verifyOtp повертає session: null.
        // Примітка: type: 'magiclink' deprecated в @supabase/auth-js v2 → використовувати 'email'.
        flowType: 'implicit',
      },
      global: {
        fetch: customFetch,
      },
    }
  );

  return browserClient;
}
