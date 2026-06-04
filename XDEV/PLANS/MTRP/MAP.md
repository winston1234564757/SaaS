# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP).
> Один погляд → знаєш точку входу, наступну дію, блокери.
> **Updated:** 2026-06-04 (Session 02)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 0 (фінал) · item P0.6 (aria-label) → потім PHASE 1 / P0.1 (security)
```

**P0.6 — icon-only кнопки без `aria-label`** (§5.6 плану, 30+ кандидатів):
1. **СПЕРШУ VERIFY** — план застарів (P0.5 виявився вже зробленим). Для кожного файла зі списку §5.6: прочитати рядок кнопки → чи справді icon-only без `aria-label`.
   - Швидкий скан: `Grep "aria-label" <file>` + візуальна перевірка icon-only `<button>` без тексту.
2. Додати `aria-label="..."` (UA, технічні рядки — **без humanizer**).
3. Bulk Edit Protocol (батч по файлах). ⚠️ Пам'ятати: edit_counter_guard блокує на 5 Edit/файл — для 5+ змін у файлі → **Write**.

**Потім P0.1 — booking hijack (security, BLOCKED→ready):** рішення прийнято = **phone-match + `link_attempts` table + rate-limit**.
- ⚠️ Спершу прочитати **поточний** код `src/app/[slug]/actions.ts` (план показує код 2026-06-02, міг змінитись).
- Перевірити схему: чи є `bookings.client_phone`, `profiles.phone`.
- Міграція `139_booking_link_security.sql` (link_attempts + RLS service-role-only) → `npx supabase db push`.
- E2E: атака чужим booking → blocked; matching phone → success; rate-limit.
- magic-link (gold) — задокументувати як future enhancement, не робити зараз.

---

## 🔒 Блокери / рішення користувача

| ID | Статус | Деталь |
|---|---|---|
| ✅ **N-01** | RESOLVED | blocks-test + 6 орфан-віджетів видалено |
| ✅ **Q1** | DECIDED | P0.1 = phone-match + audit table + rate-limit (magic-link = future) |
| 🔒 **P0.12** | pending | Стартувати телеметрію onboarding (обидві сторінки + 1 тиж). Потрібна міграція `140_*` + API route. Робити в Phase 1 |

> Усі блокери для Phase 0 зняті. Phase 0 = dead-code ✅ + P0.5 ✅; лишився P0.6.

---

## 📍 Фазова мапа

```
► Phase 0  HOT FIXES        ~75%  ← dead-code ✅ · P0.5 ✅ · лишився P0.6
  Phase 1  SECURITY & A11Y    0%  (P0.1, P0.2 admin-leak, P0.7 MicaModal, P0.8/9, P1.x a11y)
  Phase 2  LIMITED DRY        0%  (mojibake, deps, types-start, FK index)
  Phase 3  TESTS & TYPES ⭐    0%  (createBooking + referrals тести, as any) ← USER PRIORITY
  Phase 4  POLISH             0%  (split files, virtual, contrast, labels, P3)
```

---

## ✅ Що вже закрито

**Session 01 (2026-06-04):**
- Інфраструктура хабу `XDEV/PLANS/MTRP/` (5 файлів)
- P0.3 stub · P0.11 (9 dead-файлів) · P0.10 (5 root-widgets)

**Session 02 (2026-06-04):**
- **N-01** — blocks-test route + 6 орфан-віджетів видалено → **P0.10 ✅ DONE**
- **P0.11 ✅ DONE** — export-trim (formatPrice, formatTime, formatDayFull); broadcastUtils/pricing KEPT (план помилявся); pluralize→P3.2
- **P0.5 ✅ DONE** — verified 0 кнопок без type (закрито STEP 5-13)
- **CHECK:** tsc 0 · build 0 (після `rm -rf .next`)

**Разом видалено:** ~2,400 рядків dead code, 22 файли.

---

## 🔁 Quick-resume команди

```bash
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md          # цей файл
Read XDEV/PLANS/MTRP/TRACKER.md      # ⏳ items + corrections
mempalace_search "[item keywords]"
# WORKFLOW: verify → fix → cd bookit && npx tsc --noEmit && npm run build → log → commit
# ⚠️ при видаленні роуту: rm -rf .next перед build
```

---

## 📊 Лічильник

```
Items closed: 6 / 71   (P0.3 · P0.5 · P0.10 · P0.11 · P1.13 · P3.11) + N-01 resolved
Deferred: 2 (P0.4, P1.2) · Blocked: 2 (P0.1 ready, P0.12) 
Dead code removed: ~2,400 рядків (22 файли)
Plan corrections logged: 8 (C-01..C-08) + 1 new finding (N-01) + StatsMosaicWidget
Commits: 4 (infra · dead-code S01 · dead-code S02 · docs)
```

---

*Updated: 2026-06-04 Session 02 · Next: P0.6 aria-label (verify first) → P0.1 security*
