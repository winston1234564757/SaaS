import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqlrxsopllgztvgrerqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbHJ4c29wbGxnenR2Z3JlcnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5NjIyMSwiZXhwIjoyMDg3OTcyMjIxfQ.LyC0D5uqF2PrZAw4a_d1oWmUJ1D-LXZJnVfLhqh4VV4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'viktor.koshel24@gmail.com';
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (profile) {
    const { count } = await supabase.from('broadcasts').select('*', { count: 'exact', head: true }).eq('master_id', profile.id);
    console.log(`Remaining broadcasts for ${email}: ${count}`);
    
    // Reset counter just in case
    await supabase.from('master_profiles').update({ broadcasts_used: 0 }).eq('id', profile.id);
    console.log(`Counter reset for ${email}.`);
  }
}

run();
