'use client';

import React from 'react';
import { BentoCell } from '../primitives/BentoCell';
import { GoalProgress } from './GoalProgress';
import { DynamicPricingUplift } from './DynamicPricingUplift';
import { FlashDealsCard } from './FlashDealsCard';
import { BroadcastEngagement } from './BroadcastEngagement';
import { LtvConcentration, type WinbackCandidate } from './LtvConcentration';
import { ServicePairing } from './ServicePairing';
import type { ServicePair } from '../charts/ServicePairingMatrix';

interface BentoSecondaryProps {
  isPro: boolean;
  currentRevenue: number; // в копійках
  upliftKopecks: number;
  ruleCounts: Record<string, number>;
  savedSlots: number;
  dealsCount: number;
  claimedDeals: number;
  sentBroadcasts: number;
  openedBroadcasts: number;
  convertedBroadcasts: number;
  concentrationPct: number;
  ltvDistribution: Record<string, number>;
  winbackCandidates: WinbackCandidate[];
  servicePairs: ServicePair[];
  onOpenClient?: (name: string, phone: string) => void;
}

export function BentoSecondary({
  isPro,
  currentRevenue,
  upliftKopecks,
  ruleCounts,
  savedSlots,
  dealsCount,
  claimedDeals,
  sentBroadcasts,
  openedBroadcasts,
  convertedBroadcasts,
  concentrationPct,
  ltvDistribution,
  winbackCandidates,
  servicePairs,
  onOpenClient,
}: BentoSecondaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 w-full">
      {/* 1. LTV Concentration (Pro-only, tall cell) */}
      <BentoCell variant="tall" isProGate={!isPro} className="md:col-span-3 lg:col-span-4">
        <LtvConcentration
          concentrationPct={concentrationPct}
          ltvDistribution={ltvDistribution}
          winbackCandidates={winbackCandidates}
          onOpenClient={onOpenClient}
        />
      </BentoCell>

      {/* 2. Service Pairing (Pro-only, tall cell) */}
      <BentoCell variant="tall" isProGate={!isPro} className="md:col-span-3 lg:col-span-4">
        <ServicePairing pairs={servicePairs} />
      </BentoCell>

      {/* 3. Goal Progress (доступно всім) */}
      <BentoCell variant="square" className="md:col-span-3 lg:col-span-4">
        <GoalProgress currentRevenue={currentRevenue} />
      </BentoCell>

      {/* 4. Smart Pricing Uplift */}
      <BentoCell variant="square" className="md:col-span-3 lg:col-span-4">
        <DynamicPricingUplift upliftKopecks={upliftKopecks} ruleCounts={ruleCounts} savedSlots={savedSlots} />
      </BentoCell>

      {/* 5. Flash Deals Card */}
      <BentoCell variant="square" className="md:col-span-3 lg:col-span-4">
        <FlashDealsCard dealsCount={dealsCount} claimedDeals={claimedDeals} />
      </BentoCell>

      {/* 6. Broadcast Engagement */}
      <BentoCell variant="square" className="md:col-span-3 lg:col-span-4">
        <BroadcastEngagement
          sent={sentBroadcasts}
          opened={openedBroadcasts}
          converted={convertedBroadcasts}
        />
      </BentoCell>
    </div>
  );
}
