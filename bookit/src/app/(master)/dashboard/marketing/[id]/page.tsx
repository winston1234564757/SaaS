import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BroadcastDetailPage } from '@/components/master/marketing/BroadcastDetailPage';

export const metadata: Metadata = { title: 'Деталі розсилки — Bookit' };

export default async function BroadcastDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { id } = await params;

  return <BroadcastDetailPage broadcastId={id} />;
}
