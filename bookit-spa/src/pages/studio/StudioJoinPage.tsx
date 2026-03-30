import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function StudioJoinPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { data: studio, isLoading } = useQuery({
    queryKey: ['studio-join', token],
    queryFn: async () => {
      const supabase = createClient();
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

  // TODO: <StudioJoinPage studio={studio} token={token} /> from @/components/master/studio/StudioJoinPage
  return (
    <div className="p-6 text-sm text-[#A8928D]">
      StudioJoinPage ({studio?.name ?? (token ? `token: ${token}` : 'відсутній токен')}) — TODO
    </div>
  );
}
