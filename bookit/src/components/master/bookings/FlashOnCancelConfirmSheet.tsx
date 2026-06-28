'use client';

import { useTransition } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/lib/toast/context';
import { fireAutoFlashForSlot } from '@/app/(master)/dashboard/bookings/actions';
import { parseError } from '@/lib/utils/errors';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useFlashOnCancelStore } from '@/lib/stores/flashOnCancelStore';

/**
 * M-REV-02 (B): single global confirm sheet for the auto flash deal. Mounted once
 * at the bookings page root; fed by every master cancel path through the store.
 */
export function FlashOnCancelConfirmSheet() {
  const { showToast } = useToast();
  const [isPending, start] = useTransition();
  const bookingId = useFlashOnCancelStore((s) => s.bookingId);
  const prompt    = useFlashOnCancelStore((s) => s.prompt);
  const clear     = useFlashOnCancelStore((s) => s.clear);

  const open = !!(bookingId && prompt);

  const handleFire = () => {
    if (!bookingId) return;
    start(async () => {
      const { error, sentTo } = await fireAutoFlashForSlot(bookingId);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        showToast({
          type: 'success',
          title: 'Акцію запущено',
          message: sentTo > 0
            ? `Сповістили ${sentTo} ${pluralUk(sentTo, 'клієнта', 'клієнтів', 'клієнтів')}`
            : 'Акція вже активна',
        });
      }
      clear();
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => { if (!o) clear(); }}
      title="Слот звільнився"
      maxWidth="sm"
    >
      {prompt && (
        <div className="flex flex-col gap-6 pb-4">
          <div className="flex items-start gap-3">
            <span className="shrink-0 size-10 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500">
              <Zap size={18} />
            </span>
            <p className="text-sm leading-relaxed text-foreground/80">
              Запустити флеш-акцію{' '}
              <span className="font-semibold text-foreground tabular-nums">−{prompt.discountPct}%</span>
              {' '}на «{prompt.serviceName}», щоб швидко заповнити вікно?
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleFire}
              disabled={isPending}
              className="flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              Запустити акцію
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={isPending}
              className="h-12 rounded-full text-sm font-medium text-muted-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
            >
              Не треба
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
