# ~~[PLANFICH]~~ → [ПЕРЕГЛЯНУТО] Starter Booking Limit

## Статус
✅ **ЗНАХІДКА СКАСОВАНА — ліміт реалізований, аудит був помилковим**

## Де реально перевіряється

`src/lib/actions/createBooking.ts` — рядки 176–193:

```typescript
// 4. Starter booking limit (30/month)
if (mp.subscription_tier === 'starter') {
  const nowInTZ = toZonedTime(getNow(), masterTimezone);
  const monthStart = new Date(nowInTZ.getFullYear(), nowInTZ.getMonth(), 1).toISOString();
  const { count } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('master_id', p.masterId)
    .gte('created_at', monthStart)
    .neq('status', 'cancelled');
  if ((count ?? 0) >= 30) {
    return {
      bookingId: null,
      error: 'Досягнуто ліміт 30 записів на місяць. Перейдіть на Pro.',
      upgradeRequired: true,
    };
  }
}
```

Також в JSDoc (рядок 83):
> `Booking-per-month limit (Starter: 30) is enforced server-side.`

## Чому grep не знайшов

Grep шукав `booking.*limit`, `monthly.*count` — але в коді написано `>= 30` та коментар `// Starter booking limit (30/month)`. Не ті слова.

## Що залишається як відкрите питання

**Бізнес-рішення щодо ліміту:** поточний код фіксує `30`. Три джерела, два значення:

| Джерело | Значення |
|---|---|
| `createBooking.ts` (реальний код) | **30** |
| `LandingPricing.tsx` | **30** |
| `SupportPage.tsx` | **30** |
| `BOOKIT.md` | **50** ← розсинхрон |

**Рекомендація:** оновити `BOOKIT.md` щоб відповідало коду (30), або провести бізнес-аналіз і змінити код.
