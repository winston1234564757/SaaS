# [IMPLEMENTFICH] PWA — Offline Mode + Service Worker

## Статус
💎 **Повністю зроблено — Недостатньо представлено в маркетинг**

## Де реалізовано

### Service Worker
```
Cache-First для статики
Network-Only для API (без кешування чутливих даних)
Bypass для навігації
```

### Offline Experience
```
/offline — повноцінна fallback сторінка
```

### PWA Manifest
```json
// shortcuts:
[
  { "name": "Мої записи", "url": "/my/bookings" },
  { "name": "Дашборд", "url": "/dashboard" }
]
```

### Web Push в PWA
Web Push підтримується в PWA контексті — нагадування і flash deals приходять навіть коли сайт не відкритий.

### Session Hooks
```typescript
useSessionWakeup.ts  // Відновлення після переключення вкладок
useDeepSleepWakeup.ts // Відновлення після JS freeze (deep sleep)
```

## Де згадується (частково)
- ✅ `BOOKIT.md`: `'PWA — додаток без App Store'` — є в Pricing/Pro features
- ✅ `LandingPricing.tsx`: `'PWA — додаток без App Store'` — є в Pro features list

## Де НЕ розкрито повністю
- ❌ Лендінг не пояснює що "додаток" = можна встановити на екран телефону
- ❌ OnBoarding не пропонує встановити PWA
- ❌ Немає banner "Додати на головний екран"

## Маркетингова цінність
🚀 **"Додаток без App Store"** — Ключова перевага перед конкурентами. Клієнти встановлюють BookIT на екран телефону без App Store. 

## Рекомендація
1. На лендінгу показати GIF/анімацію встановлення PWA
2. В OnBoarding після реєстрації: "Встановіть додаток — один натиск"
3. У PublicMasterPage: пропонувати встановити PWA після першого запису
