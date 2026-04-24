
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findViktor() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', '%Viktor%');
  
  if (error) console.error(error);
  console.log('--- Found Profiles ---');
  console.log(JSON.stringify(data, null, 2));

  if (data && data.length > 0) {
      const id = data[0].id;
      console.log(`--- Subscriptions for ID ${id} ---`);
      const { data: subs } = await supabase
        .from('master_subscriptions')
        .select('*')
        .eq('master_id', id);
      console.log(JSON.stringify(subs, null, 2));

      console.log(`--- Profile for ID ${id} ---`);
      const { data: profile } = await supabase
        .from('master_profiles')
        .select('id, subscription_tier, subscription_expires_at')
        .eq('id', id)
        .single();
      console.log(JSON.stringify(profile, null, 2));
  }
}

findViktor();
