
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const masterId = process.env.E2E_MASTER_ID || '9f9af225-e362-4f94-a423-020ee7d8e49c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBilling() {
  const { data: subs } = await supabase
    .from('master_subscriptions')
    .select('*')
    .eq('master_id', masterId);
  
  console.log('--- Subscriptions ---');
  console.log(JSON.stringify(subs, null, 2));

  const { data: profile } = await supabase
    .from('master_profiles')
    .select('id, subscription_tier, subscription_expires_at')
    .eq('id', masterId)
    .single();
  
  console.log('--- Profile ---');
  console.log(JSON.stringify(profile, null, 2));
}

checkBilling();
