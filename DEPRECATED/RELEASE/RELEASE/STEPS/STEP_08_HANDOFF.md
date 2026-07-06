# STEP 08 — Other Dashboard Hubs: Handoff Note

> **Від:** STEP 07 (Services + Products) ✅ Complete — 2026-05-31
> **До:** STEP 08 — Revenue · Growth · Marketing · Billing · Settings · Studio
> **Модель:** 🔴 Opus 4.7 max
> **Структура:** Розбити на **3 окремі чати** (08a / 08b / 08c)

---

## 🎯 Контекст передачі

STEP 07 завершено correctness-only аудитом. Усі iron-rule violations виправлено у Services + Products. Проект зараз на **6/13 кроків** (~46%).

STEP 08 — найбільший блок: 6 різних сторінок з різною складністю. Opus 4.7 max обов'язковий через:
- Monobank Ed25519 webhook у Billing
- Atomic flash-deal race conditions у Revenue
- Cascade сповіщень у Marketing (TG → Push → SMS)
- Stacking discounts + referral bounty у Growth

---

## 📦 Розбивка на 3 чати

### Чат 08a — Revenue Hub
**Scope:** `/dashboard/revenue` (вкладки Flash Deals + Dynamic Pricing)
**Моделеь:** 🔴 Opus 4.7 max
**Ключові компоненти:**
- `src/components/master/revenue/RevenueHubClient.tsx`
- Flash deals: атомарне увімкнення/вимкнення знижки, race condition guard
- Dynamic pricing: Fluid Anchor algorithm, stacking rules

### Чат 08b — Growth Hub
**Scope:** `/dashboard/growth` (вкладки Loyalty + Referral + Partners)
**Модель:** 🔴 Opus 4.7 max
**Ключові компоненти:**
- `src/components/master/growth/GrowthHubClient.tsx`
- Loyalty: бонусна система, `increment_referral_bounty` RPC
- Referral: `get_master_referral_history` RPC (міграція 20260524124500)
- Partners: B2B partnerships

### Чат 08c — Marketing + Billing + Settings + Studio
**Scope:** 4 сторінки в одному чаті (менші/простіші)
**Модель:** 🔴 Opus 4.7 max (Billing) / 🟢 Sonnet 4.6 (Settings/Studio/Marketing UI)
**Ключові компоненти:**
- `src/components/master/marketing/` — Story Generator, Broadcast Editor, History
- `src/components/master/billing/BillingPage.tsx` — Monobank webhook, тарифи, checkout
- `src/components/master/settings/SettingsPage.tsx` — розклад, відпустки, Telegram, тема
- `src/components/master/studio/StudioPage.tsx` — Studio-режим майстри

---

## 🗺️ Файлова мапа STEP 08

### Revenue Hub (`/dashboard/revenue`)
```
src/app/(master)/dashboard/revenue/page.tsx
src/components/master/revenue/RevenueHubClient.tsx
src/app/(master)/dashboard/flash/page.tsx     ← Redirect Gateway
src/app/(master)/dashboard/pricing/page.tsx   ← Redirect Gateway
```

### Growth Hub (`/dashboard/growth`)
```
src/app/(master)/dashboard/growth/page.tsx
src/components/master/growth/GrowthHubClient.tsx
src/app/(master)/dashboard/loyalty/page.tsx   ← Redirect Gateway
src/app/(master)/dashboard/referral/page.tsx  ← Redirect Gateway
src/app/(master)/dashboard/partners/page.tsx  ← Redirect Gateway
```

### Marketing (`/dashboard/marketing`)
```
src/app/(master)/dashboard/marketing/page.tsx
src/app/(master)/dashboard/marketing/new/page.tsx
src/app/(master)/dashboard/marketing/[id]/page.tsx
src/app/(master)/dashboard/marketing/actions.ts
src/components/master/marketing/StoryGenerator.tsx
src/components/master/marketing/BroadcastEditor.tsx
src/components/master/marketing/BroadcastEditorPage.tsx
src/components/master/marketing/BroadcastHistory.tsx
src/components/master/marketing/BroadcastDetailPage.tsx
```

### Billing (`/dashboard/billing`)
```
src/app/(master)/dashboard/billing/page.tsx
src/app/(master)/dashboard/billing/actions.ts
src/components/master/billing/BillingPage.tsx
```

### Settings (`/dashboard/settings`)
```
src/app/(master)/dashboard/settings/page.tsx
src/app/(master)/dashboard/settings/actions.ts
src/components/master/settings/SettingsPage.tsx
src/components/master/settings/VacationManager.tsx
src/components/master/settings/LocationPicker.tsx
```

### Studio (`/dashboard/studio`)
```
src/app/(master)/dashboard/studio/page.tsx
src/app/(master)/dashboard/studio/actions.ts
src/components/master/studio/StudioPage.tsx
```

---

## 📋 Carry-over з попередніх кроків (не блокують STEP 08)

| ID | Issue | Пріоритет | Файл |
|---|---|---|---|
| D-01 | ClientsPage cards: borderLeft 3px → full border + bg tint | 🟠 P1 | `ClientsPage.tsx:631,806` |
| D-02 | ClientWidgets: useMemo 6 body computations | 🟡 P2 | `ClientWidgets.tsx:47-66` |
| D-03 | Grid action buttons size-10 → size-11 | 🟡 P2 | `ClientsPage.tsx:750-777` |
| D-04 | Sort button: aria-expanded + aria-haspopup | 🟡 P2 | `ClientsPage.tsx:478` |
| C-01 | BookingCard: borderLeft 4px → full border + bg tint | 🟠 P1 | `BookingCard.tsx` |
| B-01 | Dashboard Home: /impeccable audit (22/40 → 34+) | 🔴 Critical | Dashboard widgets |
| B-02 | Vercel QA: onboarding `967bf06` manual check | 🔴 Critical | — |
| B-03..B-05 | Dashboard chart/widget polish | 🟡 High | Dashboard widgets |

---

## ⚡ QA-GATE питання для STEP 08 (для AskUserQuestion)

**Використати при старті будь-якого з 3 чатів:**

1. **Глибина аудиту:** Full impeccable (visual + UX + a11y + correctness) чи correctness-only (як STEP 07)?
2. **Пріоритет чатів:** Починати з 08a (Revenue), 08b (Growth), чи 08c (Marketing+Billing+Settings+Studio)?
3. **Billing scope:** Monobank integration активний у production? Тестувати webhook або тільки UI?
4. **Marketing:** Story Generator в роботі (AI-based)? Тестувати broadcast відправку чи тільки UI?
5. **Settings:** Telegram bot налаштований? VacationManager — перевіряти DB-запис чи тільки UI?

---

## 🧠 MemPalace контекст для пошуку

При старті чату 08a запустити:
```
mempalace_search "revenue flash deals dynamic pricing"
mempalace_search "flash deal atomic race condition"
```

При старті чату 08b:
```
mempalace_search "loyalty referral growth hub"
mempalace_search "referral bounty increment RPC"
```

При старті чату 08c:
```
mempalace_search "marketing broadcast billing monobank"
mempalace_search "settings telegram vacation schedule"
```

---

## 🏁 Стан на момент передачі (2026-05-31)

| Параметр | Значення |
|---|---|
| Остання міграція | `20260524124500_get_master_referral_history.sql` |
| TSC | 0 помилок |
| Build | clean (51+ pages) |
| E2E остання | Test 34 ✅ (clients search) |
| MemPalace | 21,046 drawers |
| Активна гілка | `main` |
| Остання зміна | STEP 07 correctness audit (`ServiceCard`, `ProductEditor`, etc.) |

---

## 📋 Промт для нового чату (copy-paste)

```
Ти Claude Code, продовжуєш роботу над BookIT (Ukrainian beauty booking SaaS).
CWD: C:\Users\Vitos\SaaS\bookit

STARTUP SEQUENCE (виконати ПЕРШИМ):
1. mcp__mempalace__mempalace_status
2. Read C:\Users\Vitos\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset 495, limit 50)
3. Відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"

ЗАДАЧА: STEP 08[a/b/c] — [Revenue Hub / Growth Hub / Marketing+Billing+Settings+Studio]
Scope: /dashboard/[revenue / growth / marketing+billing+settings+studio]

ПЕРЕД КОДОМ — обов'язковий TASK GATE:
1. mempalace_search "[revenue flash / loyalty referral / billing marketing]"
2. Explore агент → scan відповідні компоненти (medium breadth)
3. Задати 3-5 уточнюючих питань по scope
4. Оголосити SKILL + запустити через Skill tool
5. Отримати OK від користувача

КОНТЕКСТ:
STEP 07 ✅ COMPLETE — Services + Products correctness audit (2026-05-31)
STEP 06 ✅ COMPLETE — CRM Clients (impeccable 15/20)
STEP 05 ✅ COMPLETE — Bookings (impeccable 16/20, E2E 22/22)
Drawer STEP 07: drawer_bookit_audits_ea3affc66ed6c48195edda5e

Handoff: C:\Users\Vitos\SaaS\XDEV\RELEASE\STEPS\STEP_08_HANDOFF.md

ЗАЛІЗНІ ПРАВИЛА:
• SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const
• ніколи onClick на div/span → тільки <button type="button"> або <Link>
• aria-pressed на toggle/selector buttons
• touch targets ≥ 44px
• borderLeft > 1px як акцент — ЗАБОРОНЕНО
• весь новий UI-текст → /humanizer
• Post-change: npx tsc --noEmit → npm run build → mempalace_add_drawer

МОДЕЛЬ: 🔴 Opus 4.7 max (обов'язково для Billing + Revenue atomic logic)
```

---

*Handoff створено: 2026-05-31 · Автор: Claude Sonnet 4.6 (STEP 07 session)*
