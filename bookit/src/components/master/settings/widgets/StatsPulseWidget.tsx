'use client';
// humanized

import { Star, Eye, CalendarCheck, MessageSquare } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';

interface StatsPulseWidgetProps {
  rating: number;
  ratingCount: number;
  viewsCount: number;
  bookingsCount: number;
}

export function StatsPulseWidget({
  rating,
  ratingCount,
  viewsCount,
  bookingsCount
}: StatsPulseWidgetProps) {
  return (
    <div className="widget-card p-4 h-full grid grid-cols-2 gap-3">

      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-warning/5 border border-warning/10">
        <div className="size-7 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
          <Star size={13} fill="currentColor" className="text-warning" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-text-primary leading-none">
          {rating > 0 ? rating.toFixed(1) : '—'}
        </p>
        <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">Рейтинг</p>
      </div>

      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-accent/5 border border-accent/10">
        <div className="size-7 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
          <MessageSquare size={13} className="text-accent" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-text-primary leading-none">
          {ratingCount}
        </p>
        <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">
          {pluralUk(ratingCount, 'Відгук', 'Відгуки', 'Відгуків')}
        </p>
      </div>

      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-muted/20 border border-border/60">
        <div className="size-7 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
          <Eye size={13} className="text-text-mute" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-text-primary leading-none">
          {viewsCount > 0 ? viewsCount.toLocaleString() : '—'}
        </p>
        <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">Перегляди</p>
      </div>

      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-success/5 border border-success/10">
        <div className="size-7 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
          <CalendarCheck size={13} className="text-success" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-text-primary leading-none">
          {bookingsCount}
        </p>
        <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">Записів / міс</p>
      </div>

    </div>
  );
}
