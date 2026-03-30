import { useMasterContext } from '@/lib/supabase/context';
// TODO: port AnalyticsClientLoader
// import { AnalyticsClientLoader } from '@/components/master/analytics/AnalyticsClientLoader';

export function AnalyticsPage() {
  const { masterProfile } = useMasterContext();
  const isPro =
    masterProfile?.subscription_tier === 'pro' ||
    masterProfile?.subscription_tier === 'studio';

  return (
    <div className="p-6">
      {/* TODO: <AnalyticsClientLoader isPro={isPro} /> */}
      <p className="text-sm text-[#A8928D]">Аналітика — TODO (isPro: {String(isPro)})</p>
    </div>
  );
}
