import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqlrxsopllgztvgrerqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbHJ4c29wbGxnenR2Z3JlcnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5NjIyMSwiZXhwIjoyMDg3OTcyMjIxfQ.LyC0D5uqF2PrZAw4a_d1oWmUJ1D-LXZJnVfLhqh4VV4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MASTER_ID = "9f9af225-e362-4f94-a423-020ee7d8e49c";
const CLIENT_ID = "00000000-0000-0000-0000-000000000001";

async function seed() {
  console.log('Seeding test client (UUID format)...');
  
  // 1. Profile
  const { error: pErr } = await supabase
    .from('profiles')
    .upsert({ id: CLIENT_ID, full_name: 'E2E Test Client', phone: '+380991112233' });
  if (pErr) console.error('Profile error:', pErr);

  // 2. Booking (completed)
  // According to migration 068, the column is 'date'
  const { error: bErr } = await supabase
    .from('bookings')
    .insert({
      master_id: MASTER_ID,
      client_id: CLIENT_ID,
      client_name: 'E2E Test Client',
      client_phone: '+380991112233',
      date: new Date().toISOString().split('T')[0],
      slot_time: '10:00',
      total_duration: 60,
      total_price: 50000,
      status: 'completed'
    });
  if (bErr) console.warn('Booking error:', bErr.message);

  // 3. Relation (VIP)
  const { error: rErr } = await supabase
    .from('client_master_relations')
    .upsert({ master_id: MASTER_ID, client_id: CLIENT_ID, is_vip: true });
  if (rErr) console.error('Relation error:', rErr);

  console.log('Done!');
}

seed();
