# AI_ONBOARDING — Вхідний Брифінг для AI-агентів

> Цей файл — перше, що ти маєш прочитати перед будь-якою дією в проекті BookIT.  
> Не починай писати код, не прочитавши хоча б розділи 1–3.

---

## 1. Документація проекту (читати в такому порядку)

| Файл | Зміст | Коли читати |
|---|---|---|
| [`BOOKIT.md`](./BOOKIT.md) | Бізнес-контекст: що будуємо, для кого, які фічі стабільні | Завжди першим |
| [`SYSTEM_MAP.md`](./SYSTEM_MAP.md) | Технічний індекс: всі роути, компоненти, хуки, таблиці DB | Перед будь-якою зміною коду |
| [`CLAUDE.md`](./CLAUDE.md) | Конституція розробки: tech stack, coding standards, database rules | Перед написанням першого рядка коду |

**Алгоритм старту:**
```
1. BOOKIT.md    → зрозумій "що" і "чому"
2. SYSTEM_MAP.md → знайди "де" (файл, таблиця, хук)
3. CLAUDE.md    → перевір "як" (стандарти, заборони, патерни)
4. Прочитай конкретні файли з кодової бази (не виводь код з голови)
5. Лише тоді — пропонуй рішення або пиши код
```

---

## 2. Загальні Директиви (Закон)

### 💎 ЗАЛІЗНЕ ПРАВИЛО: Глибокий Аналіз Логіки
**АНАЛІЗУЙ ПОВНУ ЛОГІКУ ФУНКЦІОНАЛУ**, дивись де, що і як має працювати в комплексі (від БД до UI). Не роби поверхневих фіксів. Якщо бракує розуміння або контексту — **ОБОВ'ЯЗКОВО ПИТАЙ УТОЧНЕННЯ** у користувача перед початком робіт.

### 🔴 QA-GATE: Обов'язкова сесія перед будь-якою зміною

**НІКОЛИ не починай реалізацію нового функціоналу або рефакторинг існуючого (включно з bugfix що торкається логіки) без QA-сесії з користувачем.**

QA-сесія з користувачем — це коротка відповідь на такі питання перед тим, як писати код, ти пропонуєш варіанти і узгоджуєш з користувачем:

```
1. ЩО саме змінюємо? (конкретний файл / таблиця / ендпоінт)
2. ЧОМУ? (root cause або нова бізнес-вимога)
3. ЯКЕ рішення пропонуємо? (не код — підхід, 2-4 речення)
4. ЩО може зламатись? (суміжні компоненти, RLS, типи)
5. ЯК перевіримо? (manual / SQL / e2e — дивись розділ 4)
6. 3-5 питань почергово, для уточнення ідеї функціоналу.
7. Якщо це повністю новий функціонула - спочатку поглиблена розробка концепції, ідеї та бізнес-логіки у форматі QA.
```
> **Виключення:** дозволено без QA — виправлення очевидної typo (один символ), додавання `console.log` для дебагу (з видаленням після), читання файлів та grep-пошук.

### Читай файли — не галюцинуй

- Перед написанням будь-якого компонента — **прочитай існуючий** схожий компонент.
- Перед Server Action — **прочитай `actions.ts`** тієї ж сторінки.
- Перед міграцією — **прочитай останні 3 міграції** щоб зрозуміти стиль.
- Якщо тип невідомий — читай `src/types/database.ts`, не вигадуй.

### DB-to-DOM Thinking

Проектуй фічі знизу вгору:  
**DB Schema → Server Action → Form Input → UI Component**  
Ніколи не починай з UI без розуміння як стан персистується.

### Data Pipeline перевірка

Перед рендером будь-яких даних у UI — перевір **всі три шари**:

| Шар | Перевірка |
|---|---|
| DB Layer | Чи є колонка/таблиця? (grep міграції) |
| Input Layer | Чи є форма для введення цього значення? |
| Mutation Layer | Чи є Server Action що зберігає це поле? |

Якщо хоча б один шар відсутній → **спочатку додай шар, потім UI**.

---

## 3. Що Заборонено Категорично

```
❌ any у TypeScript
❌ window.location.reload() — тільки TanStack Query invalidation
❌ getSession() в queryFn — deadlock
❌ Inline createClient(url, service_role_key) — тільки createAdminClient()
❌ Math.random() для кодів/токенів — тільки crypto.getRandomValues()
❌ invalidateQueries() без аргументів
❌ Хардкод масиви місяців/днів
❌ Ternary плюралізація (n === 1 ? 'запис' : 'записи') — тільки pluralUk()
❌ "use client" на layout файлах без initialUser prop
❌ Soft-mode для Monobank webhook (Ed25519 перевірка строга, без bypass)
❌ Cron routes без Authorization: Bearer CRON_SECRET
❌ console.log з OTP, user ID або токенами
```

---

## 4. Протокол Верифікації Змін

Після будь-якої реалізації — обов'язково провести верифікацію відповідно до типу змін.

---

### 4.1 Ручний Тест (для Власника Проекту — Вітоса)

Виконується в браузері. AI-агент зобов'язаний надати **покроковий чеклист** у такому форматі:

```markdown
## Ручний Тест: [Назва фічі/фікса]

**Передумови:**
- [ ] Увійти як майстер (login: ...)
- [ ] або: Відкрити публічну сторінку /[slug]

**Крок 1: [Дія]**
- Перейти до: [URL або елемент UI]
- Зробити: [кнопка / поле / дія]
- Очікуємо: [що має відбутись]
- [ ] Пройшло / Провалилось

**Крок 2: ...**

**Негативні кейси (перевір обов'язково):**
- [ ] [Що станеться якщо поле порожнє / дані некоректні]
- [ ] [Що станеться без авторизації]

**Мобільна перевірка:**
- [ ] Відкрити DevTools → мобільний вигляд (iPhone 375px)
- [ ] Перевірити bottom nav / BottomSheet поведінку
```

---

### 4.2 SQL Тест (для AI-агентів)

Виконується через Supabase SQL Editor або `supabase db reset` + seed.  
AI-агент зобов'язаний надати SQL-скрипти верифікації у такому форматі:

```sql
-- ==================================================
-- SQL Верифікація: [Назва фічі/міграції]
-- ==================================================

-- 1. Перевірка структури (після міграції)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'назва_таблиці'
ORDER BY ordinal_position;

-- 2. Перевірка RLS (обов'язково для нових таблиць)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'назва_таблиці';

-- 3. Перевірка policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'назва_таблиці';

-- 4. Перевірка тригерів (якщо є)
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'назва_таблиці';

-- 5. Smoke test (реальні дані)
-- Вставити тестовий рядок і перевірити результат:
INSERT INTO назва_таблиці (...) VALUES (...);
SELECT * FROM назва_таблиці WHERE ...;
-- Очікуємо: [що має бути в результаті]

-- 6. Cleanup (завжди після тесту)
DELETE FROM назва_таблиці WHERE id = '...';
```

**Обов'язкові SQL перевірки після кожної міграції:**
```sql
-- Перевірка індексів
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'назва_таблиці';

-- Перевірка foreign keys
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu USING (constraint_name)
JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'назва_таблиці';
```

---

### 4.3 E2E Тест (для AI-агентів, Playwright)

Проект використовує **Playwright** (`playwright.config.ts`), тести в `e2e/tests/`.

**Шаблон нового E2E тесту:**

```typescript
// e2e/tests/[номер]-[feature-name].spec.ts
import { test, expect } from '@playwright/test';

// Seed хелпер (дивись існуючі тести для патерну)
const MASTER_EMAIL = process.env.TEST_MASTER_EMAIL!;
const MASTER_PASS  = process.env.TEST_MASTER_PASS!;

test.describe('[Feature Name]', () => {
  // Авторизація перед тестами
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', MASTER_EMAIL);
    await page.fill('[data-testid="password"]', MASTER_PASS);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('/dashboard');
  });

  test('happy path — [опис]', async ({ page }) => {
    // ARRANGE
    await page.goto('/dashboard/[route]');
    
    // ACT
    await page.click('[data-testid="..."]');
    await page.fill('[data-testid="..."]', 'тестове значення');
    await page.click('[data-testid="save-button"]');
    
    // ASSERT
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="..."]')).toContainText('тестове значення');
  });

  test('негативний кейс — [опис]', async ({ page }) => {
    // ...
  });

  // Cleanup після кожного тесту
  test.afterEach(async ({ request }) => {
    // Видалити seed дані через API або SQL
  });
});
```

**Запуск тестів:**
```bash
# Один тест:
npx playwright test e2e/tests/[файл].spec.ts --headed

# З репортом:
npx playwright test e2e/tests/[файл].spec.ts --reporter=html

# Debug mode:
npx playwright test e2e/tests/[файл].spec.ts --debug
```

**Правила E2E тестів:**
- `data-testid` атрибути — єдиний спосіб звертатись до елементів (не CSS класи, не текст)
- Якщо `data-testid` відсутній в існуючому компоненті — додай його в рамках тієї ж задачі
- `test.afterEach` — обов'язковий cleanup seed даних (щоб тести не залежали від порядку)
- Ніколи не хардкод `page.waitForTimeout(3000)` — тільки `page.waitForSelector(...)` або `expect(...).toBeVisible()`


## 5. Контрольний Список Перед Відповіддю AI

Перш ніж надати код або рекомендацію, переконайся:

- [ ] Прочитав відповідні розділи SYSTEM_MAP.md / CLAUDE.md
- [ ] Прочитав конкретні файли (не вигадував структуру)
- [ ] QA-сесія проведена (для змін що торкаються логіки)
- [ ] TypeScript strict: нуль `any`, типи з `database.ts`
- [ ] Нові таблиці: RLS увімкнений + policies прописані
- [ ] Server Actions: `revalidatePath` або явне пояснення чому не потрібно
- [ ] Admin client: тільки через `createAdminClient()` з `@/lib/supabase/admin`
- [ ] Cron/webhook: авторизація на першому рядку
- [ ] Зміна в DB: надана SQL верифікація
- [ ] UI зміна: надано ручний тест-чеклист
- [ ] Telegram strings: `escHtml()` обгортка

---

## 6. Архітектурні Особливості Проекту (Знай Перед Стартом)

| Особливість | Деталь |
|---|---|
| Routing Guard | `src/proxy.ts` → `export function proxy` — НЕ `middleware.ts` (Next.js 16 deprecated) |
| PWA Deadlock | `getSession()` в `onAuthStateChange` callback = deadlock → завжди `setTimeout(0)` |
| Supabase Client | Singleton з `pwaDummyLock` + `autoRefreshToken:false` (дивись `client.ts`) |
| Wakeup Hooks | `useSessionWakeup` + `useDeepSleepWakeup` — обов'язкові для PWA (вже підключені в `QueryProvider`) |
| Admin Client | Єдина точка — `src/lib/supabase/admin.ts`. Нікуди не inline |
| Payments | Тільки **Monobank** (WayForPay видалений повністю) |
| Plural | Тільки `pluralUk()` з `src/lib/utils/pluralUk.ts` |
| Clock Override | `getNow()` з `src/lib/utils/now.ts` — підтримує debug cookie для E2E time-travel |
| Tailwind | v4 — `@import "tailwindcss"`, конфіг через `@theme {}` в CSS, нема `tailwind.config.ts` |
| Slot Engine | Fluid Anchor алгоритм у `smartSlots.ts` — snap при перервах, ніколи fixed-step |

---

*Цей файл є живим документом. При зміні архітектурних рішень — оновлюй `SYSTEM_MAP.md` + `CLAUDE.md` + цей файл одночасно.*
