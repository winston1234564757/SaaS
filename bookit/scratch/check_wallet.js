
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const MONO_TOKEN = process.env.MONO_API_KEY;
const walletId = 'bookit_551c7a11a02b49449b34594c41ccb951';

async function checkWallet() {
  console.log('Checking walletId:', walletId);
  const res = await fetch(
    `https://api.monobank.ua/api/merchant/wallet?walletId=${encodeURIComponent(walletId)}`,
    { headers: { 'X-Token': MONO_TOKEN } },
  );
  const json = await res.json();
  console.log('Response:', JSON.stringify(json, null, 2));
}

checkWallet();
