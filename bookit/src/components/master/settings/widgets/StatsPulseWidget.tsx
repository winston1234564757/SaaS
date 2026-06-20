'use client';
// humanized

import { Star, Eye, CalendarCheck, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { pluralUk } from '@/lib/utils/pluralUk';

interface StatsPulseWidgetProps {
  rating: number;
  ratingCount: number;
  viewsCount: number;
  bookingsCount: number;
  conversionRate?: number;
  repeatRate?: number;
}

export function StatsPulseWidget({
  rating,
  ratingCount,
  viewsCount,
  bookingsCount,
  conversionRate = 0,
  repeatRate = 0,
}: StatsPulseWidgetProps) {
  const conversion = viewsCount > 0 ? Math.round((bookingsCount / viewsCount) * 100) : conversionRate;

  return (
    <div className="widget-card p-4 h-full grid grid-cols-2 grid-rows-3 gap-3">{
      // humanized
    }

      <div className="flex flex-col justify-between p-3 rounded-2xl bg-warning/5 border border-warning/10">
        <div className="size-7 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
          <Star size={13} fill="currentColor" className="text-warning" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-text-primary leading-none mb-1">
            {rating > 0 ? rating.toFixed(1) : '—'}
          </p>
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">Рейтинг</p>
        </div>
      </div>

      <div className="flex flex-col justify-between p-3 rounded-2xl bg-accent/5 border border-accent/10">
        <div className="size-7 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
          <MessageSquare size={13} className="text-accent" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-text-primary leading-none mb-1">
            {ratingCount}
          </p>
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">
            {pluralUk(ratingCount, 'Відгук', 'Відгуки', 'Відгуків')}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between p-3 rounded-2xl bg-muted/20 border border-border/60">
        <div className="size-7 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
          <Eye size={13} className="text-text-mute" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-text-primary leading-none mb-1">
            {viewsCount > 0 ? viewsCount.toLocaleString() : '—'}
          </p>
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">Перегляди</p>
        </div>
      </div>

      <div className="flex flex-col justify-between p-3 rounded-2xl bg-success/5 border border-success/10">
        <div className="size-7 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
          <CalendarCheck size={13} className="text-success" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-text-primary leading-none mb-1">
            {bookingsCount}
          </p>
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">Записів / міс</p>
        </div>
      </div>
      {// humanized
      }
      <div className="flex flex-col justify-between p-3 rounded-2xl bg-accent/8 border border-accent/15">
        <div className="size-7 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <TrendingUp size={13} className="text-accent" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-text-primary leading-none mb-1">
            {conversion > 0 ? `${conversion}%` : '—'}
          </p>
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">Конверсія</p>
        </div>
      </div>

      <div className="flex flex-col justify-between p-3 rounded-2xl bg-success/8 border border-success/15">
        <div className="size-7 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
          <Users size={13} className="text-success" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-text-primary leading-none mb-1">
            {repeatRate > 0 ? `${repeatRate}%` : '—'}
          </p>
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none">Постійних</p>
        </div>
      </div>

    </div>
  );
}
