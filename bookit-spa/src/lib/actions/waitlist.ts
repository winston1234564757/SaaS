import { supabase } from '@/lib/supabase/client';

export async function joinWaitlist(
  featureSlug: string
): Promise<{ error: string | null; alreadyJoined?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const { error } = await supabase
    .from('waitlists')
    .insert({ master_id: user.id, feature_slug: featureSlug });

  if (error) {
    if (error.code === '23505') return { error: null, alreadyJoined: true };
    return { error: error.message };
  }

  return { error: null };
}
