// SPA shim for referrals
export async function getOrCreateReferralLink(
  ownerId: string,
  role: 'master' | 'client',
  targetType: 'B2B' | 'C2M' | 'C2C',
  targetMasterId?: string | null,
): Promise<{ success: true; code: string; link: string } | { success: false; error: string }> {
  console.log('STUB: getOrCreateReferralLink', { ownerId, role, targetType, targetMasterId });
  return { success: false, error: 'Referrals are not supported in SPA currently. Requires Supabase Edge Function.' };
}
