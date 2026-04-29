import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqlrxsopllgztvgrerqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbHJ4c29wbGxnenR2Z3JlcnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5NjIyMSwiZXhwIjoyMDg3OTcyMjIxfQ.LyC0D5uqF2PrZAw4a_d1oWmUJ1D-LXZJnVfLhqh4VV4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MASTER_ID = "9f9af225-e362-4f94-a423-020ee7d8e49c";
const CLIENT_ID = "551c7a11-a02b-4944-9b34-594c41ccb951";

async function seed() {
  console.log('Seeding correctly...');
  
  // Ensure client_profiles entry
  await supabase.from('client_profiles').upsert({ id: CLIENT_ID });

  // Booking
  const { error: bErr } = await supabase
    .from('bookings')
    .insert({
      master_id: MASTER_ID,
      client_id: CLIENT_ID,
      client_name: 'E2E Test Client',
      client_phone: '+380990000000',
      date: new Date().toISOString().split('T')[0],
      start_time: '12:00:00',
      end_time: '13:00:00',
      total_price: 1000,
      status: 'completed'
    });
    
  if (bErr) console.error('Booking error:', bErr);
  else console.log('Booking seeded!');

  // Relation
  await supabase.from('client_master_relations').upsert({ master_id: MASTER_ID, client_id: CLIENT_ID, is_vip: true });
}

seed();
