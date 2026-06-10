'use client';

import { Star, Eye, CalendarCheck } from 'lucide-react';

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
    <div className="grid grid-cols-2 gap-3 h-full">
      {/* Rating Tile */}
      <div className="widget-card p-4 flex flex-col justify-between">
        <div className="mb-2">
          <div className="size-8 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
            <Star size={16} fill="currentColor" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tighter leading-none mb-1">
            {rating > 0 ? rating.toFixed(1) : '—'}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {ratingCount} відгуків
          </p>
        </div>
      </div>

      {/* Views Tile */}
      <div className="widget-card p-4 flex flex-col justify-between">
        <div className="mb-2">
          <div className="size-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Eye size={16} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tighter leading-none mb-1">
            {viewsCount > 0 ? viewsCount.toLocaleString() : '—'}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Перегляди
          </p>
        </div>
      </div>

      {/* Bookings Tile */}
      <div className="col-span-2 widget-card p-4 flex items-center gap-3 bg-accent/5 border-accent/10">
        <div className="size-10 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
          <CalendarCheck size={20} />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tighter leading-none">
            {bookingsCount}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Записів за місяць
          </p>
        </div>
      </div>
    </div>
  );
}
