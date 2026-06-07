'use client';

import { useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import type { BookingWithServices } from '@/lib/supabase/hooks/useBookings';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';
import { fmt } from './StatsHelpers';

export function RevenueModal({
  isOpen,
  onClose,
  bookings,
  totalRevenue,
}: {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingWithServices[];
  totalRevenue: number;
}) {
  const completed = bookings.filter((b) => b.status === 'completed');

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()} title="Виручка сьогодні">
      <div className="flex flex-col">
        {completed.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
            Завершених записів ще немає
          </p>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {completed.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {b.services[0]?.name ?? 'Послуга'}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {b.client_name} · {b.start_time}
                    </p>
                  </div>
                  <p className="metric-value text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap flex-shrink-0">
                    {fmt(b.total_price)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--border-strong)]">
              <p className="text-sm font-medium text-[var(--text-secondary)]">Разом</p>
              <p className="metric-value text-base font-bold text-[var(--text-primary)]">
                {fmt(totalRevenue)}
              </p>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

export function ClientsModal({
  isOpen,
  onClose,
  weekBookings,
  allClients,
  newPhones,
}: {
  isOpen: boolean;
  onClose: () => void;
  weekBookings: BookingWithServices[];
  allClients: ClientRow[];
  newPhones: Set<string>;
}) {
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const norm = (p: string) => p.replace(/\D/g, '');

  const uniqueClients = (() => {
    const seen = new Set<string>();
    const result: Array<{
      name: string;
      phone: string;
      clientRow: ClientRow | null;
      isNew: boolean;
    }> = [];
    for (const b of weekBookings) {
      if (b.status === 'cancelled') continue;
      const key = b.client_phone || b.client_name;
      if (seen.has(key)) continue;
      seen.add(key);
      const clientRow = allClients.find((c) => c.client_phone === b.client_phone) ?? null;
      const isNew = !!b.client_phone && newPhones.has(norm(b.client_phone));
      result.push({ name: b.client_name, phone: b.client_phone, clientRow, isNew });
    }
    return result;
  })();

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()} title="Клієнти тижня">
        <div className="flex flex-col">
          {uniqueClients.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
              Записів на цьому тижні ще немає
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {uniqueClients.map(({ name, phone, clientRow, isNew }) => (
                <div key={phone || name} className="flex items-center justify-between py-2.5 gap-3">
                  <button
                    type="button"
                    onClick={() => clientRow && setSelectedClient(clientRow)}
                    disabled={!clientRow}
                    className="flex items-center gap-2 min-w-0 text-left disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {name}
                        </p>
                        <span
                          className={`px-1.5 py-px rounded-full text-[10px] font-bold tracking-[0.04em] ${
                            isNew
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                              : 'bg-[var(--border)] text-[var(--text-tertiary)]'
                          }`}
                        >
                          {isNew ? 'новий' : 'повт.'}
                        </span>
                      </div>
                      {phone && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{phone}</p>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="size-8 flex items-center justify-center rounded-full bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-on)] transition-colors duration-150"
                      >
                        <Phone size={13} strokeWidth={2} />
                      </a>
                    )}
                    {phone && (
                      <a
                        href={`https://t.me/+${phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="size-8 flex items-center justify-center rounded-full bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-on)] transition-colors duration-150"
                      >
                        <MessageCircle size={13} strokeWidth={2} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Sheet>

      <ClientDetailSheet client={selectedClient} onClose={() => setSelectedClient(null)} />
    </>
  );
}
