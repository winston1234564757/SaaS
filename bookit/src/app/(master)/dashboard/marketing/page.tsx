import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { StoryGenerator } from '@/components/master/marketing/StoryGenerator';

export const metadata: Metadata = { title: 'Маркетинг — Bookit' };

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: mp } = await admin
    .from('master_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const isStarter = (mp?.subscription_tier ?? 'starter') === 'starter';

  return (
    <div>
      {isStarter && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-2xl flex items-start gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(212,147,90,0.12), rgba(120,154,153,0.10))',
            border: '1px solid rgba(212,147,90,0.28)',
          }}
        >
          <span className="text-base leading-none mt-0.5 shrink-0">🔥</span>
          <p className="text-sm text-[#6B5750] leading-relaxed">
            <span className="font-semibold text-[#2C1A14]">Майстри на PRO</span>{' '}
            закривають «гарячі вікна» в 2 рази швидше завдяки професійним сторіс.{' '}
            <span className="text-[#789A99] font-medium">Шаблони «Відгук» і «Гаряче вікно» — лише в Pro.</span>
          </p>
        </div>
      )}
      <StoryGenerator />
    </div>
  );
}
