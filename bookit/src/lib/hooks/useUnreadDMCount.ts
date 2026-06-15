'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useUnreadDMCount(userId: string | null): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    async function fetch() {
      const { data } = await supabase
        .from('conversations')
        .select('client_id, client_unread, master_unread')
        .or(`client_id.eq.${userId},master_id.eq.${userId}`);
      if (!data) return;
      setTotal(data.reduce((sum: number, c: { client_id: string; client_unread: number; master_unread: number }) => sum + (c.client_id === userId ? c.client_unread : c.master_unread), 0));
    }

    fetch();

    const channel = supabase
      .channel(`unread-dm:${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return total;
}
