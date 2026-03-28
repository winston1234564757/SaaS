'use client';

import { useQuery} from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface ClientRow {
  id: string;
  client_id: string | null;
  client_name: string;
  client_phone: string;
  total_visits: number;
  total_spent: number;
  average_check: number;
  last_visit_at: string | null;
  is_vip: boolean;
  relation_id: string | null;
}

export function useClients() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const query = useQuery({
    queryKey: ['clients', masterId],
    queryFn: async (): Promise<ClientRow[]> => {
      const supabase = createClient();

      const [bookingsRes, relationsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('client_name, client_phone, total_price, date, status, client_id')
          .eq('master_id', masterId!)
          .neq('status', 'cancelled')
          .limit(5000), // Safety guard — prevents unbounded download for high-volume masters
        supabase
          .from('client_master_relations')
          .select('id, is_vip, client_id')
          .eq('master_id', masterId!),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (relationsRes.error) throw relationsRes.error;

      const vipByClientId = new Map<string, { id: string; is_vip: boolean }>();
      for (const r of relationsRes.data ?? []) {
        if (r.client_id) vipByClientId.set(r.client_id, { id: r.id, is_vip: r.is_vip });
      }

      const map = new Map<string, ClientRow>();

      for (const b of bookingsRes.data ?? []) {
        const phone = b.client_phone ?? '\u2014';
        const name = b.client_name ?? '\u041a\u043b\u0456\u0454\u043d\u0442';
        const price = Number(b.total_price ?? 0);
        const date = b.date as string;
        const clientId = b.client_id as string | null;
        const crm = clientId ? vipByClientId.get(clientId) : undefined;

        const existing = map.get(phone);
        if (existing) {
          existing.total_visits += 1;
          existing.total_spent += price;
          if (!existing.last_visit_at || date > existing.last_visit_at) {
            existing.last_visit_at = date;
          }
          existing.average_check = existing.total_spent / existing.total_visits;
          if (crm) {
            existing.is_vip = crm.is_vip;
            existing.relation_id = crm.id;
          }
          if (!existing.client_id && clientId) existing.client_id = clientId;
        } else {
          map.set(phone, {
            id: phone,
            client_id: clientId,
            client_name: name,
            client_phone: phone,
            total_visits: 1,
            total_spent: price,
            average_check: price,
            last_visit_at: date,
            is_vip: crm?.is_vip ?? false,
            relation_id: crm?.id ?? null,
          });
        }
      }

      return Array.from(map.values()).sort((a, b) => b.total_visits - a.total_visits);
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });

  return {
    clients: query.data ?? [],
    isLoading: query.isLoading && !!masterId,
    error: query.error,
  };
}
