'use client';

import { useMasterContext } from '@/lib/supabase/context';
import { BlossomDashboard } from './BlossomDashboard';
import { StudioDashboard } from './StudioDashboard';
import { FrostDashboard } from './FrostDashboard';
import { DashboardDrawers } from './DashboardDrawers';

export function DashboardView() {
  const { masterProfile } = useMasterContext();
  const theme = masterProfile?.mood_theme ?? 'default';

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
