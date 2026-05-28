# 🎯 BookIT Release Command Center

> **Глобальна задача:** послідовний реліз 13 сторінок BookIT через 7 Quality Gate dimensions.
> **Залізне правило:** Один чат = один крок. Перехід до наступної сторінки — тільки після затвердження поточної.
> **Версія:** v1.0 · **Створено:** 2026-05-27

---

## 📚 Файли цієї задачі (operational hub)

| Файл | Призначення | Коли читати |
|---|---|---|
| [README.md](./README.md) | Правила, моделі, посилання — ти тут | На старті кожного чату |
| [START_PROMPT.md](./START_PROMPT.md) | Універсальний copy-paste промт для нового чату | Перед стартом нового чату |
| [PROTOCOL.md](./PROTOCOL.md) | Workflow одного чату (startup → close-out) | На старті + при сумнівах |
| [STATUS.md](./STATUS.md) | Live tracker 13 кроків (статуси, моделі, drawers, commits) | На старті + після кожної зміни |
| [CHANGELOG.md](./CHANGELOG.md) | Журнал завершених кроків (детальні entries) | Після close-out кроку |
| [STEPS/TEMPLATE.md](./STEPS/TEMPLATE.md) | Шаблон playbook для будь-якого кроку | При створенні нового playbook |
| [STEPS/STEP_NN_xxx.md](./STEPS/) | Детальний playbook активного кроку | На старті чату активного кроку |

---

## 🔗 Зовнішні джерела правди (не дублюються тут)

| Документ | Зміст |
|---|---|
| [../IRON_RULES.md](../IRON_RULES.md) | 5 абсолютних правил сесії (encoding, humanizer, QA-GATE, skills, post-change, framer) |
| [../AI_DEVELOPER.md](../AI_DEVELOPER.md) | Конституція розробника: stack, RLS, anti-patterns, 3 теми |
| [../SKILL_PROTOCOL.md](../SKILL_PROTOCOL.md) | Decision Tree вибору скіла перед кожною ітерацією |
| [../UX_STANDARDS.md](../UX_STANDARDS.md) | No-Emoji, Vaul, animation rules, color tokens |
| [../BOOKIT.md](../BOOKIT.md) | Бізнес-логіка, тарифи, ключові модулі |
| [../AI_ONBOARDING.md](../AI_ONBOARDING.md) | DB-to-DOM thinking, протоколи верифікації |
| [../MAPS/PAGE_RELEASE_ROADMAP.md](../MAPS/PAGE_RELEASE_ROADMAP.md) | Детальні чек-листи всіх 13 сторінок (джерело правди для scope) |
| [../MAPS/SYSTEM_MAP.md](../MAPS/SYSTEM_MAP.md) | Архітектурна мапа: routes, components, hooks, DB, API |
| [../../bookit/.claude/CLARIFICATION_FRAMEWORK.md](../../bookit/.claude/CLARIFICATION_FRAMEWORK.md) | 3-5 питань перед кожним скілом |

---

## 🚦 7 Quality Gate Dimensions (єдиний критерій ready)

Кожна сторінка перед статусом ✅ Complete мусить пройти всі 7 вимірів:

| # | Вимір | Перевірка |
|---|---|---|
| 1 | **Aesthetics & Themes** | Сітка, mobile responsive, бездоганний вигляд у 3 темах (Blossom/Studio/Frost), grain + vignette + ambient blobs присутні |
| 2 | **No-Emoji Policy** | Жодних емодзі у кнопках, заголовках, фільтрах, селекторах → тільки Lucide React іконки |
| 3 | **Motion & Transitions** | Spring `bounce: 0-0.12`, `mode="popLayout"`, sliding tabs з `layoutId`, `as const` |
| 4 | **Errors & Validation** | Zod schemas, `parseError(err)` для toast, автозбереження з індикатором |
| 5 | **A11y & Performance** | Semantic HTML5, WCAG AA contrast, `aria-invalid`, `aria-describedby`, нуль CLS |
| 6 | **Core Features** | Повна бізнес-логіка працює (калькулятори, transactions, бонуси, OTP) |
| 7 | **Tests Verification** | Vitest unit + Playwright E2E зелені |

---

## 🧠 Model Assignment (per step)

Розподіл моделей зафіксовано після аналізу складності. Допустимо підняти модель (Sonnet → Opus), не допустимо знизити без explicit OK користувача.

| # | Сторінка | Модель | Чому |
|---|---|---|---|
| 1 | `/` Landing | 🟢 **Sonnet 4.6 high** | Емодзі-заміна, animation polish, aria-label, простий калькулятор |
| 2 | Auth (`/login`, `/register`, `/callback`) | 🔴 **Opus 4.7 max** | Security-critical: SMS OTP + virtual email + rate-limit + Supabase auth |
| 3 | Onboarding (`/onboarding`) | 🔴 **Opus 4.7 max** | 9-step state machine + draft persistence + TMA link + profit calc |
| 4 | Dashboard Home (`/dashboard`) | 🔴 **Opus 4.7 max** | 10+ Bento віджетів × 3 теми + тур + миттєвий перерахунок |
| 5 | Bookings (`/dashboard/bookings`) | 🔴 **Opus 4.7 max** | Day/Week/Month + URL-state + reschedule/cancel cascade notifications |
| 6 | CRM Clients (`/dashboard/clients`) | 🟡 **Mixed** | UI поліш — Sonnet; сегментаційна логіка (RPC `get_master_clients`) — Opus |
| 7 | Services & Products | 🟢 **Sonnet 4.6 high** | Стандартний CRUD, ImageUploader, RestockDrawer; atomic RPC уже є |
| 8 | Other Hubs (Analytics/Marketing/Loyalty/Billing/Settings/Studio) | 🔴 **Opus 4.7 max** | **Розбити на 2-3 чати:** Referral hub, Marketing broadcasts, Monobank webhook |
| 9 | Explore (`/explore`) | 🟢 **Sonnet 4.6 high** | Стандартний search + city autocomplete + емодзі-replacement |
| 10 | Public Master Page (`/[slug]`) | 🔴 **Opus 4.7 max** | BookingWizard + Dynamic Pricing (Fluid Anchor) + PostBookingAuth OTP cascade |
| 11 | Shop + Portfolio (`/[slug]/shop`, `/[slug]/portfolio`) | 🔴 **Opus 4.7 max** | Race conditions `increment_stock_rpc` + Nova Poshta API + Consent Flow |
| 12 | Client Portal (`/my/*`) | 🟢 **Sonnet 4.6 high** | Скасування з time-limit + consent toggle + UI поліш |
| 13 | Legal/Offline/`/r/[code]` | 🟡 **Mixed** | Legal markdown + offline PWA — Sonnet; referral redirect + atomic counter — Opus |

### Логіка вибору моделі

**Opus 4.7 max потрібен коли:**
- Payments (Monobank Ed25519, recurrent, dunning)
- Security-critical (Auth, OTP, RLS bypass, virtual email)
- Багато-крокова state machine (Onboarding, BookingWizard, PostBookingAuth)
- Cascade сповіщень (Telegram → Push → SMS з SMS Guard)
- Race conditions (atomic stock, FOR UPDATE SKIP LOCKED)
- Архітектурні переосмислення (3 теми консистентність на 10+ віджетах)
- Бізнес-логіка з фінансовими наслідками (stacking discounts, dynamic pricing)

**Sonnet 4.6 high вистачить коли:**
- Заміна емодзі на Lucide іконки
- Pill-radius/border-radius перевірка
- `aria-label` додавання
- Tactile feedback (`active:scale-[0.97]`)
- Простий form CRUD з вже існуючим Server Action
- Тестове проходження (запуск Vitest/Playwright + фікси типових помилок)
- Заміна hardcoded `#hex` на CSS-токени теми

---

## ⚡ Iron Rules для цієї задачі

Повне формулювання — у [../IRON_RULES.md](../IRON_RULES.md). Тут — короткий нагадувач:

| # | Правило | Дія перед/після |
|---|---|---|
| **-1** | MemPalace mandatory | `mempalace_status` на старті + `mempalace_search` перед рішеннями + `mempalace_add_drawer` після фіксу |
| **0** | Encoding guard | `b'\xd0\xa0\xc2' in raw` check перед Edit/Write Cyrillic |
| **0.5** | Humanizer for UI text | Усі UI рядки через `/humanizer` перед записом у файл |
| **1** | QA-GATE | clarify → 3-5 питань → plan → user OK → код |
| **2** | Skills Decision Tree | Оголосити скіл та запустити (text + Skill tool в одній відповіді) |
| **3** | Post-Change Protocol | `tsc --noEmit` → `build` → `mempalace_add_drawer` → `SYSTEM_MAP.md` |
| **4** | Framer rules | `mode="popLayout"`, `as const` у variants, no emoji |

---

## 🎮 Налаштування цієї глобальної задачі

### Чат-дисципліна
- **Один чат = один крок.** Не починати наступний крок у тому ж чаті.
- **Перехід дозволений** тільки після `STEP NN COMPLETE` + оновленого STATUS.md.
- **Skip-крок ЗАБОРОНЕНО.** Якщо щось блокує — фіксуємо в STATUS.md як ⚠️ і обговорюємо.
- **Розбиття кроку** дозволено (Крок 8 → 3 чати). Заздалегідь оголосити структуру в STEP_08_*.md.

### Документація — обов'язкова синхронізація
Після кожного `STEP NN COMPLETE` мусить бути оновлено:
1. ✅ [STATUS.md](./STATUS.md) — статус, дата ready, hash коміту, drawer ID
2. ✅ [CHANGELOG.md](./CHANGELOG.md) — детальний entry
3. ✅ [../MAPS/SYSTEM_MAP.md](../MAPS/SYSTEM_MAP.md) — нові routes/components/RPCs
4. ✅ [../MAPS/PAGE_RELEASE_ROADMAP.md](../MAPS/PAGE_RELEASE_ROADMAP.md) — статус сторінки
5. ✅ `bookit/src/app/(master)/dashboard/changelog/page.tsx` — якщо B2B-видима зміна
6. ✅ MemPalace drawer з ключовими рішеннями

### Перевірочний pipeline (RULE 3, обов'язково)
```bash
cd bookit
npx tsc --noEmit                    # zero errors
npm run build                       # Next.js builds clean
npm test                            # Vitest green
npm run test:e2e -- --grep "<step>" # Playwright green for step
```

### Quality Gate Verdict
Тільки 4 можливі статуси:
- ✅ **APPROVED** — всі 7 вимірів пройдено, код у main, доку синхронізовано
- ⚠️ **NEEDS REVISION** — є виявлені issues, повертаємось до того ж кроку
- 🔒 **BLOCKED** — зовнішня залежність (e.g., env var, Vercel Pro)
- 🔄 **IN PROGRESS** — активна робота

---

## 🎯 Quick start для нового чату

**Найшвидший спосіб:** скопіюй промт з [START_PROMPT.md](./START_PROMPT.md) у перше повідомлення.

**Manual checklist (якщо без промта):**
```
1. Read XDEV/RELEASE/README.md (цей файл) — правила та моделі
2. Read XDEV/RELEASE/STATUS.md — який крок активний
3. Read XDEV/RELEASE/PROTOCOL.md — workflow одного чату
4. Read XDEV/RELEASE/STEPS/STEP_NN_*.md — playbook активного кроку
5. Виконати SESSION_START protocol (RULE -1)
6. Виконати TASK GATE (RULE 1, 2, 0.5)
7. Code → tsc → build → test → docs sync → mempalace_add_drawer
8. Close-out: STEP NN COMPLETE + handoff note
```

---

## 📞 Контекстна навігація

- **Перед скілом:** [../SKILL_PROTOCOL.md](../SKILL_PROTOCOL.md) Decision Tree
- **Перед UI текстом:** `/humanizer` skill
- **Перед DB зміною:** [../AI_DEVELOPER.md](../AI_DEVELOPER.md) RLS section
- **Перед animation:** [../UX_STANDARDS.md](../UX_STANDARDS.md) Motion Patterns
- **Перед releasem:** pre-deploy checklist у [../AI_DEVELOPER.md](../AI_DEVELOPER.md)

---

*Версія: 1.0 · Створено: 2026-05-27 · Власник процесу: Вітос*
