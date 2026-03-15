import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { StudioJoinPage } from '@/components/master/studio/StudioJoinPage';

export const metadata: Metadata = { title: 'Приєднатися до студії — Bookit' };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function StudioJoin({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <StudioJoinPage studio={null} token="" />;
  }

  const supabase = createAdminClient();
  const { data: studio } = await supabase
    .from('studios')
    .select('id, name')
    .eq('invite_token', token)
    .single();

  return <StudioJoinPage studio={studio} token={token} />;
}
