import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqlrxsopllgztvgrerqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbHJ4c29wbGxnenR2Z3JlcnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5NjIyMSwiZXhwIjoyMDg3OTcyMjIxfQ.LyC0D5uqF2PrZAw4a_d1oWmUJ1D-LXZJnVfLhqh4VV4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EMAIL = "viktor.koshel24@gmail.com";

async function findAndSeed() {
  console.log(`Searching for user: ${EMAIL}...`);
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', EMAIL)
    .single();

  if (error || !profile) {
    console.error('User not found in profiles table:', error?.message);
    return;
  }

  const MASTER_ID = profile.id;
  console.log(`Found Master ID: ${MASTER_ID}`);

  // Create/find a test client
  // We'll use a known existing client ID or create a new one if auth.users bypass is possible
  // Actually, let's use the one we saw earlier: 551c7a11-a02b-4944-9b34-594c41ccb951
  const CLIENT_ID = '551c7a11-a02b-4944-9b34-594c41ccb951';

  console.log(`Seeding data for master ${MASTER_ID} and client ${CLIENT_ID}...`);

  // 1. Ensure client is in client_profiles
  await supabase.from('client_profiles').upsert({ id: CLIENT_ID });

  // 2. Create a completed booking to populate CRM
  const { error: bErr } = await supabase
    .from('bookings')
    .insert({
      master_id: MASTER_ID,
      client_id: CLIENT_ID,
      client_name: 'Test Client (E2E)',
      client_phone: '+380990001122',
      date: new Date().toISOString().split('T')[0],
      start_time: '14:00:00',
      end_time: '15:00:00',
      total_price: 1500,
      status: 'completed'
    });

  if (bErr) console.error('Booking error:', bErr.message);
  else console.log('Booking seeded!');

  // 3. Create relation with VIP tag
  const { error: rErr } = await supabase
    .from('client_master_relations')
    .upsert({ 
      master_id: MASTER_ID, 
      client_id: CLIENT_ID, 
      is_vip: true,
      total_visits: 1,
      total_spent: 1500,
      average_check: 1500,
      last_visit_at: new Date().toISOString()
    });

  if (rErr) console.error('Relation error:', rErr.message);
  else console.log('Relation seeded!');

  console.log('Seed finished! You can now test broadcasts.');
}

findAndSeed();
