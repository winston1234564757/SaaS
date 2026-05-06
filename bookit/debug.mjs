import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
  const { data: cProfile } = await admin.from('profiles').select('id, full_name, telegram_chat_id').like('phone', '%967953488%').single();
  const { data: mProfile } = await admin.from('profiles').select('id').like('phone', '%967953455%').single();
  
  console.log('--- Current Bookings ---');
  const { data: bookings } = await admin.from('bookings').select('id, status, date, start_time').eq('client_id', cProfile.id).order('date', { ascending: false });
  console.log(bookings);
  
  console.log('\n--- Telegram Chat ID ---');
  console.log(cProfile.telegram_chat_id);

  console.log('\n--- RPC Test ---');
  const d2 = new Date(); d2.setDate(d2.getDate() + 1);
  const date = d2.toISOString().split('T')[0];
  const time = '15:00:00';
  const slotTimestamp = date + 'T' + time + '+03:00';
  
  const { data: rpcData, error } = await admin.rpc('get_freed_slot_clients', {
      p_master_id: mProfile.id,
      p_slot_timestamp: slotTimestamp,
  });
  console.log('RPC Error:', error);
  console.log('RPC Result:', rpcData);
}
debug();
