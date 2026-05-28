'use client';

import { useState, useEffect, useRef } from 'react';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { e164ToInputPhone, normalizeToE164, toFullPhone } from '@/lib/utils/phone';
import { parseError } from '@/lib/utils/errors';
import type { MoodThemeKey } from '@/lib/constants/themes';
import type { BreakWindow } from '@/types/database';
import type { CustomSegment } from '@/lib/types/segments';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DaySchedule {
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export type Schedule = Record<DayKey, DaySchedule>;

export const DAYS_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DEFAULT_SCHEDULE: Schedule = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat', 'sun'].includes(d), start_time: '09:00', end_time: '18:00' }])
) as Schedule;

export function useSettingsForm() {
  const { profile, masterProfile, refresh } = useMasterContext();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [slug, setSlug] = useState('');
  const [avatar, setAvatar] = useState('💅');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [floor, setFloor] = useState('');
  const [cabinet, setCabinet] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [themeKey, setThemeKey] = useState<MoodThemeKey>('default');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [bufferTime, setBufferTime] = useState(0);
  const [breaks, setBreaks] = useState<BreakWindow[]>([]);
  const [retentionCycleDays, setRetentionCycleDays] = useState(30);
  const [segmentConfig, setSegmentConfig] = useState<CustomSegment[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isDirty, setIsDirty] = useState(false);

  const formInitialized = useRef(false);
  const scheduleInitialized = useRef(false);
  const initialFormSnap = useRef<any>(null);
  const initialScheduleSnap = useRef<Schedule | null>(null);

  // Initialize from context
  useEffect(() => {
    if (formInitialized.current || !profile || !masterProfile) return;
    formInitialized.current = true;
    
    setFullName(profile.full_name ?? '');
    setBusinessName(masterProfile.business_name ?? '');
    setPhone(e164ToInputPhone(profile.phone));
    setAvatarUrl(profile.avatar_url ?? null);
    setBio(masterProfile.bio ?? '');
    setSlug(masterProfile.slug ?? '');
    setCity(masterProfile.city ?? '');
    setAddress(masterProfile.address ?? '');
    setLat(masterProfile.latitude ?? null);
    setLng(masterProfile.longitude ?? null);
    setFloor(masterProfile.floor ?? '');
    setCabinet(masterProfile.cabinet ?? '');
    setInstagram(masterProfile.instagram_url ?? '');
    setTelegram(masterProfile.telegram_url ?? '');
    setTelegramChatId(masterProfile.telegram_chat_id ?? '');
    setIsPublished(masterProfile.is_published ?? false);
    setAvatar(masterProfile.avatar_emoji ?? '💅');
    setThemeKey((masterProfile.mood_theme as MoodThemeKey) ?? 'default');
    setSelectedCategories(masterProfile.categories ?? []);
    setRetentionCycleDays(masterProfile.retention_cycle_days ?? 30);
    setSegmentConfig(((masterProfile.segment_config as unknown) as CustomSegment[]) ?? []);

    const wh = masterProfile.working_hours;
    setBufferTime(wh?.buffer_time_minutes ?? 0);
    setBreaks(wh?.breaks ?? []);

    initialFormSnap.current = {
      fullName: profile.full_name ?? '',
      businessName: masterProfile.business_name ?? '',
      phone: e164ToInputPhone(profile.phone),
      bio: masterProfile.bio ?? '',
      slug: masterProfile.slug ?? '',
      city: masterProfile.city ?? '',
      address: masterProfile.address ?? '',
      lat: masterProfile.latitude ?? null,
      lng: masterProfile.longitude ?? null,
      floor: masterProfile.floor ?? '',
      cabinet: masterProfile.cabinet ?? '',
      instagram: masterProfile.instagram_url ?? '',
      telegram: masterProfile.telegram_url ?? '',
      telegramChatId: masterProfile.telegram_chat_id ?? '',
      isPublished: masterProfile.is_published ?? false,
      avatar: masterProfile.avatar_emoji ?? '💅',
      themeKey: (masterProfile.mood_theme as MoodThemeKey) ?? 'default',
      avatarUrl: profile.avatar_url ?? null,
      bufferTime: wh?.buffer_time_minutes ?? 0,
      breaks: wh?.breaks ?? [],
      categories: masterProfile.categories ?? [],
      retentionCycleDays: masterProfile.retention_cycle_days ?? 30,
      segmentConfig: ((masterProfile.segment_config as unknown) as CustomSegment[]) ?? [],
    };
  }, [profile, masterProfile]);

  // Load schedule
  useEffect(() => {
    if (scheduleInitialized.current || !masterProfile?.id) return;
    scheduleInitialized.current = true;
    initialScheduleSnap.current = { ...DEFAULT_SCHEDULE };
    
    const fetchSchedule = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('schedule_templates')
        .select('*')
        .eq('master_id', masterProfile.id);

      if (data && data.length > 0) {
        const s = { ...DEFAULT_SCHEDULE };
        data.forEach((row: any) => {
          if (row.day_of_week in s) {
            s[row.day_of_week as DayKey] = {
              is_working: row.is_working,
              start_time: (row.start_time as string | null)?.slice(0, 5) ?? '09:00',
              end_time: (row.end_time as string | null)?.slice(0, 5) ?? '18:00',
            };
          }
        });
        setSchedule(s);
        initialScheduleSnap.current = s;
      }
    };

    fetchSchedule();
  }, [masterProfile?.id]);

  // Slug check
  useEffect(() => {
    if (!slug || !masterProfile?.id || slug === masterProfile.slug) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('master_profiles')
        .select('id')
        .eq('slug', slug)
        .neq('id', masterProfile.id)
        .maybeSingle();
      setSlugStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, masterProfile?.id, masterProfile?.slug]);

  // Dirty detection
  useEffect(() => {
    if (!initialFormSnap.current || !initialScheduleSnap.current) return;
    const f = initialFormSnap.current;
    const formChanged =
      fullName !== f.fullName || businessName !== f.businessName || phone !== f.phone || bio !== f.bio ||
      JSON.stringify(selectedCategories) !== JSON.stringify(f.categories) ||
      slug !== f.slug || city !== f.city || address !== f.address ||
      lat !== f.lat || lng !== f.lng || floor !== f.floor || cabinet !== f.cabinet ||
      instagram !== f.instagram ||
      telegram !== f.telegram || telegramChatId !== f.telegramChatId ||
      isPublished !== f.isPublished || avatar !== f.avatar ||
      themeKey !== f.themeKey || avatarUrl !== f.avatarUrl ||
      bufferTime !== f.bufferTime ||
      JSON.stringify(breaks) !== JSON.stringify(f.breaks) ||
      retentionCycleDays !== f.retentionCycleDays ||
      JSON.stringify(segmentConfig) !== JSON.stringify(f.segmentConfig);
    const scheduleChanged =
      JSON.stringify(schedule) !== JSON.stringify(initialScheduleSnap.current);
    setIsDirty(formChanged || scheduleChanged);
  }, [fullName, businessName, phone, bio, selectedCategories, slug, city, address, lat, lng, floor, cabinet, instagram, telegram, telegramChatId, isPublished, avatar, themeKey, avatarUrl, bufferTime, breaks, retentionCycleDays, segmentConfig, schedule]);

  const handleCancel = () => {
    const f = initialFormSnap.current;
    if (!f) return;
    setFullName(f.fullName);
    setBusinessName(f.businessName);
    setSelectedCategories(f.categories);
    setPhone(f.phone);
    setBio(f.bio);
    setSlug(f.slug);
    setCity(f.city);
    setAddress(f.address);
    setLat(f.lat);
    setLng(f.lng);
    setFloor(f.floor);
    setCabinet(f.cabinet);
    setInstagram(f.instagram);
    setTelegram(f.telegram);
    setTelegramChatId(f.telegramChatId);
    setIsPublished(f.isPublished);
    setAvatar(f.avatar);
    setThemeKey(f.themeKey);
    setAvatarUrl(f.avatarUrl);
    setBufferTime(f.bufferTime);
    setBreaks(f.breaks);
    setRetentionCycleDays(f.retentionCycleDays);
    setSegmentConfig(f.segmentConfig ?? []);
    if (initialScheduleSnap.current) setSchedule(initialScheduleSnap.current);
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (!masterProfile?.id || !profile?.id) {
      showToast({ type: 'error', title: 'Помилка', message: 'Профіль ще завантажується, спробуйте ще раз' });
      return;
    }
    setSaving(true);
    const supabase = createClient();

    try {
      const cleanPhone = phone.trim() ? (normalizeToE164(toFullPhone(phone)) ?? null) : null;
      await Promise.all([
        supabase.auth.updateUser({ data: { full_name: fullName } }),
        supabase.from('profiles').update({ full_name: fullName, phone: cleanPhone, avatar_url: avatarUrl }).eq('id', profile.id).throwOnError(),
        supabase.from('master_profiles').update({
          business_name: businessName.trim() || null,
          categories: selectedCategories,
          bio, city, address: address || null, slug,
          latitude: lat, longitude: lng,
          floor: floor || null, cabinet: cabinet || null,
          avatar_emoji: avatar,
          instagram_url: instagram || null,
          telegram_url: telegram || null,
          telegram_chat_id: telegramChatId.trim() || null,
          is_published: isPublished,
          mood_theme: themeKey,
          retention_cycle_days: retentionCycleDays,
          segment_config: segmentConfig,
          working_hours: {
            buffer_time_minutes: bufferTime,
            breaks: breaks.filter(b => b.start && b.end),
          },
        }).eq('id', masterProfile.id).throwOnError(),
      ]);

      const upserts = DAYS_ORDER.map(day =>
        supabase.from('schedule_templates').upsert({
          master_id: masterProfile.id,
          day_of_week: day,
          is_working: schedule[day].is_working,
          start_time: schedule[day].start_time,
          end_time: schedule[day].end_time,
        }, { onConflict: 'master_id,day_of_week' })
      );
      await Promise.all(upserts);

      // 4. Reset snapshot after successful save
      setSaved(true);
      showToast({ type: 'success', title: 'Збережено', message: 'Ваші налаштування успішно оновлено' });
      
      setTimeout(() => setSaved(false), 2000);
      initialFormSnap.current = { fullName, businessName, phone, bio, slug, city, address, lat, lng, floor, cabinet, instagram, telegram, telegramChatId, isPublished, avatar, themeKey, avatarUrl, bufferTime, breaks, categories: selectedCategories, retentionCycleDays, segmentConfig };
      initialScheduleSnap.current = { ...schedule };
      setIsDirty(false);
      refresh().catch(() => {});
    } catch (error: any) {
      showToast({ type: 'error', title: 'Помилка збереження', message: parseError(error) });
    } finally {
      setSaving(false);
    }
  };

  return {
    state: {
      fullName, businessName, phone, bio, slug, avatar, city, address, lat, lng, floor, cabinet, instagram, telegram, telegramChatId, isPublished, themeKey, avatarUrl, selectedCategories, schedule, bufferTime, breaks, retentionCycleDays, segmentConfig,
      saving, saved, slugStatus, isDirty
    },
    actions: {
      setFullName, setBusinessName, setPhone, setBio, setSlug, setAvatar, setCity, setAddress, setLat, setLng, setFloor, setCabinet, setInstagram, setTelegram, setTelegramChatId, setIsPublished, setThemeKey, setAvatarUrl, setSelectedCategories, setSchedule, setBufferTime, setBreaks, setRetentionCycleDays, setSegmentConfig,
      setCoords: (lat: number, lng: number) => { setLat(lat); setLng(lng); },
      handleSave, handleCancel
    }
  };
}
