'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ClientDetailSheet } from '@/components/master/clients/ClientDetailSheet';
import type { ClientRow } from '@/components/master/clients/ClientsPage';

interface BookingForSheet {
  client_phone: string | null;
  date: string | null;
  total_price: number;
  status: string;
  client_name: string | null;
}

interface RelationForSheet {
  id: string;
  is_vip: boolean;
  health_notes: string | null;
  medical_notes: string | null;
}

/**
 * Завантажує клієнта за id/телефоном і відкриває ClientDetailSheet.
 * Винесено з AnalyticsPage (M-ANL-01) без зміни логіки.
 */
export function ClientSheetById({
  clientPhone,
  clientId,
  masterId,
  clientName,
  onClose,
}: {
  clientPhone?: string | null;
  clientId?: string | null;
  masterId: string;
  clientName: string;
  onClose: () => void;
}) {
  const sb = createClient();

  const { data: row, isLoading } = useQuery<ClientRow | null>({
    queryKey: ['client-sheet-detail', masterId, clientId ?? clientPhone],
    enabled: !!masterId && (!!clientId || !!clientPhone),
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ClientRow | null> => {
      let resolvedClientId: string | null = clientId ?? null;
      const resolvedPhone: string | null = clientPhone ?? null;

      // Пошук ID клієнта за номером телефону, якщо ID не передано
      if (!resolvedClientId && resolvedPhone) {
        const { data: profile } = await sb
          .from('profiles')
          .select('id')
          .eq('phone', resolvedPhone)
          .maybeSingle();
        if (profile) {
          resolvedClientId = (profile as { id: string }).id;
        }
      }

      const finalId = resolvedClientId || resolvedPhone || 'unknown';

      // Будуємо OR-умову тільки з наявними ідентифікаторами
      const orParts: string[] = [];
      if (resolvedPhone) orParts.push(`client_phone.eq.${resolvedPhone}`);
      if (resolvedClientId) orParts.push(`client_id.eq.${resolvedClientId}`);
      if (orParts.length === 0) return null;

      const [bRes, rRes] = await Promise.all([
        sb.from('bookings')
          .select('client_phone, date, total_price, status, client_name')
          .eq('master_id', masterId)
          .or(orParts.join(','))
          .order('date', { ascending: false }),
        sb.from('client_master_relations')
          .select('id, is_vip, health_notes, medical_notes')
          .eq('master_id', masterId)
          .or(resolvedClientId ? `client_id.eq.${resolvedClientId}` : `client_id.eq.00000000-0000-0000-0000-000000000000`)
          .maybeSingle(),
      ]);

      const bs = (bRes.data ?? []) as BookingForSheet[];
      const rel = rRes.data as RelationForSheet | null;
      const nonCancelled = bs.filter((b) => b.status !== 'cancelled');
      const completed = bs.filter((b) => b.status === 'completed');
      const spent = completed.reduce((s, b) => s + Number(b.total_price), 0);

      return {
        id: bs[0]?.client_phone ?? finalId,
        client_id: resolvedClientId || null,
        client_name: bs[0]?.client_name ?? clientName,
        client_phone: bs[0]?.client_phone ?? resolvedPhone ?? '',
        total_visits: nonCancelled.length,
        total_spent: spent,
        average_check: completed.length > 0 ? Math.round(spent / completed.length) : 0,
        last_visit_at: bs[0]?.date ?? null,
        last_service_name: null,
        is_vip: rel?.is_vip ?? false,
        relation_id: rel?.id ?? null,
        retention_status: 'active' as const,
        health_notes: rel?.health_notes ?? null,
        medical_notes: rel?.medical_notes ?? null,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    );
  }

  return (
    <ClientDetailSheet
      client={row ?? null}
      onClose={onClose}
    />
  );
}
