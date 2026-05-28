# [TECH_DEBT] Flash Deals Limit — Розсинхрон між лендінгом та кодом

## Статус
🟡 **Несуттєва невідповідність — Лендінг vs реальний ліміт**

## Симптом

| Джерело | Значення |
|---|---|
| `LandingPricing.tsx` (features для Starter) | **Не вказано** (загальна фраза "Базовий маркетинг") |
| `BOOKIT.md` | **5 flash-акцій/місяць** |
| `actions.ts` (реальний код) | `STARTER_LIMIT = 5` |
| Попередня версія BOOKIT.md | **2/місяць** (застарілий запис) |

## Чинний стан коду (підтверджено)
```typescript
// src/app/(master)/dashboard/flash/actions.ts — рядок 21:
const STARTER_LIMIT = 5; // ← ПРАВДА

if ((count ?? 0) >= STARTER_LIMIT) {
  return { error: `На Starter тарифі — ${STARTER_LIMIT} флеш-акцій на місяць` };
}
```

**Реальний ліміт = 5. Це відповідає BOOKIT.md.**

## Проблема
Лендінг не вказує точну цифру — лише "Базовий маркетинг (шаблон «Анонс»)". Клієнт не знає скільки саме.

## Рекомендація
У `LandingPricing.tsx` Starter features — додати явно:
`'До 5 Flash-акцій на місяць'`
