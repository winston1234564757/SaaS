# [PLANFICH] Studio — Billing flow для тарифу 299₴/майстер

## Статус
🔴 **ОБІЦЯНО, але НЕ зроблено**

## Що обіцяно

`LandingPricing.tsx` (тариф Studio):
- Ціна: 299₴/майстер/місяць
- CTA: "Очікується" (кнопка `disabled: true`)

`BOOKIT.md` — Monetization Tiers:
> Studio | 299₴/майстер/місяць | All Pro + team management

## Що реально існує

### Billing (MonoProvider.ts)
Monobank checkout реалізований ТІЛЬКИ для Pro (700₴/місяць). 

```typescript
// src/lib/billing/pricing.ts
// calculateBillingPrice() — розраховує discount для Pro підписки
// Немає окремої логіки для Studio pricing (per-seat)
```

### Studio Dashboard
```tsx
// dashboard/studio/page.tsx — рядок 67:
cta: 'Очікується', // disabled: true
```

Billing flow для студії відсутній:
- Немає checkout для Studio тарифу
- Немає per-seat billing (299₴ × кількість майстрів)
- Немає dunning для Studio

## Рівень критичності
🔴 **Критичний** — Studio тариф не може генерувати дохід.

## Рекомендація
Або реалізувати per-seat billing, або не показувати Studio в Pricing взагалі.
