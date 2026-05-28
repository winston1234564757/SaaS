import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import {
  getBroadcasts,
  getBroadcastAnalytics,
  getBroadcastDeliveryResults,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
  sendBroadcast,
  previewBroadcastRecipients,
  getClientsForPicker,
  type CreateBroadcastInput,
} from '@/app/(master)/dashboard/marketing/actions';
import type { BroadcastTagFilter } from '@/types/database';

export function useBroadcasts() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery({
    queryKey: ['broadcasts', masterId],
    queryFn:  () => getBroadcasts().then(r => r.data),
    enabled:  !!masterId,
    staleTime: 60_000,
  });
}

export function useBroadcastAnalytics(broadcastId: string | null) {
  const { masterProfile } = useMasterContext();
  return useQuery({
    queryKey: ['broadcast-analytics', broadcastId],
    queryFn:  () => getBroadcastAnalytics(broadcastId!),
    enabled:  !!broadcastId && !!masterProfile?.id,
    staleTime: 30_000,
  });
}

export function useBroadcastDeliveryResults(broadcastId: string | null) {
  const { masterProfile } = useMasterContext();
  return useQuery({
    queryKey: ['broadcast-delivery', broadcastId],
    queryFn:  () => getBroadcastDeliveryResults(broadcastId!),
    enabled:  !!broadcastId && !!masterProfile?.id,
    staleTime: 60_000,
  });
}

export function usePreviewRecipients(
  tagFilters: BroadcastTagFilter[],
  page = 0,
) {
  const { masterProfile } = useMasterContext();
  return useQuery({
    queryKey: ['broadcast-preview', masterProfile?.id, tagFilters, page],
    queryFn:  () => previewBroadcastRecipients(tagFilters, page),
    enabled:  !!masterProfile?.id,
    staleTime: 30_000,
  });
}

export function useClientsForPicker(search: string, page = 0) {
  const { masterProfile } = useMasterContext();
  return useQuery({
    queryKey: ['clients-picker', masterProfile?.id, search, page],
    queryFn:  () => getClientsForPicker(search, page),
    enabled:  !!masterProfile?.id,
    staleTime: 30_000,
  });
}

export function useBroadcastMutations() {
  const qc = useQueryClient();
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const invalidate = () => qc.invalidateQueries({ queryKey: ['broadcasts', masterId] });

  const create = useMutation({
    mutationFn: (input: CreateBroadcastInput) => createBroadcast(input),
    onSuccess:  invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateBroadcastInput> }) =>
      updateBroadcast(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBroadcast(id),
    onSuccess:  invalidate,
  });

  const send = useMutation({
    mutationFn: ({ id, clientIds }: { id: string; clientIds: string[] }) =>
      sendBroadcast(id, clientIds),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['broadcast-analytics'] });
      qc.invalidateQueries({ queryKey: ['broadcast-delivery'] });
      qc.invalidateQueries({ queryKey: ['broadcast-preview'] });
      qc.invalidateQueries({ queryKey: ['clients-picker'] });
    },
  });

  return { create, update, remove, send };
}
