'use client';

import { useMasterContext } from '@/lib/supabase/context';
import { BlossomDashboard } from './BlossomDashboard';
import { StudioDashboard } from './StudioDashboard';
import { FrostDashboard } from './FrostDashboard';
import { DashboardDrawers } from './DashboardDrawers';

export function DashboardView() {
  const { masterProfile } = useMasterContext();
  const rawTheme = masterProfile?.mood_theme ?? 'default';
  const tier = masterProfile?.subscription_tier ?? 'starter';
  // Mirror ThemeApplier: Starter is locked to Frost layout
  const canChangeTheme = tier === 'pro' || tier === 'studio';
  const theme = canChangeTheme ? rawTheme : 'frost';

  let Layout: React.ComponentType = BlossomDashboard;
  if (theme === 'studio') Layout = StudioDashboard;
  if (theme === 'frost')  Layout = FrostDashboard;

  return (
    <>
      <Layout />
      <DashboardDrawers />
    </>
  );
}
