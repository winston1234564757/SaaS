'use client';

import { useEffect, useState } from 'react';
import { getChannelHealth, type ChannelHealth } from '@/app/(master)/dashboard/actions';

export function useChannelHealth(): ChannelHealth | null {
  const [data, setData] = useState<ChannelHealth | null>(null);
  useEffect(() => {
    getChannelHealth().then(setData);
  }, []);
  return data;
}
