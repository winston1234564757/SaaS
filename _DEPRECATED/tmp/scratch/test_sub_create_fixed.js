
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const MONO_TOKEN = process.env.MONO_API_KEY;

async function testSubscriptionCreateFixed() {
  console.log('Testing subscription/create (FIXED FORMAT)...');
  const body = {
    amount: 500,
    ccy: 980,
    redirectUrl: 'https://bookit-five-psi.vercel.app/api/billing/paid',
    webHookUrls: {
      interval: '1m', // Interval is INSIDE webHookUrls according to docs
    },
    description: 'Підписка Bookit Pro'
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

testSubscriptionCreateFixed();
