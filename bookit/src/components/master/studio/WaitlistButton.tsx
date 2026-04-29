'use client';

import { useState, useTransition } from 'react';
import { Bell, Check } from 'lucide-react';
import { joinWaitlist } from '@/lib/actions/waitlist';
import { useToast } from '@/lib/toast/context';

export function WaitlistButton({ featureSlug }: { featureSlug: string }) {
  const [joined, setJoined] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinWaitlist(featureSlug);
      if (result.error) {
        showToast({ type: 'error', title: result.error });
      } else {
        setJoined(true);
        showToast({
          type: 'success',
          title: result.alreadyJoined ? 'Ви вже у списку!' : 'Ви у списку очікування',
          message: 'Сповістимо вас одними з перших',
        });
      }
    });
  };

  return (
    <button
      onClick={handleJoin}
      disabled={joined || isPending}
      className="w-full max-w-xs py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-95 transition-all"
      style={{ boxShadow: joined ? 'none' : '0 4px 16px rgba(120,154,153,0.35)' }}
    >
      {joined ? (
        <>
          <Check size={16} />
          Ви у списку очікування
        </>
      ) : isPending ? (
        'Додаємо...'
      ) : (
        <>
          <Bell size={16} />
          Записатися у Waitlist
        </>
      )}
    </button>
  );
}
