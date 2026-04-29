import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqlrxsopllgztvgrerqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbHJ4c29wbGxnenR2Z3JlcnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5NjIyMSwiZXhwIjoyMDg3OTcyMjIxfQ.LyC0D5uqF2PrZAw4a_d1oWmUJ1D-LXZJnVfLhqh4VV4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MASTER_ID = "9f9af225-e362-4f94-a423-020ee7d8e49c";

async function findClient() {
  console.log('Finding existing clients for master...');
  
  const { data, error } = await supabase
    .from('bookings')
    .select('client_id, client_name, client_phone')
    .eq('master_id', MASTER_ID)
    .not('client_id', 'is', null)
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No clients found with bookings. Checking profiles...');
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    console.log('Random profile:', profiles);
  } else {
    console.log('Found clients:', data);
  }
}

findClient();
