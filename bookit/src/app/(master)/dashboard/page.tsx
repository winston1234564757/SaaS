import type { Metadata } from 'next';
import { DashboardView } from '@/components/master/dashboard/DashboardView';

export const metadata: Metadata = {
  title: 'Dashboard — Bookit',
};

export default async function DashboardPage() {
  return <DashboardView />;
}
