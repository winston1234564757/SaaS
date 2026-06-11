import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
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
    const nextPath = encodeURIComponent(`/dashboard/partners/join?token=${token}`);
    redirect(`/login?next=${nextPath}`);
  }

  // Find the inviting master — public data, use anon client
  const pub = createPublicClient();
  const { data: inviter } = await pub
    .from('master_profiles')
    .select(`
      id, slug, avatar_emoji,
      profiles ( full_name )
    `)
    .eq('partner_invite_token', token)
    .single();

  if (!inviter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="size-16 rounded-xl bg-secondary/60 mb-4" />
        <h1 className="heading-serif text-2xl text-foreground mb-2">Запрошення не знайдено</h1>
        <p className="text-muted-foreground/60 text-sm max-w-xs">
          Можливо, посилання застаріло або воно невірне.
        </p>
      </div>
    );
  }

  if (inviter.id === user.id) {
    redirect('/dashboard/partners');
  }

  const inviterProfile = Array.isArray(inviter.profiles) ? inviter.profiles[0] : inviter.profiles;
  const inviterData = {
    name: inviterProfile?.full_name || 'Майстер',
    emoji: inviter.avatar_emoji || '',
    slug: inviter.slug,
  };

  return (
    <JoinPartnerClient
      inviter={inviterData}
      token={token}
    />
  );
}
