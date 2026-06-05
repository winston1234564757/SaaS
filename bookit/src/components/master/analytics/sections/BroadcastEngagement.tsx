'use client';

import React from 'react';
import { Send, Eye, MessageSquare, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BroadcastEngagementProps {
  sent: number;
  opened: number;
  converted: number;
}

export function BroadcastEngagement({
  sent,
  opened,
  converted,
}: BroadcastEngagementProps) {
  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const bookingRate = sent > 0 ? Math.round((converted / sent) * 100) : 0;

  return (
    <div className="flex flex-col justify-between h-full min-h-[180px]">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Маркетинг</p>
          <span className="text-xs text-muted-foreground/50">Конверсія розсилок та кампаній</span>
        </div>

        <div className="size-8 rounded-xl bg-info/10 flex items-center justify-center text-info flex-shrink-0">
          <Send size={16} />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-baseline gap-1 select-none">
          <span className="metric-value text-2xl font-bold text-foreground">{sent}</span>
          <span className="text-xs text-muted-foreground/60">повідомлень надіслано</span>
        </div>

        {sent > 0 ? (
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between text-[11px] leading-tight select-none">
              <span className="text-muted-foreground flex items-center gap-1">
                <Eye size={10} className="text-muted-foreground/60" />
                Прочитано:
              </span>
              <span className="font-bold text-foreground">
                {opened} <span className="text-[10px] text-muted-foreground/60">({openRate}%)</span>
              </span>
            </div>
            
            <div className="flex justify-between text-[11px] leading-tight select-none">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle size={10} className="text-success" />
                Заброньовано:
              </span>
              <span className="font-bold text-success">
                {converted} <span className="text-[10px] text-success/80">({bookingRate}%)</span>
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/50 mt-3 italic select-none">
            У цьому періоді ви ще не робили розсилок по клієнтській базі.
          </p>
        )}
      </div>
    </div>
  );
}
