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

      // Server-side aggregation via RPC — avoids downloading up to 5000 booking rows client-side.
      // Migration 048 creates get_master_clients(uuid) function.
      const [rpcRes, relationsRes] = await Promise.all([
        supabase.rpc('get_master_clients', { p_master_id: masterId! }),
        supabase
          .from('client_master_relations')
          .select('id, is_vip, client_id')
          .eq('master_id', masterId!),
      ]);

      if (rpcRes.error) throw rpcRes.error;
      if (relationsRes.error) throw relationsRes.error;

      const vipByClientId = new Map<string, { id: string; is_vip: boolean }>();
      for (const r of relationsRes.data ?? []) {
        if (r.client_id) vipByClientId.set(r.client_id, { id: r.id, is_vip: r.is_vip });
      }

      return (rpcRes.data ?? []).map((row: {
        client_phone: string;
        client_name: string;
        client_id: string | null;
        total_visits: number;
        total_spent: number;
        average_check: number;
        last_visit_at: string | null;
      }) => {
        const crm = row.client_id ? vipByClientId.get(row.client_id) : undefined;
        return {
          id:            row.client_phone,
          client_id:     row.client_id ?? null,
          client_name:   row.client_name ?? 'Клієнт',
          client_phone:  row.client_phone,
          total_visits:  Number(row.total_visits),
          total_spent:   Number(row.total_spent),
          average_check: Number(row.average_check),
          last_visit_at: row.last_visit_at ?? null,
          is_vip:        crm?.is_vip ?? false,
          relation_id:   crm?.id ?? null,
        };
      });
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
