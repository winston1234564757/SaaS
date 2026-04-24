
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBilling() {
  const result = {};
  
  const { data: subs } = await supabase
    .from('master_subscriptions')
    .select('*');
  result.master_subscriptions = subs;

  const { data: events } = await supabase
    .from('billing_events')
    .select('*')
    .limit(5);
  result.billing_events = events;

  const { data: profiles } = await supabase
    .from('master_profiles')
    .select('*')
    .limit(5);
  result.master_profiles = profiles;

  console.log(JSON.stringify(result, null, 2));
}

checkBilling();
