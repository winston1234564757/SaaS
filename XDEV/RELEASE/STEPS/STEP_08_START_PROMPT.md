# STEP 08 — Start Prompt (copy-paste у перше повідомлення нового чату)

> Вибери потрібний блок (08a / 08b / 08c) і встав у перше повідомлення.

---

## 08a — Revenue Hub

```
Ти Claude Code, продовжуєш роботу над BookIT (Ukrainian beauty booking SaaS).
CWD: C:\Users\Vitossik\SaaS\bookit

═══════════════════════════════════════════════════
STARTUP SEQUENCE (виконати ПЕРШИМ, до будь-чого):
═══════════════════════════════════════════════════
1. mcp__mempalace__mempalace_status
2. Read C:\Users\Vitossik\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset 495, limit 50)
3. Відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"

══════════════════════════════════════════════════
ЗАДАЧА: STEP 08a — Revenue Hub
══════════════════════════════════════════════════
Scope: /dashboard/revenue (Flash Deals + Dynamic Pricing)

Файли:
- src/app/(master)/dashboard/revenue/page.tsx
- src/components/master/revenue/RevenueHubClient.tsx
- src/app/(master)/dashboard/flash/page.tsx     (Redirect Gateway)
- src/app/(master)/dashboard/pricing/page.tsx   (Redirect Gateway)

ПЕРЕД КОДОМ — обов'язковий TASK GATE:
1. mempalace_search "revenue flash deals dynamic pricing"
2. mempalace_search "flash deal atomic race condition stacking"
3. Explore агент → scan src/components/master/revenue/ (medium breadth)
4. Задати 3-5 уточнюючих питань по scope
5. Оголосити SKILL + запустити через Skill tool
6. Отримати OK від користувача

══════════════════════════════════════════════════
КОНТЕКСТ (що вже зроблено)
══════════════════════════════════════════════════
STEP 07 ✅ COMPLETE — Services + Products correctness audit (2026-05-31)
  Drawer: drawer_bookit_audits_ea3affc66ed6c48195edda5e
STEP 06 ✅ CRM Clients (impeccable 15/20, TSC 0, build clean 51/51)
STEP 05 ✅ Bookings (impeccable 16/20, E2E 22/22)
Handoff: C:\Users\Vitossik\SaaS\XDEV\RELEASE\STEPS\STEP_08_HANDOFF.md

Carry-over (не блокують, але фіксуй якщо торкнешся цих файлів):
D-01: ClientsPage.tsx:631,806 — borderLeft 3px → full border+bg tint (P1)
C-01: BookingCard.tsx — borderLeft → full border+bg tint (P1)

══════════════════════════════════════════════════
ЗАЛІЗНІ ПРАВИЛА (не порушувати)
══════════════════════════════════════════════════
КОДУВАННЯ (RULE 0):
• Перед Edit/Write файлів з кирилицею — encoding check
• Ніколи не писати Cyrillic через text-mode Edit

UI ТЕКСТ (RULE 0.5):
• Весь новий UI-текст → /humanizer перед файлом
• Виняток: aria-label, data-testid, формати дат

QA-GATE (RULE 1):
• Нуль коду без: уточнень → плану → OK від користувача
• "Довіряю" ≠ "роби без плану"

SKILLS (RULE 2):
• "SKILL: name" у тексті → Skill tool у тій самій відповіді (нероздільно!)
• Ніяких "SKILL: x" без виклику інструменту

ACCESSIBILITY (ЗАЛІЗО):
• onClick на div/span/p — ЗАБОРОНЕНО → тільки <button type="button"> або <Link>
• type="button" — ЗАВЖДИ на <button> (без нього → submit у формах)
• aria-pressed={bool} — на всіх toggle/tab кнопках
• aria-label — на icon-only buttons (без видимого тексту)
• Touch targets ≥ 44px: size-11 або min-h-[44px]
• Chart/heatmap bars: aria-label={`${label}: ${value}`} + aria-pressed={isActive}

АНІМАЦІЇ (RULE 4 — Framer):
• SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const
• AnimatePresence: mode='popLayout' (завжди)
• layoutId для sliding tab indicators
• Spring transition: { type: 'spring' as const, ... } as const — inline теж as const
• y-axis для enter/exit (не x: ±10): initial={{ opacity: 0, y: 8 }}
• Без emoji в UI

ЗАБОРОНЕНІ ПАТТЕРНИ:
• borderLeft > 1px як кольоровий акцент → замінювати на full border + bg tint
• cursor-pointer на <div> → red flag, виправляти одразу
• Hardcoded #hex → тільки CSS tokens (var(--primary) або Tailwind класи)
• console.log у production code
• any-cast без коментаря чому

BULK EDIT (≥3 файлів):
• Write якщо ≥5 змін у файлі | Edit якщо ≤3 рядки
• Паралельно: усі Write/Edit в одному response-round
• Максимум 4 rounds: Read → Write → tsc+build → drawer

POST-CHANGE PROTOCOL (RULE 3):
• npx tsc --noEmit (у bookit/) → 0 errors
• npm run build → clean
• mempalace_add_drawer → зберегти рішення
• SYSTEM_MAP.md → оновити якщо нові routes/components

СТЕК:
- Next.js 16, TypeScript strict, Tailwind v4
- Supabase, TanStack Query v5, vaul (BottomSheet)
- 3 теми: Blossom / Studio / Frost
- src/proxy.ts (НЕ middleware.ts — це Next.js 16!)
- @/lib/supabase/admin — ЄДИНЕ джерело admin client
- generateSecureToken() з src/lib/utils/token.ts
- pluralUk() з src/lib/utils/pluralUk.ts
- Lucide: ніякого style prop → <span style={{color}}>icon</span>
- Tailwind v4: @import "tailwindcss" у globals.css, НЕ tailwind.config.ts

МОДЕЛЬ: 🔴 Opus 4.7 max (обов'язково — atomic flash deals, stacking discounts)
```

---

## 08b — Growth Hub

```
Ти Claude Code, продовжуєш роботу над BookIT (Ukrainian beauty booking SaaS).
CWD: C:\Users\Vitossik\SaaS\bookit

═══════════════════════════════════════════════════
STARTUP SEQUENCE (виконати ПЕРШИМ, до будь-чого):
═══════════════════════════════════════════════════
1. mcp__mempalace__mempalace_status
2. Read C:\Users\Vitossik\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset 495, limit 50)
3. Відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"

══════════════════════════════════════════════════
ЗАДАЧА: STEP 08b — Growth Hub
══════════════════════════════════════════════════
Scope: /dashboard/growth (Loyalty + Referral + Partners)

Файли:
- src/app/(master)/dashboard/growth/page.tsx
- src/components/master/growth/GrowthHubClient.tsx
- src/app/(master)/dashboard/loyalty/page.tsx   (Redirect Gateway)
- src/app/(master)/dashboard/referral/page.tsx  (Redirect Gateway)
- src/app/(master)/dashboard/partners/page.tsx  (Redirect Gateway)

RPC що стосуються:
- increment_referral_bounty    — atomic bounty increment
- get_master_referral_history  — міграція 20260524124500
- get_retention_status         — міграція 076

ПЕРЕД КОДОМ — обов'язковий TASK GATE:
1. mempalace_search "loyalty referral growth hub bonus"
2. mempalace_search "referral bounty FK 23503 C2B fix"
3. Explore агент → scan src/components/master/growth/ (medium breadth)
4. Задати 3-5 уточнюючих питань по scope
5. Оголосити SKILL + запустити через Skill tool
6. Отримати OK від користувача

══════════════════════════════════════════════════
КОНТЕКСТ (що вже зроблено)
══════════════════════════════════════════════════
STEP 07 ✅ COMPLETE — Services + Products correctness audit (2026-05-31)
  Drawer: drawer_bookit_audits_ea3affc66ed6c48195edda5e
STEP 06 ✅ CRM Clients | STEP 05 ✅ Bookings
Handoff: C:\Users\Vitossik\SaaS\XDEV\RELEASE\STEPS\STEP_08_HANDOFF.md

КРИТИЧНИЙ БАГ (зафіксовано у MemPalace):
- Referral FK 23503: Primary TX before Secondary TX у register/actions.ts (вже виправлено)
- При роботі з referral: завжди Primary INSERT перед Secondary INSERT

Carry-over:
D-01: ClientsPage.tsx:631,806 — borderLeft → full border+bg tint (P1)
C-01: BookingCard.tsx — borderLeft → full border+bg tint (P1)

══════════════════════════════════════════════════
ЗАЛІЗНІ ПРАВИЛА (не порушувати)
══════════════════════════════════════════════════
КОДУВАННЯ (RULE 0):
• Перед Edit/Write файлів з кирилицею — encoding check
• Ніколи не писати Cyrillic через text-mode Edit

UI ТЕКСТ (RULE 0.5):
• Весь новий UI-текст → /humanizer перед файлом
• Виняток: aria-label, data-testid, формати дат

QA-GATE (RULE 1):
• Нуль коду без: уточнень → плану → OK від користувача

SKILLS (RULE 2):
• "SKILL: name" у тексті → Skill tool у тій самій відповіді (нероздільно!)

ACCESSIBILITY (ЗАЛІЗО):
• onClick на div/span/p — ЗАБОРОНЕНО → тільки <button type="button"> або <Link>
• type="button" — ЗАВЖДИ на <button>
• aria-pressed={bool} — на всіх toggle/tab кнопках
• aria-label — на icon-only buttons
• Touch targets ≥ 44px

АНІМАЦІЇ (RULE 4):
• SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const
• AnimatePresence: mode='popLayout'
• layoutId для sliding tabs
• y-axis enter/exit (не x)

ЗАБОРОНЕНІ ПАТТЕРНИ:
• borderLeft > 1px як акцент → full border + bg tint
• cursor-pointer на div
• Hardcoded #hex → CSS tokens

BULK EDIT: Write ≥5 змін | Edit ≤3 | паралельно | max 4 rounds

POST-CHANGE: tsc --noEmit → build → mempalace_add_drawer → SYSTEM_MAP

СТЕК: Next.js 16 · TS strict · Tailwind v4 · Supabase · TanStack Query v5
src/proxy.ts (не middleware!) · @/lib/supabase/admin · vaul BottomSheet

МОДЕЛЬ: 🔴 Opus 4.7 max (referral cascade, atomic bounty RPC)
```

---

## 08c — Marketing + Billing + Settings + Studio

```
Ти Claude Code, продовжуєш роботу над BookIT (Ukrainian beauty booking SaaS).
CWD: C:\Users\Vitossik\SaaS\bookit

═══════════════════════════════════════════════════
STARTUP SEQUENCE (виконати ПЕРШИМ, до будь-чого):
═══════════════════════════════════════════════════
1. mcp__mempalace__mempalace_status
2. Read C:\Users\Vitossik\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset 495, limit 50)
3. Відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"

══════════════════════════════════════════════════
ЗАДАЧА: STEP 08c — Marketing + Billing + Settings + Studio
══════════════════════════════════════════════════
Scope: 4 сторінки в одному чаті

Файли Marketing:
- src/app/(master)/dashboard/marketing/page.tsx
- src/app/(master)/dashboard/marketing/new/page.tsx
- src/app/(master)/dashboard/marketing/[id]/page.tsx
- src/app/(master)/dashboard/marketing/actions.ts
- src/components/master/marketing/StoryGenerator.tsx
- src/components/master/marketing/BroadcastEditor.tsx
- src/components/master/marketing/BroadcastEditorPage.tsx
- src/components/master/marketing/BroadcastHistory.tsx
- src/components/master/marketing/BroadcastDetailPage.tsx

Файли Billing:
- src/app/(master)/dashboard/billing/page.tsx
- src/app/(master)/dashboard/billing/actions.ts
- src/components/master/billing/BillingPage.tsx

Файли Settings:
- src/app/(master)/dashboard/settings/page.tsx
- src/app/(master)/dashboard/settings/actions.ts
- src/components/master/settings/SettingsPage.tsx
- src/components/master/settings/VacationManager.tsx
- src/components/master/settings/LocationPicker.tsx

Файли Studio:
- src/app/(master)/dashboard/studio/page.tsx
- src/app/(master)/dashboard/studio/actions.ts
- src/components/master/studio/StudioPage.tsx

ПЕРЕД КОДОМ — обов'язковий TASK GATE:
1. mempalace_search "marketing broadcast billing monobank settings"
2. mempalace_search "notification orchestrator telegram push sms"
3. Explore агент → scan усі 4 директорії (medium breadth)
4. Задати 3-5 уточнюючих питань по scope
5. Оголосити SKILL + запустити через Skill tool
6. Отримати OK від користувача

══════════════════════════════════════════════════
КОНТЕКСТ (що вже зроблено)
══════════════════════════════════════════════════
STEP 07 ✅ COMPLETE — Services + Products (2026-05-31)
  Drawer: drawer_bookit_audits_ea3affc66ed6c48195edda5e
STEP 06 ✅ CRM Clients | STEP 05 ✅ Bookings
Handoff: C:\Users\Vitossik\SaaS\XDEV\RELEASE\STEPS\STEP_08_HANDOFF.md

NOTIFICATION SYSTEM (зафіксовано у MemPalace):
- NotificationOrchestrator + notifMap + cascade: TG→Push→SMS (critical-only)
- Cron refactor — drawer: project_notification_orchestrator

BILLING (критично):
- Monobank Ed25519 webhook
- Тарифи: Starter (0₴) | Pro (700₴/mo) | Studio (299₴/master/mo)
- get_pending_subscriptions_for_billing RPC — FOR UPDATE SKIP LOCKED

Carry-over:
D-01: ClientsPage.tsx:631,806 — borderLeft → full border+bg tint (P1)
C-01: BookingCard.tsx — borderLeft → full border+bg tint (P1)

══════════════════════════════════════════════════
ЗАЛІЗНІ ПРАВИЛА (не порушувати)
══════════════════════════════════════════════════
КОДУВАННЯ (RULE 0):
• Перед Edit/Write файлів з кирилицею — encoding check
• Ніколи не писати Cyrillic через text-mode Edit

UI ТЕКСТ (RULE 0.5):
• Весь новий UI-текст → /humanizer перед файлом
• Виняток: aria-label, data-testid, формати дат

QA-GATE (RULE 1):
• Нуль коду без: уточнень → плану → OK від користувача
• "Довіряю" ≠ "роби без плану"

SKILLS (RULE 2):
• "SKILL: name" у тексті → Skill tool у тій самій відповіді (нероздільно!)
• Ніяких "SKILL: x" без виклику Skill tool

ACCESSIBILITY (ЗАЛІЗО):
• onClick на div/span/p — ЗАБОРОНЕНО → тільки <button type="button"> або <Link>
• type="button" — ЗАВЖДИ на <button>
• aria-pressed={bool} — на toggle/tab кнопках
• aria-label — на icon-only buttons
• Touch targets ≥ 44px: size-11 або min-h-[44px]
• Chart bars: aria-label={`${label}: ${value}`} + aria-pressed={isActive}

АНІМАЦІЇ (RULE 4 — Framer):
• SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const
• AnimatePresence: mode='popLayout' (завжди!)
• layoutId для sliding tab indicators
• Spring transition: { type: 'spring' as const, ... } as const — inline теж
• y-axis enter/exit: initial={{ opacity: 0, y: 8 }}
• Без emoji в UI (ЗАЛІЗО)

ЗАБОРОНЕНІ ПАТТЕРНИ:
• borderLeft > 1px як кольоровий акцент → full border + bg tint
• cursor-pointer на <div> → red flag
• Hardcoded #hex → CSS tokens (var(--primary) або Tailwind)
• console.log у production code
• Nested <button> всередині <button>
• onClick на motion.div (motion.div не є button)

BULK EDIT PROTOCOL (3+ файлів):
• Write якщо ≥5 змін у файлі; Edit якщо ≤3 верифікованих рядки
• Усі Write/Edit в одному response-round (паралельно)
• Читай тільки те що змінюєш: files_changed = files_read
• Максимум 4 rounds: Read → Write → tsc+build → drawer

POST-CHANGE PROTOCOL (RULE 3 — обов'язково):
1. npx tsc --noEmit (у bookit/) → 0 errors
2. npm run build → clean
3. mempalace_add_drawer → зберегти ключові рішення
4. XDEV/MAPS/SYSTEM_MAP.md → оновити якщо нові routes/components

СТЕК (locked):
- Next.js 16, TypeScript strict, Tailwind v4
- Supabase (server+client), TanStack Query v5, vaul (BottomSheet)
- 3 теми: Blossom / Studio / Frost (CSS tokens)
- src/proxy.ts — routing guard (НЕ middleware.ts!)
- @/lib/supabase/admin — ЄДИНЕ джерело admin client, ніколи не inline
- generateSecureToken() → src/lib/utils/token.ts
- pluralUk() → src/lib/utils/pluralUk.ts (ЗАВЖДИ для Ukrainian plurals)
- Lucide: ніякого style prop → <span style={{color: 'var(--primary)'}}>icon</span>
- Tailwind v4: @import "tailwindcss" у globals.css, НЕ tailwind.config.ts
- Drawers: vaul BottomSheet ТІЛЬКИ — не bare framer-motion drawer

XDEV ДОКУМЕНТИ (читати перед кодом):
- C:\Users\Vitossik\SaaS\XDEV\AI_DEVELOPER.md — stack, RLS, anti-patterns
- C:\Users\Vitossik\SaaS\XDEV\UX_STANDARDS.md — No-Emoji, Vaul, animation
- C:\Users\Vitossik\SaaS\XDEV\MAPS\SYSTEM_MAP.md — routes, tables, RPCs

МОДЕЛЬ: 🔴 Opus 4.7 max (Billing: Monobank webhook + RLS bypass patterns)
```
