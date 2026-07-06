# STEP 13 — Final Sprint: Handoff Note

> **Від:** STEP 12 (Client Portal `/my/*`) ✅ Complete — 2026-06-01
> **До:** STEP 13 — Фінальний крок (Legal · Offline · Invite · Studio · Backlog)
> **Модель:** 🟢 Sonnet 4.6 high
> **Структура:** 1 чат (всі файли + backlog разом)

---

## 🎯 Контекст передачі

STEP 12 завершено — Client Portal повністю аудитований. Проект на **12/13 кроків (~92%)**.

STEP 13 — останній крок перед Production Release. Включає:
1. Аудит дрібних публічних/системних сторінок
2. Закриття backlog (B-01..B-05, C-01, D-01)
3. Фінальна перевірка quality gate всього продукту

---

## 📦 Scope: Files to Audit

```
# Публічні/Системні сторінки
src/app/(public)/legal/page.tsx              ← список документів
src/app/(public)/legal/[slug]/page.tsx       ← документ (MDX? серверний рендер)
src/app/offline/page.tsx                     ← PWA offline fallback
src/app/invite/[code]/page.tsx               ← ⚠️ emoji violation: ✨📅💎

# Studio (не аудитовані ще)
src/app/studio/[slug]/page.tsx               ← studio master profile (public)
src/app/studio/join/page.tsx                 ← join as studio master

# Admin (internal, P3)
src/app/admin/page.tsx
src/app/admin/masters/page.tsx
src/app/admin/moderation/page.tsx
src/app/admin/support/page.tsx
src/app/admin/logs/page.tsx
src/app/admin/alliances/page.tsx
```

---

## 🔍 Pre-scan — очікувані проблеми

### `/invite/[code]/page.tsx` (KNOWN P3)
```tsx
// LINE ~113 — emoji violation
['✨', 'Онлайн-запис 24/7'],
['📅', 'Нагадування про сесії'],
['💎', 'Програма лояльності'],
```
Fix: Lucide icons замість emoji.

### `/offline/page.tsx`
- Чи є type="button" на кнопках?
- Чи є emoji?

### `/legal/*`
- Перевірити відсутність auth guard (публічні!)
- type="button" на nav/back кнопках

### `studio/join/page.tsx`
- Публічна сторінка (не вимагає auth)
- type="button" sweep
- emoji check

---

## 📋 Backlog (вирішити в STEP 13)

### 🔴 Critical
| ID | Issue | Де |
|---|---|---|
| B-01 | Dashboard Home: `/impeccable audit` → health score 22/40 → target 34+ | `/dashboard` |
| B-02 | Vercel QA: onboarding `967bf06` ручний QA | Vercel prod |

### 🟡 High
| ID | Issue | Де |
|---|---|---|
| B-03 | Studio WeeklyChart: BarTooltip click → day detail | `widgets/studio/WeeklyChartWidget.tsx` |
| B-04 | Frost WeeklyChart: tooltip `rounded-[4px]` (зменшити від rounded-lg) | `widgets/frost/WeeklyChartWidget.tsx` |
| B-05 | Blossom: font/contrast стандартизація widget headers | blossom widgets |

### 🟠 P1 Polish (carry-over)
| ID | Issue | Де |
|---|---|---|
| C-01 | BookingCard: `borderLeft` 4px → full border + bg tint | `BookingCard.tsx` |
| D-01 | ClientsPage: borderLeft cards → full border + bg tint | `ClientsPage.tsx` |

---

## 🔒 Security — перевірити в admin pages

- Admin pages захищені middleware (role=admin required) ✅
- Server actions в admin — `auth` перед `try{}`?
- Чи немає прямих DB queries без RLS bypass через admin client?

---

## 🧠 MemPalace контекст

```
mempalace_search "legal offline public routes"
mempalace_search "invite page referral emoji"
mempalace_search "dashboard impeccable audit health score"
mempalace_search "studio join page public"
mempalace_search "WeeklyChart tooltip rounded studio frost"
```

---

## 🏁 Стан на момент передачі (2026-06-01)

| Параметр | Значення |
|---|---|
| TSC | 0 помилок |
| Build | clean (51 pages) |
| MemPalace | 21,575+ drawers |
| Активна гілка | `main` |
| Прогрес | 12/13 (~92%) |
| Остання зміна | STEP 12 — Client Portal |
| Drawer 12a | `drawer_bookit_audits_0a433239dd2c899a3691ba79` |
| Drawer 12b | `drawer_bookit_audits_3bec0459fbf4b9a44e1aa9d9` |

---

## ⚡ ЗАЛІЗНІ ПРАВИЛА (повний список)

```
SPRING = { type: 'spring' as const, stiffness: 280, damping: 24 } as const

• RULE -1: mempalace_status на старті + mempalace_search перед рішеннями
• RULE 0:  encoding check перед Edit/Write Cyrillic файлів
           (Python: open('file.tsx','rb').read() → шукати b'\xe2\x80\x99')
• RULE 0.5: весь UI-текст → /humanizer (виняток: aria-label, data-testid, дати)
• RULE 1:  QA-GATE: уточнити → план → user ok → код
• RULE 2:  Skills Decision Tree → оголосити skill перед ітерацією
• RULE 3:  Post-Change: tsc → build → mempalace_add_drawer → SYSTEM_MAP
• RULE 4:  Framer: mode='popLayout' | spring as const | no emoji in UI
• RULE 5:  Bulk Edit: ≥5 змін в одному файлі → Write (не Edit)
           HARD LIMIT: edit_counter_guard.py блокує на 5 Edit/file/session
           Write скидає лічильник до 0
• RULE 6:  ніколи onClick на div/span → тільки <button type="button"> або <Link>
• RULE 7:  aria-pressed на toggle/selector buttons; touch targets ≥ 44px
```

---

## 📋 Промт для нового чату (copy-paste)

```
Ти Claude Code, продовжуєш роботу над BookIT (Ukrainian beauty booking SaaS).
CWD: C:\Users\Vitos\SaaS\bookit

STARTUP SEQUENCE (виконати ПЕРШИМ):
1. mcp__mempalace__mempalace_status
2. Read C:\Users\Vitos\SaaS\XDEV\MAPS\SYSTEM_MAP.md (offset 495, limit 50)
3. Відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Ready"

ЗАДАЧА: STEP 13 — Фінальний Sprint
Scope: Legal + Offline + Invite + Studio + Admin (аудит) + Backlog B/C/D

КОНТЕКСТ:
STEP 12 ✅ COMPLETE — Client Portal (2026-06-01)
Drawers: drawer_bookit_audits_0a433239dd2c899a3691ba79 (12a) · drawer_bookit_audits_3bec0459fbf4b9a44e1aa9d9 (12b)
Progress: 12/13 (~92%)

Handoff: C:\Users\Vitos\SaaS\XDEV\RELEASE\STEPS\STEP_13_HANDOFF.md
Status: C:\Users\Vitos\SaaS\XDEV\RELEASE\STATUS.md
Roadmap: C:\Users\Vitos\SaaS\XDEV\RELEASE\MAPS\PAGE_RELEASE_ROADMAP.md

ЗНАНІ ПРОБЛЕМИ (fix негайно):
1. /invite/[code]/page.tsx — emoji ✨📅💎 в UI (~line 113)
2. Backlog: B-03 Studio WeeklyChart tooltip, B-04 Frost tooltip radius, C-01 BookingCard border

ЗАЛІЗНІ ПРАВИЛА:
• SPRING = { type: 'spring' as const, stiffness: 280, damping: 24 } as const
• ніколи onClick на div/span → тільки <button type="button"> або <Link>
• aria-pressed на toggle buttons; touch targets ≥ 44px
• весь новий UI-текст → /humanizer
• edit_counter_guard: блок на 5 Edit/file/session → Write скидає лічильник
• Post-change: npx tsc --noEmit → npm run build → mempalace_add_drawer
```

---

*Handoff створено: 2026-06-01 · Автор: Claude Sonnet 4.6 (STEP 12 session)*
