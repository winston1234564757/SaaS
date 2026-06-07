'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { ServicePairingMatrix, type ServicePair } from '../charts/ServicePairingMatrix';

interface ServicePairingProps {
  pairs: ServicePair[];
}

export function ServicePairing({ pairs }: ServicePairingProps) {
  return (
    <div className="flex flex-col gap-4 h-full min-h-[360px]">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Сумісність послуг</p>
          <span className="text-xs text-muted-foreground/70">Cross-sell аналіз спільних бронювань</span>
        </div>
        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <Layers size={16} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <ServicePairingMatrix pairs={pairs} />
      </div>
    </div>
  );
}
