import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqlrxsopllgztvgrerqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbHJ4c29wbGxnenR2Z3JlcnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5NjIyMSwiZXhwIjoyMDg3OTcyMjIxfQ.LyC0D5uqF2PrZAw4a_d1oWmUJ1D-LXZJnVfLhqh4VV4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MASTER_ID = "551c7a11-a02b-4944-9b34-594c41ccb951";
const CLIENT_ID = "8e87a3ff-df96-46af-9d75-525d0686d835";

async function seed() {
  console.log(`Seeding: Master ${MASTER_ID}, Client ${CLIENT_ID}`);
  
  await supabase.from('client_profiles').upsert({ id: CLIENT_ID });

  const { error: bErr } = await supabase
    .from('bookings')
    .insert({
      master_id: MASTER_ID,
      client_id: CLIENT_ID,
      client_name: 'Test Marketing Client',
      client_phone: '+380998887766',
      date: new Date().toISOString().split('T')[0],
      start_time: '16:00:00',
      end_time: '17:00:00',
      total_price: 2000,
      status: 'completed'
    });

  if (bErr) console.error('Booking error:', bErr.message);
  else console.log('Booking seeded!');

  await supabase.from('client_master_relations').upsert({ 
    master_id: MASTER_ID, 
    client_id: CLIENT_ID, 
    is_vip: true 
  });

  console.log('Done! Now you should have at least 1 client in Marketing tab.');
}

seed();
