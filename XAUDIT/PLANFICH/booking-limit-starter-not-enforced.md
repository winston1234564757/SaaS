# [PLANFICH → СКАСОВАНО] Booking Limit Starter Not Enforced

## ✅ ЗНАХІДКА СКАСОВАНА — Ліміт РЕАЛІЗОВАНИЙ

### Де?
`src/lib/actions/createBooking.ts` — рядки 176–193

```typescript
// 4. Starter booking limit (40/month)
if (mp.subscription_tier === 'starter') {
  const nowInTZ = toZonedTime(getNow(), masterTimezone);
  const monthStart = new Date(nowInTZ.getFullYear(), nowInTZ.getMonth(), 1).toISOString();
  const { count } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('master_id', p.masterId)
    .gte('created_at', monthStart)
    .neq('status', 'cancelled');
  if ((count ?? 0) >= 40) {
    return {
      bookingId: null,
      error: 'Досягнуто ліміт 40 записів на місяць. Перейдіть на Pro.',
      upgradeRequired: true,
    };
  }
}
```

Також є в JSDoc рядок 83: `Booking-per-month limit (Starter: 40) is enforced server-side.`

### Що залишається (бізнес-рішення)
Ліміт уніфіковано до 40 записів/місяць.

**Дивись TECH_DEBT/booking-limit-not-enforced.md**
