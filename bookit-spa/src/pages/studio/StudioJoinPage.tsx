import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { StudioJoinPage as StudioJoinComponent } from '@/components/master/studio/StudioJoinPage';

export function StudioJoinPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { data: studio, isLoading } = useQuery({
    queryKey: ['studio-join', token],
    queryFn: async () => {
      const { data } = await supabase
        .from('studios')
        .select('id, name')
        .eq('invite_token', token)
        .gt('invite_token_expires_at', new Date().toISOString())
        .single();
      return data ?? null;
    },
    enabled: !!token,
  });

  if (isLoading) return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;

  return <StudioJoinComponent studio={studio!} token={token} />;
}
