import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

/**
 * OAuth callback handler (Google тощо).
 *
 * Supabase PKCE flow: Google повертає ?code=... → Supabase JS автоматично
 * обмінює code на сесію і стріляє SIGNED_IN через onAuthStateChange.
 *
 * НЕ використовуємо MasterContext.isLoading тут — він стає false на
 * INITIAL_SESSION (null session), ще до завершення code exchange.
 * Замість цього слухаємо події безпосередньо.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const doneRef = useRef(false);

  useEffect(() => {

    async function handleSignedIn(userId: string) {
      if (doneRef.current) return;
      doneRef.current = true;

      const role = searchParams.get('role');
      const next = searchParams.get('next') ?? '/dashboard';

      // Якщо Google OAuth з роллю master — ініціалізуємо профіль майстра
      if (role === 'master') {
        const { data: mp } = await supabase
          .from('master_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!mp) {
          const { data: { user } } = await supabase.auth.getUser();
          const phone = user?.phone ?? '';

          await supabase
            .from('profiles')
            .upsert({ id: userId, role: 'master', phone }, { onConflict: 'id', ignoreDuplicates: false });

          const bytes = crypto.getRandomValues(new Uint8Array(4));
          const slug = 'master-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
          await supabase
            .from('master_profiles')
            .upsert({ id: userId, slug, is_published: false }, { onConflict: 'id', ignoreDuplicates: true });
        }
      }

      navigate(next, { replace: true });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        void handleSignedIn(session.user.id);
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        // Вже авторизований (прямий перехід на /auth/callback)
        void handleSignedIn(session.user.id);
      }
      // INITIAL_SESSION з null — code exchange ще в процесі, чекаємо SIGNED_IN
    });

    // Fallback: якщо через 15с нічого не відбулось — редирект на /login
    const timeout = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        navigate('/login', { replace: true });
      }
    }, 15_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#789A99] border-t-transparent animate-spin" />
    </div>
  );
}
