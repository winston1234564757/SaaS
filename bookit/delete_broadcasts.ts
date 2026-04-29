import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqlrxsopllgztvgrerqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbHJ4c29wbGxnenR2Z3JlcnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5NjIyMSwiZXhwIjoyMDg3OTcyMjIxfQ.LyC0D5uqF2PrZAw4a_d1oWmUJ1D-LXZJnVfLhqh4VV4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'viktor.koshel24@gmail.com';
  
  // 1. Find user ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .single();

  if (profileError) {
    console.error('Error finding profile:', profileError);
    return;
  }

  if (!profile) {
    console.log('Profile not found for email:', email);
    return;
  }

  console.log(`Found profile: ${profile.full_name} (${profile.id})`);

  // 2. Get broadcasts count before deletion
  const { count, error: countError } = await supabase
    .from('broadcasts')
    .select('*', { count: 'exact', head: true })
    .eq('master_id', profile.id);

  if (countError) {
    console.error('Error counting broadcasts:', countError);
    return;
  }

  console.log(`Found ${count} broadcasts for this user.`);

  if (count === 0) {
    console.log('Nothing to delete.');
    return;
  }

  // 3. Delete broadcasts
  const { error: deleteError } = await supabase
    .from('broadcasts')
    .delete()
    .eq('master_id', profile.id);

  if (deleteError) {
    console.error('Error deleting broadcasts:', deleteError);
    return;
  }

  // 4. Reset broadcasts_used counter
  const { error: resetError } = await supabase
    .from('master_profiles')
    .update({ broadcasts_used: 0 })
    .eq('id', profile.id);

  if (resetError) {
    console.error('Error resetting broadcasts_used:', resetError);
    // Not critical, but good to know
  }

  console.log(`Successfully deleted all broadcasts and reset counter for ${email}.`);
}

run();
