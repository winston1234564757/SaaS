'use client';

import { useMemo } from 'react';
import { useMasterContext } from '@/lib/supabase/context';
import { NotificationsBell } from './NotificationsBell';

export function DashboardGreeting() {
  const { profile, isLoading } = useMasterContext();

  const { greeting, emoji } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6)  return { greeting: 'Доброї ночі',   emoji: '🌙' };
    if (hour < 12) return { greeting: 'Доброго ранку',  emoji: '☀️' };
    if (hour < 17) return { greeting: 'Доброго дня',    emoji: '👋' };
    if (hour < 21) return { greeting: 'Доброго вечора', emoji: '🌆' };
    return             { greeting: 'Доброї ночі',   emoji: '🌙' };
  }, []);

  const today = useMemo(() => {
    return new Date().toLocaleDateString('uk-UA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  const firstName = isLoading
    ? '...'
    : (profile?.full_name ?? 'Майстре').split(' ')[0];

  return (
    <div className="flex items-start justify-between mb-2">
      <div>
        <h1 className="heading-serif text-2xl text-[#2C1A14]">
          {greeting}, {firstName} {emoji}
        </h1>
        <p className="text-sm text-[#A8928D] mt-0.5 capitalize">{today}</p>
      </div>
      <NotificationsBell />
    </div>
  );
}
