
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const MONO_TOKEN = process.env.MONO_API_KEY;

async function testSubscriptionCreateFinal() {
  console.log('Testing subscription/create (TOTAL GUESS FORMAT)...');
  const body = {
    amount: 500,
    ccy: 980,
    description: 'Bookit Subscription',
    redirectUrl: 'https://bookit-five-psi.vercel.app/api/billing/paid',
    webHookUrl: 'https://bookit-five-psi.vercel.app/api/billing/mono-webhook',
    interval: '1m'
  };

  const res = await fetch('https://api.monobank.ua/api/merchant/subscription/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Token': MONO_TOKEN },
    body: JSON.stringify(body),
  });
  
  const json = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(json, null, 2));
}

testSubscriptionCreateFinal();
