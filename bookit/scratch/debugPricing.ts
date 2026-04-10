import { applyDynamicPricing } from '../src/lib/utils/dynamicPricing';

const basePrice = 1000;
const rules = {
  last_minute: { hours_ahead: 24, discount_pct: 20 }
};

// Сценарій: Бронювання на сьогодні через 2 години
// Припустимо, сьогодні 2026-04-10
const masterTimezone = 'Europe/Kyiv';
const date = new Date(); // Використаємо поточну дату
date.setFullYear(2026, 3, 10); // 10 квітня 2026 (місяці з 0)
date.setHours(0, 0, 0, 0);

// Слот через 2 години від "зараз" (імітуємо)
const time = '12:00'; 

console.log('--- Debugging Final Pricing Engine ---');
console.log('Input date (local):', date.toDateString());

const result = applyDynamicPricing(basePrice, rules, date, time, masterTimezone);
console.log('Pricing Result (Should be 800 and -20):', JSON.stringify(result, null, 2));

if (result.modifier === -20) {
  console.log('✅ SUCCESS: Discount applied correctly!');
} else {
  console.log('❌ FAILURE: Discount still not applying.');
}
