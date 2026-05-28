import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createPortfolioDraft } from '../actions';

export default async function NewPortfolioRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let draftId: string | null = null;
  try {
    draftId = await createPortfolioDraft();
  } catch (e) {
    console.error('Failed to create portfolio draft:', e);
  }

  if (!draftId) {
    redirect('/dashboard/portfolio');
  }

  redirect(`/dashboard/portfolio/${draftId}?draft=true`);
}
