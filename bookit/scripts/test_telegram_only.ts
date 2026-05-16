import * as dotenv from 'dotenv';
import { resolve } from 'path';

// MUST CONFIG BEFORE IMPORTING MODULES THAT USE ENV
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { sendTelegramMessage } from '../src/lib/telegram';

async function testTelegram() {
  const chatId = '491264635'; // Viktor's Chat ID
  const message = '🤖 *BookIT Notification Test*\n\nПривіт, Вікторе! Це тест системи сповіщень. Якщо ти це бачиш, Telegram-канал працює справно.';

  console.log(`\n📤 Sending test Telegram message to ${chatId}...`);
  
  try {
    const ok = await sendTelegramMessage(chatId, message, {
      inline_keyboard: [[{ text: '🔗 Відкрити Dashboard', url: 'https://bookit-five-psi.vercel.app/dashboard' }]]
    });

    if (ok) {
      console.log('✅ Telegram message sent successfully!');
    } else {
      console.log('❌ Failed to send Telegram message.');
    }
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }
}

testTelegram();
