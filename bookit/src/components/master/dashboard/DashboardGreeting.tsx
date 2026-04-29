'use client';

import { useMemo } from 'react';
import { useMasterContext } from '@/lib/supabase/context';
import { NotificationsBell } from './NotificationsBell';
import { Skeleton } from '@/components/ui/skeleton';
import { getNow } from '@/lib/utils/now';

export function DashboardGreeting() {
  const { profile, isLoading } = useMasterContext();

  const { greeting, emoji } = useMemo(() => {
    const hour = getNow().getHours();
    if (hour < 6)  return { greeting: 'Доброї ночі',   emoji: '🌙' };
    if (hour < 12) return { greeting: 'Доброго ранку',  emoji: '☀️' };
    if (hour < 17) return { greeting: 'Доброго дня',    emoji: '👋' };
    if (hour < 21) return { greeting: 'Доброго вечора', emoji: '🌆' };
    return             { greeting: 'Доброї ночі',   emoji: '🌙' };
  }, []);

  const today = useMemo(() => {
    return getNow().toLocaleDateString('uk-UA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-36" />
        </div>
        <NotificationsBell />
      </div>
    );
  }

  const firstName = (profile?.full_name ?? 'Майстре').split(' ')[0];

  return (
    <div className="flex items-start justify-between mb-2">
      <div>
        <h1 className="heading-serif text-2xl text-foreground" suppressHydrationWarning>
          {greeting}, {firstName} {emoji}
        </h1>
        <p className="text-sm text-muted-foreground/60 mt-0.5 capitalize" suppressHydrationWarning>{today}</p>
      </div>
      <NotificationsBell />
    </div>
  );
}
