'use client';

import dynamic from 'next/dynamic';

const AdminOverviewCharts = dynamic(
  () => import('./AdminOverviewCharts').then(m => m.AdminOverviewCharts),
  { ssr: false }
);

interface AdminOverviewChartsWrapperProps {
  recentBookings: { date: string; count: number }[];
  subs: { name: string; value: number }[];
}

export function AdminOverviewChartsWrapper({ recentBookings, subs }: AdminOverviewChartsWrapperProps) {
  return <AdminOverviewCharts recentBookings={recentBookings} subs={subs} />;
}
