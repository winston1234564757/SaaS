# STEP 12 — Client Portal: Handoff Note

> **Від:** STEP 11 (Shop + Portfolio `/[slug]/shop`, `/[slug]/portfolio`) ✅ Complete — 2026-05-31
> **До:** STEP 12 — Client Portal (`/my/*`)
> **Модель:** 🟢 Sonnet 4.6 high
> **Структура:** 1 чат (всі /my/* разом)

---

## 🎯 Контекст передачі

STEP 11 завершено — Shop + Portfolio correctness + a11y audit. Проект на **10/13 кроків (~77%)**.

STEP 12 — клієнтський портал: особистий кабінет авторизованого клієнта (не майстра).
Всього ~2,114 рядків у компонентах + 8 SSR page-файлів.

---

## 📦 Scope: Files to Audit

```
src/app/my/layout.tsx                     ← B2C layout з bottom nav
src/app/my/bookings/page.tsx              ← SSR: my bookings
src/app/my/loyalty/page.tsx               ← SSR: loyalty points
src/app/my/masters/page.tsx               ← SSR: saved masters
src/app/my/notifications/page.tsx         ← SSR: notifications
src/app/my/profile/page.tsx               ← SSR: profile edit
src/app/my/setup/phone/page.tsx           ← SSR: phone setup
src/app/my/support/chat/page.tsx          ← SSR: support chat

src/components/client/
├── MyBookingsPage.tsx        (399 рядків) ← booking history + cancel/rebook
├── MyLoyaltyPage.tsx         (413 рядків) ← points, tiers, redeem flow
├── MyMastersPage.tsx         (143 рядків) ← saved masters list
├── MyProfilePage.tsx         (422 рядків) ← profile form + avatar upload
├── ClientNotificationsPage.tsx (209 рядків) ← notification list + mark read
├── MyBottomNav.tsx           (142 рядків) ← bottom nav (touch targets critical!)
└── B2CRouteGuard.tsx          (36 рядків) ← auth guard

src/components/shared/support/
└── SupportChatPage.tsx       (350 рядків) ← real-time chat (security check!)
```

---

## 🔍 Pre-scan — очікувані проблеми

### MyBottomNav.tsx (P1 CRITICAL)
- Nav items — перевірити touch targets ≥ 44px (py-2 minimum)
- Active indicator — `aria-current="page"` або `aria-pressed`
- Icon-only nav items — `aria-label` обов'язковий

### MyProfilePage.tsx (422 рядків)
- Avatar upload button — `type="button"` + `aria-label`
- Save/Edit кнопки — `type="button"`
- Form inputs — `<label>` прив'язані через `htmlFor`
- Avatar: next/image чи raw `<img>`?

### MyBookingsPage.tsx (399 рядків)
- Фільтр кнопки (all/upcoming/past) — `aria-pressed` + `type="button"`
- Cancel/Rebook кнопки — `type="button"`
- Skeleton/loading стани — чи є?
- spring transitions — `as const`?

### MyLoyaltyPage.tsx (413 рядків)
- Tier selector/tabs — `aria-pressed` або `role="tab"`
- Redeem button — `type="button"`
- Points chart/progress bar — aria?
- Animated progress: spring `as const`?

### SupportChatPage.tsx (350 рядків) — SECURITY CHECK
- Send message action — auth перед try{}?
- File/image upload — розмір валідація?
- Message input — `type="text"` vs `type="submit"` на кнопці
- XSS: чи рендерить raw HTML?

### ClientNotificationsPage.tsx (209 рядків)
- Mark-as-read кнопка — `type="button"`
- "Позначити всі" — `type="button"`
- Empty state — чи є?

---

## 🔒 Security — обов'язково перевірити

- `SupportChatPage.tsx` — server action для send message: auth перед try{}?
- `MyProfilePage.tsx` — avatar upload: розмір + MIME type validation?
- `B2CRouteGuard.tsx` — чи перевіряє session правильно?

---

## 🗺️ Файлова мапа

```
src/app/my/
├── layout.tsx               — MyBottomNav, B2CRouteGuard
├── bookings/page.tsx        — server: fetch bookings by client_id
├── loyalty/page.tsx         — server: fetch points, tier, history
├── masters/page.tsx         — server: fetch saved/visited masters
├── notifications/page.tsx   — server: fetch notifications
├── profile/page.tsx         — server: fetch profile data
├── setup/phone/page.tsx     — phone number setup (OTP?)
└── support/chat/page.tsx    — server: fetch ticket + messages

src/components/client/       — всі client components
src/components/shared/support/SupportChatPage.tsx
```

---

## ⚡ QA-GATE питання для STEP 12

1. **Глибина аудиту:** Correctness-only чи + visual polish?
2. **SupportChatPage:** Повний security audit чи тільки a11y?
3. **MyProfilePage:** Avatar upload — перевіряти розмір/MIME validation?
4. **MyBottomNav:** Audit окремо від page components чи разом?
5. **Scope split:** Всі 8 компонентів в одному чаті чи розбити?

---

## 🧠 MemPalace контекст

```
mempalace_search "client portal my bookings loyalty profile"
mempalace_search "MyBottomNav navigation touch target"
mempalace_search "support chat send message server action"
mempalace_search "B2CRouteGuard auth client"
```

---

## 🏁 Стан на момент передачі (2026-05-31)

| Параметр | Значення |
|----------|----------|
| TSC | 0 помилок |
| Build | clean (51 pages) |
| MemPalace | 21,571+ drawers |
| Активна гілка | `main` |
| Остання зміна | STEP 11 — Shop + Portfolio correctness + a11y |
| Drawer STEP 11 | `drawer_bookit_audits_2272efe59888d3addd38f5c0` |
| Progress | 10/13 (~77%) |

---

## 📋 Промт для нового чату (copy-paste)

```
Ти Claude Code, продовжуєш роботу над BookIT (Ukrainian beauty booking SaaS).
CWD: C:\Users\Vitossik\SaaS\bookit

STARTUP SEQUENCE (виконати ПЕРШИМ):
1. mcp__mempalace__mempalace_status
2. Read C:\Users\Vitossik\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset 495, limit 50)
3. Відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"

ЗАДАЧА: STEP 12 — Client Portal
Scope: /my/* (8 сторінок) + компоненти client/ (~2,114 рядків)

КОНТЕКСТ:
STEP 11 ✅ COMPLETE — Shop + Portfolio correctness + a11y audit (2026-05-31)
Drawer STEP 11: drawer_bookit_audits_2272efe59888d3addd38f5c0
Progress: 10/13 (~77%)

Handoff: C:\Users\Vitossik\SaaS\XDEV\RELEASE\STEPS\STEP_12_HANDOFF.md

ЗАЛІЗНІ ПРАВИЛА:
• SPRING = { type: 'spring' as const, stiffness: 280, damping: 24 } as const
• ніколи onClick на div/span → тільки <button type="button"> або <Link>
• aria-pressed на toggle/selector buttons; touch targets ≥ 44px
• MyBottomNav: nav items МУСЯТЬ мати aria-label + touch target ≥ 44px
• SupportChatPage: security check — auth перед try{} у server action
• весь новий UI-текст → /humanizer
• Post-change: npx tsc --noEmit → npm run build → mempalace_add_drawer
```

---

*Handoff створено: 2026-06-01 · Автор: Claude Sonnet 4.6 (STEP 11 session)*
