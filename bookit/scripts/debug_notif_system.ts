import { NotificationOrchestrator } from '../src/lib/notifications/NotificationOrchestrator';
import { notifMap, NotifEventType } from '../src/lib/notifications/constants/notifMap';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const userId = process.argv[2] || '551c7a11-a02b-4944-9b34-594c41ccb951'; // Viktor's ID
  const eventType = (process.argv[3] || 'booking_created') as NotifEventType;

  console.log(`\n🚀 Testing Notification System`);
  console.log(`📍 Recipient ID: ${userId}`);
  console.log(`🔔 Event Type: ${eventType}`);
  console.log(`──────────────────────────────────────────────────\n`);

  if (!notifMap[eventType]) {
    console.error(`❌ Error: Event type "${eventType}" not found in notifMap.`);
    process.exit(1);
  }

  // Sample data for testing
  const testData = {
    bookingId: '60b6b955-db9c-42c9-a705-d141e1b29027',
    clientName: 'Тестовий Клієнт',
    masterName: 'Віктор Кошель',
    masterSlug: 'viktor-koshel',
    date: new Date().toISOString().slice(0, 10),
    startTime: '12:00',
    services: 'Стрижка та борода (Тест)',
    totalPrice: 500,
    rating: 5,
    comment: 'Чудовий сервіс! (Тестовий відгук)',
    count: 3,
    tier: 'Pro',
    expiresAt: '2026-06-16',
    productName: 'Шампунь для бороди',
    stockCount: 2,
  };

  try {
    const result = await NotificationOrchestrator.send({
      eventType,
      recipientId: userId,
      recipientRole: 'master', // Viktor is a master
      masterId: userId,
      relatedBookingId: '60b6b955-db9c-42c9-a705-d141e1b29027',
      data: testData,
    });

    console.log(`✅ Result:`);
    console.log(`  - In-App:   ${result.inApp ? '🟢 Success' : '⚪ Skipped/Failed'}`);
    console.log(`  - Push:     ${result.push ? '🟢 Success' : '⚪ Skipped/Failed'}`);
    console.log(`  - Telegram: ${result.telegram ? '🟢 Success' : '⚪ Skipped/Failed'}`);
    console.log(`  - SMS:      ${result.sms ? '🟡 Success (Paid)' : '⚪ Skipped/Failed'}`);
    
    console.log(`\n🔍 Check your Telegram / Browser / notification_logs table.`);
  } catch (err: any) {
    console.error(`\n❌ Error during execution:`, err.message);
  }
}

main();
