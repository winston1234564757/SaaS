

export async function joinStudio(token: string): Promise<{ error: string | null }> {
  // TODO: rewrite as Supabase Edge Function or RPC due to RLS policies
  console.log('STUB: trying to join studio with token', token);
  return { error: 'Join studio action is temporary disabled. Requires Supabase Edge Function.' };
}
