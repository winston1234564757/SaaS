'use client';

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
    <div className="widget-card p-4 h-full flex flex-col divide-y divide-border/60">

      <div className="flex items-center gap-3 pb-3.5">
        <div className="size-8 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
          <Star size={14} fill="currentColor" className="text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none mb-1">Рейтинг</p>
          <p className="text-base font-bold tracking-tighter text-text-primary leading-none">
            {rating > 0 ? rating.toFixed(1) : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 py-3.5">
        <div className="size-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <MessageSquare size={14} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none mb-1">Відгуки</p>
          <p className="text-base font-bold tracking-tighter text-text-primary leading-none">
            {ratingCount}{' '}
            <span className="text-[10px] font-bold text-text-mute">{pluralUk(ratingCount, 'відгук', 'відгуки', 'відгуків')}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 py-3.5">
        <div className="size-8 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
          <Eye size={14} className="text-text-mute" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none mb-1">Перегляди</p>
          <p className="text-base font-bold tracking-tighter text-text-primary leading-none">
            {viewsCount > 0 ? viewsCount.toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-3.5">
        <div className="size-8 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
          <CalendarCheck size={14} className="text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-text-mute uppercase tracking-widest leading-none mb-1">Записів за місяць</p>
          <p className="text-base font-bold tracking-tighter text-text-primary leading-none">
            {bookingsCount}
          </p>
        </div>
      </div>

    </div>
  );
}
