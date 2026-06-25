'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export function clientTagsKey(masterId: string | undefined, clientId: string | null | undefined) {
  return ['client-tags', masterId, clientId];
}

/**
 * Персональні мітки клієнта (M-CLI-06). Точковий select по `client_master_relations.vibe_tags`
 * за `master_id` + `client_id` — навмисно НЕ через важкий RPC `get_master_clients`.
 */
export function useClientTags(clientId: string | null | undefined) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery<string[]>({
    queryKey: clientTagsKey(masterId, clientId),
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('client_master_relations')
        .select('vibe_tags')
        .eq('master_id', masterId!)
        .eq('client_id', clientId!)
        .maybeSingle();
      return (data?.vibe_tags as string[] | null) ?? [];
    },
    enabled: !!masterId && !!clientId,
    staleTime: 60_000,
  });
}

export function useClientTagsInvalidate() {
  const qc = useQueryClient();
  const { masterProfile } = useMasterContext();
  return (clientId: string) =>
    qc.invalidateQueries({ queryKey: clientTagsKey(masterProfile?.id, clientId) });
}
