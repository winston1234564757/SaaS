'use server';


import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { normalizeToE164 } from '@/lib/utils/phone';
import type { OnboardingData, Step } from '@/types/onboarding';

export async function revalidateAfterOnboarding() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/onboarding');
}

export async function saveOnboardingProfile(params: {
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  avatarEmoji: string;
  slug: string;
  referralCode: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const profileData: Record<string, unknown> = {
    id: user.id,
    role: 'master',
    full_name: params.fullName,
  };
  if (params.phone) {
    profileData.phone = normalizeToE164(params.phone) ?? params.phone;
  }
  if (params.avatarUrl) profileData.avatar_url = params.avatarUrl;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });

  if (profileError) return { error: profileError.message };

  // Preserve existing referral_code if already set
  const { data: existing } = await supabase
    .from('master_profiles')
    .select('referral_code')
    .eq('id', user.id)
    .maybeSingle();

  // referral_code ЗАВЖДИ має бути в payload upsert.
  // PostgreSQL перевіряє NOT NULL ДО конфлікт-резолюції (до ON CONFLICT DO UPDATE).
  // Якщо referral_code відсутній у payload — INSERT-фаза кидає constraint violation
  // навіть якщо рядок вже існує з правильним значенням.
  const masterData: Record<string, unknown> = {
    id: user.id,
    slug: params.slug,
    avatar_emoji: params.avatarEmoji,
    is_published: true,
    referral_code: existing?.referral_code ?? params.referralCode,
  };

  const { error: masterError } = await supabase
    .from('master_profiles')
    .upsert(masterData, { onConflict: 'id' });

  if (masterError) return { error: masterError.message };

  revalidatePath('/dashboard/onboarding');
  revalidatePath('/dashboard');
  return { error: null };
}

export async function saveOnboardingSchedule(params: {
  schedule: Record<string, { is_working: boolean; start_time: string; end_time: string }>;
  bufferTime: number;
  breaks: Array<{ start: string; end: string }>;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const results = await Promise.all(
    DAYS.map(day =>
      supabase.from('schedule_templates').upsert(
        { master_id: user.id, day_of_week: day, ...params.schedule[day] },
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
    .eq('id', user.id);

  if (whError) return { error: whError.message };

  revalidatePath('/dashboard/onboarding');
  return { error: null };
}

export async function saveOnboardingService(params: {
  name: string;
  emoji: string;
  price: number;
  durationMinutes: number;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const { error } = await supabase.from('services').insert({
    master_id: user.id,
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

  revalidatePath('/dashboard/onboarding');
  return { error: null };
}

export async function saveOnboardingProgress(
  step: Step,
  data: OnboardingData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: step, onboarding_data: data })
    .eq('id', user.id);

  if (error) return { error: error.message };
  return { error: null };
}
