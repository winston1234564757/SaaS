'use client';

import { useRouter } from 'next/navigation';
import { useUrlActionBus } from '@/lib/actions/UrlActionBus';
import { Plus, Send, Zap } from 'lucide-react';
import { BroadcastHistory } from './BroadcastHistory';

interface Props {
  broadcastsUsed: number;
  isStarter: boolean;
  isPro: boolean;
  products: { id: string; name: string; price: number }[];
}

export function BroadcastsTab({ broadcastsUsed, isStarter }: Props) {
  const router = useRouter();

  useUrlActionBus('marketing:broadcast', ({ clientIds, templateId }) => {
    const params = new URLSearchParams();
    if (clientIds) params.set('clientIds', clientIds);
    if (templateId) params.set('templateId', templateId);
    const qs = params.toString();
    router.push(`/dashboard/marketing/new${qs ? `?${qs}` : ''}`);
  });

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Send size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">Розсилки</h2>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/marketing/new')}
            data-testid="new-broadcast-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-opacity active:opacity-80"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
          >
            <Plus size={15} />
            Нова
          </button>
        </div>
        <p className="text-xs text-text-secondary">
          Push / Telegram / SMS по тегах клієнтів
        </p>
      </div>

      {/* Pro banner for Starter */}
      {isStarter && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-2xl flex items-start gap-3"
          style={{
            background: 'var(--accent-light)',
            border: '1px solid color-mix(in srgb, var(--accent) 16%, transparent)',
          }}
        >
          <Zap size={16} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {broadcastsUsed < 3
                ? `${3 - broadcastsUsed} безкоштовні розсилки залишилось`
                : 'Безкоштовний ліміт вичерпано'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Pro: необмежені розсилки, детальна аналітика, smart-шаблони по тегах.
            </p>
          </div>
        </div>
      )}

      {/* History */}
      <BroadcastHistory />
    </div>
  );
}
