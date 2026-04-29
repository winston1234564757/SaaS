import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { JoinPartnerClient } from './JoinPartnerClient';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Приєднатися до мережі — Bookit' };

export default async function JoinPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Redirect to login but keep the join intent, properly encoded
    const nextPath = encodeURIComponent(`/dashboard/partners/join?token=${token}`);
    redirect(`/login?next=${nextPath}`);
  }

  const admin = createAdminClient();
  
  // Find the inviting master
  const { data: inviter } = await admin
    .from('master_profiles')
    .select(`
      id, slug, avatar_emoji,
      profiles ( full_name )
    `)
    .eq('referral_code', token)
    .single();

  if (!inviter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <span className="text-5xl mb-4">🙊</span>
        <h1 className="heading-serif text-2xl text-foreground mb-2">Запрошення не знайдено</h1>
        <p className="text-muted-foreground/60 text-sm max-w-xs">
          Можливо, посилання застаріло або воно невірне.
        </p>
      </div>
    );
  }

  // Check if invited master is trying to invite themselves
  if (inviter.id === user.id) {
    redirect('/dashboard/partners');
  }

  // inviter.profiles should be an object in this query structure
  const inviterProfile = Array.isArray(inviter.profiles) ? inviter.profiles[0] : inviter.profiles;
  const inviterData = {
    name: inviterProfile?.full_name || 'Майстер',
    emoji: inviter.avatar_emoji || '💅',
    slug: inviter.slug,
  };

  return (
    <JoinPartnerClient 
      inviter={inviterData}
      token={token}
    />
  );
}
