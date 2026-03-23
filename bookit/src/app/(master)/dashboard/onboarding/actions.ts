'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function revalidateAfterOnboarding() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/onboarding');
}

export async function saveOnboardingProfile(params: {
  userId: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  avatarEmoji: string;
  slug: string;
  referralCode: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const profileData: Record<string, unknown> = {
    id: params.userId,
    role: 'master',
    full_name: params.fullName,
  };
  if (params.phone) profileData.phone = params.phone;
  if (params.avatarUrl) profileData.avatar_url = params.avatarUrl;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });

  if (profileError) return { error: profileError.message };

  // Preserve existing referral_code if already set
  const { data: existing } = await supabase
    .from('master_profiles')
    .select('referral_code')
    .eq('id', params.userId)
    .maybeSingle();

  const masterData: Record<string, unknown> = {
    id: params.userId,
    slug: params.slug,
    avatar_emoji: params.avatarEmoji,
    is_published: true,
  };
  if (!existing?.referral_code) {
    masterData.referral_code = params.referralCode;
  }

  const { error: masterError } = await supabase
    .from('master_profiles')
    .upsert(masterData, { onConflict: 'id' });

  if (masterError) return { error: masterError.message };

  return { error: null };
}

export async function saveOnboardingSchedule(params: {
  masterId: string;
  schedule: Record<string, { is_working: boolean; start_time: string; end_time: string }>;
  bufferTime: number;
  breaks: Array<{ start: string; end: string }>;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const results = await Promise.all(
    DAYS.map(day =>
      supabase.from('schedule_templates').upsert(
        { master_id: params.masterId, day_of_week: day, ...params.schedule[day] },
        { onConflict: 'master_id,day_of_week' }
      )
    )
  );

  const scheduleError = results.find(r => r.error)?.error;
  if (scheduleError) return { error: scheduleError.message };

  const { error: whError } = await supabase
    .from('master_profiles')
    .update({
      working_hours: {
        buffer_time_minutes: params.bufferTime,
        breaks: params.breaks.filter(b => b.start && b.end),
      },
    })
    .eq('id', params.masterId);

  if (whError) return { error: whError.message };

  return { error: null };
}

export async function saveOnboardingService(params: {
  masterId: string;
  name: string;
  emoji: string;
  price: number;
  durationMinutes: number;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.from('services').insert({
    master_id: params.masterId,
    name: params.name,
    emoji: params.emoji,
    category: 'Інше',
    price: params.price,
    duration_minutes: params.durationMinutes,
    is_active: true,
    is_popular: false,
    sort_order: 0,
  });

  if (error) return { error: error.message };
  return { error: null };
}
