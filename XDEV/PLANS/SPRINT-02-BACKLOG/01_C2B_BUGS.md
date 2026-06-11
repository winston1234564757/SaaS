# B-01 + B-02 — C2B/C2C Реферали

> Трекер: [00_TRACKER.md](./00_TRACKER.md)

---

## B-01 — C2B: знижка не нарахувалась + лічільник не оновився
**Пріоритет:** P1 Bug  
**Скіл:** `senior-backend`  
**Статус:** TODO

### Проблема
При реєстрації через C2B реферальне посилання:
1. Майстру Pro активується коректно
2. Але клієнту знижка **не нараховується**
3. І лічільник `referred_count` / `invited_count` **не оновлюється**

### Файли для перевірки
- `bookit/src/app/(auth)/register/actions.ts` — основна логіка реєстрації (шукати "secondary TX")
- `bookit/src/lib/referral/` — якщо є папка з реферальною логікою
- DB таблиці: `c2b_referrals`, `referral_codes`, `master_profiles.referred_count`

### Архітектурний контекст
З MEMORY.md: "Primary TX before Secondary TX in register/actions.ts" — була подібна проблема з FK 23503 C2B fix (2026-04-13). Перевірити чи C2B discount TX виконується після Pro-активації.

### Кроки виконання
1. `Grep "c2b_discount"` у всьому проекті — знайти де має встановлюватись знижка
2. `Grep "referred_count"` — знайти де має інкрементуватись лічільник
3. `Read register/actions.ts` — перевірити flow після активації Pro
4. Знайти де транзакція C2B discount відсутня або не викликається
5. Фікс: додати виклик discount у правильному місці транзакції
6. `mempalace_search "c2b discount referral"` перед кодуванням

### QA
```sql
-- Перевірити чи є записи після тест-реєстрації:
SELECT * FROM c2b_referrals ORDER BY created_at DESC LIMIT 5;
SELECT referred_count FROM master_profiles WHERE id = '<master_id>';
-- Перевірити знижку клієнта:
SELECT * FROM client_discounts WHERE client_id = '<client_id>';
```

---

## B-02 — C2B/C2C: розділити коди + унікальні landing сторінки
**Пріоритет:** P2 Feature  
**Скіл:** `design-taste-frontend` + `senior-frontend`  
**Статус:** TODO

### Проблема
Зараз один реферальний код використовується і для C2C (клієнт запрошує клієнта) і для C2B (майстер запрошує майстра через клієнтське посилання). Це призводить до:
- Майстру показується сторінка з клієнтськими перевагами
- Немає окремої преміум-сторінки для C2B реєстрації майстра

### Бажаний результат
**C2B Landing** (для майстрів):
- Заголовок: переваги реєстрації як майстра
- Хайлайти: Pro на 2 тижні, переваги CRM, SmartSlots, портфоліо
- Call-to-action: "Реєструйся як майстер"

**C2C Landing** (для клієнтів — поточна):
- Клієнтські переваги: знижки, бонуси
- Call-to-action: "Запишись і отримай знижку"

### Файли
- `bookit/src/app/join/[code]/page.tsx` — головна точка входу за посиланням
- `referral_codes` таблиця — перевірити чи є поле `type` (`c2c` / `c2b`)
- `bookit/src/app/(master)/dashboard/growth/actions.ts` — генерація посилань

### Кроки виконання
1. `Read join/[code]/page.tsx` — побачити поточну логіку
2. Перевірити DB: чи є `referral_codes.type` або потрібна міграція
3. Якщо немає `type` → написати міграцію `ALTER TABLE referral_codes ADD COLUMN type TEXT DEFAULT 'c2c'`
4. Оновити генерацію C2B коду щоб записував `type = 'c2b'`
5. У `join/[code]/page.tsx` — бранч: `code.type === 'c2b'` → `<C2BLanding />` else `<C2CLanding />`
6. Дизайн C2B Landing (Frost theme): `design-taste-frontend` skill
7. `humanizer` для всіх текстів landing

### QA
- Відкрити C2B посилання → бачу майстерську landing
- Відкрити C2C посилання → бачу клієнтську landing
- Реєстрація через кожен тип → перевірити коректний flow

### Відкриті питання
- Який точний текст/переваги показувати на C2B landing? (QA Gate з Вітосом перед кодуванням)
- Чи є зображення/ілюстрації для landing або тільки текст + іконки?
