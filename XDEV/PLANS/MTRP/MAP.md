# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP).
> Один погляд → знаєш точку входу, наступну дію, блокери.
> **Updated:** 2026-06-04 (Session 01)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 0 · item P0.11 (export-trim) → потім P0.5 (type="button" sweep)
```

**Конкретно P0.11 export-trim** (4 файли, surgical edits — спершу VERIFY кожен експорт через Grep):
1. `bookit/src/lib/utils/currency.ts` → видалити `formatPrice` (дубль у `services/types.ts:59`)
2. `bookit/src/lib/utils/dates.ts` → видалити `formatTime`, `formatDayFull`, `pluralize`
3. `bookit/src/lib/utils/broadcastUtils.ts` → видалити 5 unused exports (прочитати файл → визначити exports)
4. `bookit/src/lib/billing/pricing.ts` → видалити `TierProgress`, `BillingInput`

> Для кожного: `Grep "<exportName>"` по `bookit/src` → якщо 0 importers (крім самого визначення) → видалити → `tsc`.

**Потім P0.5** — `type="button"` sweep (§5.5 плану): `Grep "<button"` без `type=`, Bulk Edit Protocol, технічні рядки (без humanizer).

---

## 🚦 Блокери / рішення користувача (потрібні перед відповідними items)

| ID | Що блокує | Питання до Вітоса |
|---|---|---|
| 🔒 **N-01** | P0.10 (5 root-widgets) | `(public)/auth/blocks-test/page.tsx` — dev-харнес у проді, єдиний споживач InsightsRow/QuickActions/FreeSlots/TopServices/ChannelHealth. **Видалити сторінку + 5 віджетів разом?** |
| 🔒 **Q1** | P0.1 (booking hijack) | Підхід до фіксу: (A) phone-match [MVP], (B) magic-link [gold], (C) OTP? + потрібна міграція `139_*` |
| 🔒 **P0.12** | onboarding telemetry | Лишити обидва onboarding-роути + 1 тиж телеметрії (вже погоджено §1.4) — стартувати телеметрію? |

> Items не-заблоковані можна робити одразу — блокери не зупиняють решту Phase 0/1.

---

## 📍 Фазова мапа (де в загальному плані)

```
► Phase 0  HOT FIXES        ~40%  ← ТУТ. dead-code ✅ | a11y (P0.5/P0.6) ⏳ | security (P0.1) 🔒
  Phase 1  SECURITY & A11Y    0%  (P0.2 admin-leak, P0.7 MicaModal, P0.8/9 button, a11y)
  Phase 2  LIMITED DRY        0%  (mojibake, deps, types-start, FK index)
  Phase 3  TESTS & TYPES ⭐    0%  (createBooking + referrals тести, as any) ← USER PRIORITY
  Phase 4  POLISH             0%  (split files, virtual, contrast, labels, P3)
```

---

## ✅ Що вже закрито (Session 01, 2026-06-04)

- Інфраструктура хабу `XDEV/PLANS/MTRP/` (5 файлів) ✅
- **P0.3** stub видалено ✅
- **P0.11** 9 dead-файлів видалено ✅ (export-trim лишився)
- **P0.10** 5 root-widgets видалено ✅ (~1002 рядки; +3 plan corrections)
- **CHECK:** `tsc --noEmit` exit 0 ✅ · `npm run build` exit 0 ✅
- Загалом видалено **15 файлів** (~2400+ рядків мертвого коду).

---

## 🔁 Quick-resume команди

```bash
# 1. контекст
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md          # цей файл
Read XDEV/PLANS/MTRP/TRACKER.md      # ⏳ items

# 2. перед item
mempalace_search "[item keywords]"

# 3. цикл (WORKFLOW.md)
# verify importers → fix → cd bookit && npx tsc --noEmit && npm run build → log → commit
```

---

## 📊 Лічильник

```
Items closed: 4 / 71   (P0.3 ✅ · P0.10 🔄 · P0.11 🔄 · P3.11 no-fix)
Dead code removed: ~2400 рядків (15 файлів)
Commits: 2 (infra + dead-code)
Plan corrections logged: 4 (C-01..C-04) + 1 new finding (N-01)
```

---

*Updated: 2026-06-04 Session 01 · Next: P0.11 export-trim → P0.5 type="button"*
