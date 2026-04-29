import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqlrxsopllgztvgrerqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbHJ4c29wbGxnenR2Z3JlcnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5NjIyMSwiZXhwIjoyMDg3OTcyMjIxfQ.LyC0D5uqF2PrZAw4a_d1oWmUJ1D-LXZJnVfLhqh4VV4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MASTER_ID = "551c7a11-a02b-4944-9b34-594c41ccb951";

async function inspect() {
  console.log(`Inspecting data for master: ${MASTER_ID}`);

  // 1. Check CRM relations
  const { data: relations } = await supabase
    .from('client_master_relations')
    .select('client_id, is_vip, total_visits')
    .eq('master_id', MASTER_ID);
  console.log('CRM Relations:', relations);

  // 2. Check Bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, client_name, status, date')
    .eq('master_id', MASTER_ID)
    .order('created_at', { ascending: false })
    .limit(3);
  console.log('Recent Bookings:', bookings);

  // 3. Check Broadcasts
  const { data: broadcasts } = await supabase
    .from('broadcasts')
    .select('id, title, status, recipients_count, sent_at')
    .eq('master_id', MASTER_ID)
    .order('created_at', { ascending: false });
  console.log('Broadcasts History:', broadcasts);
}

inspect();
