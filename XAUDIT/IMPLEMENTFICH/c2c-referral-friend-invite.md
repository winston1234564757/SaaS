# [IMPLEMENTFICH] C2C Реферальна програма "Запроси подругу"

## Статус
💎 **Повністю зроблено — НЕ виведено в маркетинг**

## Де реалізовано

### Backend (createBooking.ts — рядки 332–640)
Найскладніший блок бізнес-логіки в проекті:

```typescript
// C2C Friend Discount Validation (рядки 332–390)
// Умови: masterC2cEnabled, referral_code_used, ≤50% від суми, не повторний
const c2cFriendDiscountPct = masterC2cDiscountPct; // знижка для "подруги"
c2cReferrerId = referrerProfile.id;

// C2C Referrer Bonus (рядки 422–434)
// Server-side перевірка балансу через RPC get_c2c_balance
const c2cBonusActual = Math.min(p.c2c_bonus_to_use, serverBalance, 80);

// Запис в c2c_referrals після бронювання (рядки 618–640)
await admin.from('c2c_referrals').insert({...})
```

### DB
- `c2c_referrals` таблиця
- `master_profiles.c2c_enabled` (boolean)
- `master_profiles.c2c_discount_pct` (number)
- RPC `get_c2c_balance`

### UI (PostBookingAuth.tsx — рядок 319)
```tsx
{masterC2cEnabled && (
  <div>
    <p>Запроси подругу</p>
    <p>Вона отримає −{masterC2cDiscountPct ?? 10}% на перший візит...</p>
  </div>
)}
```

## Де НЕ згадується
- ❌ Лендінг `LandingBentoFeatures.tsx` — жодного слова
- ❌ Pricing — не вказано як особливість
- ❌ Dashboard Marketing Hub — немає статистики C2C конверсій
- ❌ `SettingsPage.tsx` — немає toggle увімкнення

## Маркетингова цінність
🚀 **Вірусний механізм росту** — клієнт приводить нового клієнта зі знижкою, майстер отримує бонус. Це класичний referral двигун для B2C.

## Рекомендація
1. Додати toggle у Settings для майстра
2. Додати на лендінг як "Вірусна реферальна програма для клієнтів"
3. Показати статистику в Dashboard (скільки "подруг" привів кожен клієнт)
