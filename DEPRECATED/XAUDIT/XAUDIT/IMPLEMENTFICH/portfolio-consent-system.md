# [IMPLEMENTFICH] Portfolio Consent — Система дозволів на публікацію

## Статус
💎 **Повністю зроблено — НЕ виведено в маркетинг**

## Де реалізовано

### DB
```sql
portfolio_items.consent_status -- 'pending' | 'approved' | 'declined'
portfolio_items.tagged_client_id -- FK на profiles (клієнт)
```

### Notification Flow (notifications.ts)
```typescript
notifyClientPortfolioConsent({...})
// Cascade: In-app → Push (з deep link) → Telegram (з Inline кнопками approve/decline) → SMS
// Unікальна особливість: клієнт може підтвердити/відхилити прямо з Telegram!
```

### Client Area
```
/my/notifications — клієнт бачить pending consent запити
src/app/my/portfolio-consent/actions.ts:
  approvePortfolioConsent() — підтвердити участь у портфоліо
  declinePortfolioConsent() — відхилити
```

### Public Display
Кейси відображаються на публічній сторінці ТІЛЬКИ якщо `consent_status = 'approved'`.

## Де НЕ згадується
- ❌ Лендінг — жодного слова про consent механізм
- ❌ Pricing — не вказано як перевага
- ❌ OnBoarding — не пояснюється як це працює

## Маркетингова цінність
🚀 **GDPR-compliant та Professional** — Конкурентна перевага для майстрів у сфері б'юті: показувати клієнтів у портфоліо з їхнього явного дозволу. Це підвищує довіру та відповідає правилам публікацій в соцмережах.

## Рекомендація
1. Додати на лендінг: "Портфоліо з дозволу клієнтів — легальне та етичне"
2. Показати в OnBoarding на кроці Portfolio
3. Згадати в BOOKIT.md як competitive differentiator
