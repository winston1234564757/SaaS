import { useMasterContext } from '@/lib/supabase/context';
import { AnalyticsPage as AnalyticsComponent } from '@/components/master/analytics/AnalyticsPage';

export function AnalyticsPage() {
  const { masterProfile } = useMasterContext();
  const isPro =
    masterProfile?.subscription_tier === 'pro' ||
    masterProfile?.subscription_tier === 'studio';

  return <AnalyticsComponent isPro={isPro} />;
}
