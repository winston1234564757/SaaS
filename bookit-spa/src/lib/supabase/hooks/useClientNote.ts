import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export function clientNoteKey(masterId: string | undefined, clientPhone: string | undefined) {
  return ['client-note', masterId, clientPhone];
}

export function useClientNote(clientPhone: string | undefined) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery<string>({
    queryKey: clientNoteKey(masterId, clientPhone),
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('master_client_notes')
        .select('note_text')
        .eq('master_id', masterId!)
        .eq('client_phone', clientPhone!)
        .maybeSingle();
      return data?.note_text ?? '';
    },
    enabled: !!masterId && !!clientPhone,
    staleTime: 60_000,
  });
}

export function useClientNoteInvalidate() {
  const qc = useQueryClient();
  const { masterProfile } = useMasterContext();
  return (clientPhone: string) =>
    qc.invalidateQueries({ queryKey: clientNoteKey(masterProfile?.id, clientPhone) });
}
