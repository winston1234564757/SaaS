import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
// TODO: port ReferralPage component from @/components/master/referral/ReferralPage
// import { ReferralPage as ReferralPageView } from '@/components/master/referral/ReferralPage';

export function ReferralPage() {
  const { user } = useMasterContext();
  const masterId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['referral-page', masterId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: mp } = await supabase
        .from('master_profiles')
        .select('referral_code, subscription_tier, subscription_expires_at')
        .eq('id', masterId!)
        .single();

      const { count } = await supabase
        .from('master_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', mp?.referral_code ?? '');

      return {
        referralCode: mp?.referral_code ?? '',
        subscriptionTier: mp?.subscription_tier ?? 'starter',
        subscriptionExpiresAt: mp?.subscription_expires_at ?? null,
        referralCount: count ?? 0,
      };
    },
    enabled: !!masterId,
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;
  }

  return (
    <div className="p-6">
      {/* TODO: <ReferralPageView
        masterId={masterId!}
        referralCode={data?.referralCode ?? ''}
        referralCount={data?.referralCount ?? 0}
        subscriptionTier={data?.subscriptionTier ?? 'starter'}
        subscriptionExpiresAt={data?.subscriptionExpiresAt ?? null}
      /> */}
      <p className="text-sm text-[#A8928D]">
        ReferralPage — TODO (code: {data?.referralCode}, refs: {data?.referralCount})
      </p>
    </div>
  );
}
