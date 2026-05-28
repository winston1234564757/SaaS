import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cold-start protection: cap every SSR Supabase network call at 5 s.
// Without this, getUser() (token refresh) hangs indefinitely on Vercel cold starts,
// which keeps the Next.js loading.tsx skeleton visible forever.
export const ssrFetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('ssr-timeout'), 5_000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies can't be mutated, ignore
          }
        },
      },
      global: { fetch: ssrFetch },
    }
  );
}
