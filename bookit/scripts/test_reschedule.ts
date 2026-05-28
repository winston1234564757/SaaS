import { NotificationOrchestrator } from '../src/lib/notifications/NotificationOrchestrator';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

async function testReschedule() {
  console.log('--- Testing Reschedule Notification ---');
  
  const result = await NotificationOrchestrator.send({
    eventType: 'booking_rescheduled',
    recipientId: '551c7a11-a02b-4944-9b34-594c41ccb951', // Viktor
    recipientRole: 'client',
    masterId: '551c7a11-a02b-4944-9b34-594c41ccb951',
    relatedBookingId: '87807755-961f-442c-a076-2009228d4844',
    data: {
      bookingId: '87807755-961f-442c-a076-2009228d4844',
      masterName: 'Студія Краси Вітосіка',
      date: '2026-06-20',
      startTime: '15:30',
      services: 'Манікюр + Покриття',
    }
  });

  console.log('Result:', JSON.stringify(result, null, 2));
}

testReschedule().catch(console.error);
