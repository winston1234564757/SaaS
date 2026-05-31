# 📊 STATUS.md — Live Release Tracker

> Оновлюється після кожного значущого зрушення. Live джерело правди про прогрес.
> **Updated:** 2026-05-31
> **Active step:** STEP 11 (Shop + Portfolio `/[slug]/shop`, `/[slug]/portfolio`) — Next
> **Progress:** 9 / 13 complete + STEP 04 carry-over pending
> **Model in use:** 🔴 Opus 4.7 max (STEP 11)
> **Last commit:** TSC 0 · build clean · STEP 10 Complete (Public Master Page correctness + visual polish, 2026-05-31)

---

## 🗺️ Загальний прогрес

```
[█████████░░░░] ~69% (9/13 + STEP 04 carry-over)

Step 01: ✅ Complete (2026-05-28)
Step 02: ✅ Complete (2026-05-28)
Step 03: ✅ Complete (2026-05-30)
Step 04: ⚠️ Carry-over pending (B-01..B-05 — не блокують STEP 11)
Step 05: ✅ Complete (2026-05-31)
Step 06: ✅ Complete (2026-05-31)
Step 07: ✅ Complete (2026-05-31)
Step 08: ✅ Complete (2026-05-31)
Step 09: ✅ Complete (2026-05-31)
Step 10: ✅ Complete (2026-05-31)
Step 11: 🔜 Next
Steps 12-13: 🔒 Blocked (sequential)
```

---

## 📋 Зведена таблиця 13 кроків

| # | Сторінка | Модель | Статус | Started | Ready | Drawer ID | Commit |
|---|---|---|---|---|---|---|---|
| 01 | `/` Landing | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-27 | 2026-05-28 | `d61ab82e` | 3a42b10+ |
| 02 | Auth (`/login`, `/register`, `/callback`) | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-28 | 2026-05-28 | `0f174061` / `aece86e2` | ff50c78+ |
| 03 | Onboarding (`/dashboard/onboarding`) | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-28 | 2026-05-30 | `9014576630a5` | `967bf06` |
| 04 | Dashboard Home (`/dashboard`) | 🟢 Sonnet 4.6 | ⚠️ **Carry-over** | 2026-05-30 | — | — | `6577d5a` |
| 05 | Bookings (`/dashboard/bookings`) | 🟢 Sonnet 4.6 | ✅ **Complete** | 2026-05-31 | 2026-05-31 | `f4b261099ec82d90` | — |
| 06 | CRM Clients (`/dashboard/clients`) | 🟡 Mixed | ✅ **Complete** | 2026-05-31 | 2026-05-31 | `8b26b6ff187c043ed68372b0` | — |
| 07 | Services + Products | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-31 | 2026-05-31 | `ea3affc66ed6c48195edda5e` | — |
| 08 | Revenue · Growth · Marketing · Billing · Settings · Studio | 🟢 Sonnet 4.6 | ✅ **Complete** | 2026-05-31 | 2026-05-31 | `e1534fd674b5432d8685234b` | — |
| 09 | Explore (`/explore`) | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-31 | 2026-05-31 | `e7959f077fa9adbf72463435` | — |
| 10 | Public Master Page (`/[slug]`) | 🟢 Sonnet 4.6 high | ✅ **Complete** | 2026-05-31 | 2026-05-31 | `6b554b09eed872165f45ba2a` | — |
| 11 | Shop + Portfolio | 🔴 Opus 4.7 max | 🔜 **Next** | — | — | — | — |
| 12 | Client Portal (`/my/*`) | 🟢 Sonnet 4.6 high | 🔒 Blocked | — | — | — | — |
| 13 | Legal/Offline/`/r/[code]` | 🟡 Mixed | 🔒 Blocked | — | — | — | — |

> **Примітка:** Крок 8 розбито на 3 чати (08a/08b/08c) через об'єм. Кожен має власний playbook.

---

## 🎯 ACTIVE STEP — детальний стан

### STEP 10 — Public Master Page (`/[slug]`) ✅ COMPLETE
- **Sessions:** 1 (2026-05-31, plan + 1 Write + 5 Edits)
- **Модель:** 🟢 Sonnet 4.6 high
- **Статус:** ✅ **COMPLETE** — correctness + visual polish, TSC 0, build clean (51 pages)
- **Drawer:** `drawer_bookit_audits_6b554b09eed872165f45ba2a`
- **Scope:** SPRING ×15, type="button" ×3, colors→tokens, img→Image, size-9→11, carousel nav ×2, aria-selected fix, aria-label nav, spring as const, C2C race fix, OTP touch target
- **Business logic verified:** createBooking, dynamicPricing, computeBookingPrice, actions — all CLEAN ✓

---

### STEP 09 — Explore (`/explore`) ✅ COMPLETE
- **Sessions:** 1 (2026-05-31, plan + 1 Write)
- **Модель:** 🟢 Sonnet 4.6 high
- **Статус:** ✅ **COMPLETE** — correctness + visual polish, TSC 0, build clean
- **Drawer:** `drawer_bookit_audits_e7959f077fa9adbf72463435`
- **Scope:** type="button" ×9, aria-label+touch, aria-pressed ×4, aria-expanded+haspopup, role=listbox/option, PRO badge overflow bug, pluralUk, SPRING as const, animate-pulse removed, hover lift

---

### STEP 08 — Other Hubs ✅ COMPLETE
- **Sessions:** 1 (2026-05-31, сесія 08a→08b→08c в одному чаті)
- **Модель:** 🟢 Sonnet 4.6 high
- **Статус:** ✅ **COMPLETE** — correctness audit 08a/08b/08c, TSC 0, build clean
- **Drawer:** `drawer_bookit_audits_e1534fd674b5432d8685234b`
- **Scope:** P1 div→button (DynamicPricingPage, StoryGenerator), type="button" ×20+, aria-pressed, spring as const, dead code removed, billing webhook audit (ECDSA CLEAN)

---

### STEP 07 — Services + Products ✅ COMPLETE
- **Sessions:** 1 (2026-05-31)
- **Модель:** 🟢 Sonnet 4.6 high
- **Статус:** ✅ **COMPLETE** — correctness audit, TSC 0, build clean
- **Drawer:** `drawer_bookit_audits_ea3affc66ed6c48195edda5e`
- **Scope:** type="button" sweep, aria-pressed, P1 ServiceCard div→button, orphan files deleted, mock stats replaced

---

### STEP 06 — CRM Clients (`/dashboard/clients`) ✅ COMPLETE
- **Sessions:** 1 (Plan + A+B+C — 2026-05-31)
- **Модель:** 🟡 Mixed (Sonnet 4.6)
- **Статус:** ✅ **COMPLETE** — impeccable 15/20, TSC 0, build clean (51/51)
- **Drawer:** `8b26b6ff187c043ed68372b0` (audit)
- **Carry-over D-01..D-04:** borderLeft cards (P1), useMemo ClientWidgets (P2), grid buttons (P2), sort aria (P2)

---

### STEP 05 — Dashboard Bookings (`/dashboard/bookings`) ✅ COMPLETE
- **Sessions:** 4 (Audit + A + B + C + D)
- **Модель:** 🟢 Sonnet 4.6
- **Статус:** ✅ **COMPLETE** — impeccable 16/20, E2E 22/22, TSC 0, build clean
- **Drawer:** `f4b261099ec82d90d73f1684`

#### Виконано за STEP 05

**Session 1 — Audit:** impeccable + react-doctor (24/100) + security-review — 24 issues знайдено.

**Session A — P0/P1 Fixes:**

| ID | Fix |
|---|---|
| P0-S01 | Auth guards перед try{} у всіх 6 функціях actions.ts |
| P0-S02 | completeBooking: порожні strings → реальні date/services у notification |
| P1-L01 | cancelBooking + updateBookingStatus: status guard |
| P1-M01 | layoutId sliding indicators (mobile + desktop TR + View switchers) ×4 |
| P1-A01 | type="button" ×36 across 7 files; aria-pressed; aria-label; min-h-[44px] |
| P2-T01 | text-text-mute/60 → text-muted-foreground/60 (invisible text bug) |
| P2-T02 | ring-[#789A99]/30 → ring-primary/20 |
| P3-C02 | Emoji ⭐ removed from notifyClientReviewNudge |

**Session B — URL-state:** `?view ?range ?date ?status` + `<Suspense>` + `setUrl()` helper. Drawer: `08ce7755632408b1`

**Session C — Modal A11y:** type="button" ×9 у BookingDetailsModal; theme CSS vars verified (--success/--warning/--sage ✅ all 3 themes). Drawer: `07e7391baf728557`

**Session D — Final Polish:** `<label>`→`<p>`, IIFE×3→`dayWorkHours` useMemo, `textarea aria-label`. E2E: **22 passed, 0 failed**. Drawer: `f4b261099ec82d90`

#### Carry-over до STEP 06
| ID | Issue | Пріоритет |
|---|---|---|
| C-01 | BookingCard: `borderLeft` 4px side-stripe → full border + bg tint | 🟠 P1 Polish |
| C-02 | BookingDetailsModal: `text-[9px]` status badge → `text-[11px]` | 🟢 P3 |

---

### STEP 04 — Dashboard Home (`/dashboard`) ⚠️ Carry-over
- **Sessions:** 4 завершено (2026-05-30)
- **Модель:** 🟢 Sonnet 4.6
- **Статус:** ⚠️ Carry-over pending — код задеплоєно (`6577d5a`), B-01..B-05 відкладено
- **Last commit:** `6577d5a` (pushed → Vercel deployed)

#### Carry-over items
| ID | Issue | Пріоритет |
|---|---|---|
| B-01 | `/impeccable audit` → health score (baseline 22/40 → target 34+) | 🔴 Critical |
| B-02 | Vercel QA: ручна перевірка onboarding flow `967bf06` | 🔴 Critical |
| B-03 | Studio WeeklyChart: BarTooltip click → day detail drill-down | 🟡 High |
| B-04 | Frost WeeklyChart: tooltip `rounded-[4px]` | 🟡 High |
| B-05 | Blossom: font/contrast стандартизація widget headers | 🟡 High |

---

### SIDE SPRINT — BookingWizard QA (2026-05-30) ✅ COMPLETE

**Drawer:** `drawer_bookit_decisions_769e553e6bc72a67169b3bd3`
Scope: ServiceSelector carousel, StepProgress dots, DateTimePicker onBack, ClientCombobox, service photos pipeline. 8 bugs fixed.

---

## 🗂️ BACKLOG — Cross-step issues

### 🔴 Critical
| ID | Issue | Статус |
|---|---|---|
| B-01 | `/impeccable audit` Dashboard Home health score (22/40 → 34+) | ⏳ Pending |
| B-02 | Vercel QA: onboarding `967bf06` ручний QA | ⏳ Pending |

### 🟡 High
| ID | Issue | Статус |
|---|---|---|
| B-03 | Studio WeeklyChart: BarTooltip → day detail | ⏳ Pending |
| B-04 | Frost WeeklyChart: tooltip `rounded-[4px]` | ⏳ Pending |
| B-05 | Blossom: font/contrast widget headers | ⏳ Pending |

### 🟠 Polish (STEP 05 carry-over)
| ID | Issue | Статус |
|---|---|---|
| C-01 | BookingCard: `borderLeft` → full border + bg tint | ⏳ Pending |
| C-02 | BookingDetailsModal: `text-[9px]` badge → `text-[11px]` | ⏳ Pending |

### 🔵 External
| ID | Issue | Статус |
|---|---|---|
| B-06 | Vercel Pro → cron `0 * * * *` | 🔒 External |
| B-07 | E2E tests for onboarding | ⏳ Pending |

---

## 🧭 Legend

| Статус | Означає |
|---|---|
| ⏳ **In progress** | Активна робота |
| ✅ **Complete** | Усі 7 вимірів пройдено, doc synced, drawer створено |
| 🔜 **Next** | Готово до старту, попередній крок завершено |
| 🔒 **Blocked** | Чекає попереднього кроку або зовнішньої дії |
| ⚠️ **Carry-over** | Код задеплоєно, pending items відкладено |

---

## 📞 Швидкі посилання

- [README.md](./README.md) — правила, моделі, налаштування
- [CHANGELOG.md](./CHANGELOG.md) — журнал готових кроків
- [STEPS/](./STEPS/) — детальні playbooks
- [../MAPS/PAGE_RELEASE_ROADMAP.md](../MAPS/PAGE_RELEASE_ROADMAP.md) — source of truth для scope

---

*Останнє оновлення: 2026-05-31 — STEP 10 Complete (Public Master Page correctness + visual polish); STEP 11 Next*
