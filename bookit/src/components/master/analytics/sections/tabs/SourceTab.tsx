'use client';

import React from 'react';
import { useSourceAttribution } from '@/lib/supabase/hooks/useSourceAttribution';
import { SkeletonCell } from '../../primitives/SkeletonCell';
import { ErrorCell } from '../../primitives/ErrorCell';
import { EmptyCell } from '../../primitives/EmptyCell';
import { ChannelDonut } from '../../charts/ChannelDonut';
import { TrendingUp } from 'lucide-react';

interface SourceTabProps {
  start: string;
  end: string;
}

export function SourceTab({ start, end }: SourceTabProps) {
  const { data, isLoading, isError, refetch } = useSourceAttribution({ start, end });

  if (isLoading) {
    return <SkeletonCell variant="flat" className="min-h-[250px]" />;
  }

  if (isError) {
    return <ErrorCell onRetry={refetch} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyCell
        title="Записів ще немає"
        description="Тут з'явиться аналітика джерел записів після того, як ви отримаєте перші бронювання."
        icon={<TrendingUp size={20} />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Картка Donut Chart */}
      <div className="bento-card p-5">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-4 select-none">
          Атрибуція джерел записів
        </p>
        <ChannelDonut data={data} />
      </div>
    </div>
  );
}
