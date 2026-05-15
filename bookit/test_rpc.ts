import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// We need the service role key to bypass RLS, or a user JWT.
// Let's just use the admin client.
import { createClient as createAdminClient } from '@supabase/supabase-js';
const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createAdminClient(adminUrl, adminKey);

async function run() {
  // Let's get a master id first
  const { data: masters } = await supabase.from('master_profiles').select('id').limit(1);
  const masterId = masters?.[0]?.id;
  console.log("Master ID:", masterId);

  if (masterId) {
    const { data, error } = await supabase.rpc('get_master_clients', { p_master_id: masterId });
    console.log("Error:", error);
    if (data && data.length > 0) {
      console.log("First client:", data[0]);
    }
  }
}
run();
