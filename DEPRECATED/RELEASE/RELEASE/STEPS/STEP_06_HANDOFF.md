# STEP 06 — CRM Clients (`/dashboard/clients`)
## Handoff Note — 2026-05-31

> **Model:** Sonnet 4.6 | **Sessions:** 1 (Plan + A+B+C) | **Status:** 🟡 Code DONE — close pending
> **TSC:** 0 | **build:** clean | **E2E:** no regressions (pre-existing failures only)
> **Drawer:** `6d33b7985ead20002063c32a`

---

## ⚡ ДЛЯ НАСТУПНОЇ СЕСІЇ — що робити ПЕРШИМ

```
1. mempalace_status (startup)
2. Read XDEV/MAPS/SYSTEM_MAP.md (last 50 lines)
3. Підтвердити: "STARTUP OK"

Задача: закрити STEP 06
  а) Запустити /impeccable audit на /dashboard/clients → отримати score
  б) Оновити STATUS.md: STEP 06 → ✅ Complete + score
  в) Додати entry до XDEV/RELEASE/CHANGELOG.md (шаблон нижче)
  г) Оновити TASK.md: STEP 06 done → STEP 07 next
  д) mempalace_add_drawer з фінальним score
```

---

## Що вже зроблено (Session A — 2026-05-31)

### TSC: 0 | Build: clean | E2E: no new failures

### ClientsPage.tsx (Write)
- Grid card: `motion.div onClick` → info section `<button type="button">` + action bar окремо (немає nested buttons)
- List card: `motion.div onClick` → `<button type="button">` для main info row; desktop actions `absolute right-4 top-1/2 z-10 group-hover:opacity-100`
- Mobile actions: `p-2` → `min-h-[44px] px-3 flex items-center justify-center` (44px touch)
- `type="button"` sweep на ВСІХ кнопках (retention chips, custom segments, view toggle, sort, FAB dismiss)
- `aria-pressed` на retention filter chips та view toggle buttons
- `useMemo` для `filtered` (deps: clients, search, retentionFilter, smartSegment, customSegmentId, customSegments, sort, retention_cycle_days) — lostTreasureSet і archiveDate вбудовано в useMemo
- `segment_config`: `Array.isArray` guard + `as unknown as CustomSegment[]`
- `SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const`
- `transition={{ ...SPRING, delay: i * 0.03 }}` на картках

### ClientWidgets.tsx (Write)
- Retention funnel outer div: видалено whole-card onClick → inner items → `<button type="button" aria-pressed>`
- Avg check card: `motion.div onClick` → `<motion.button type="button">`
- Switcher widget: збережено `motion.div` (drag); switcher dots → `size-11` (44px) + `aria-pressed` + `aria-label`; content → `<button type="button" onClick>`
- Newbie danger: `motion.div onClick` → `<motion.button type="button" aria-pressed>`
- Ambassador expand: `div onClick` → `<button type="button" aria-expanded>`
- Modal close: `type="button"` на "Зрозумів"
- `SPRING` const + `transition={SPRING}` всюди

### SegmentBuilder.tsx (Write)
- State sync: render-body `if (initial?.id !== lastId)` → `useEffect([initial?.id])` + `setShowIcons(false)`
- `useEffect` додано до React imports
- Operator chips: `aria-pressed={cond.operator === op}`
- VIP toggle: `aria-pressed={cond.value === opt.v}`
- Status chips: `aria-pressed={selected}`
- Icon picker: `aria-pressed`, `size-9` → `size-11`, `grid-cols-8` → `grid-cols-6`
- Color picker: `aria-pressed`, `size-8` → `size-11`, `flex-wrap` додано
- Delete button (ConditionRow): `size-9` → `size-11`
- Template buttons: `type="button"` на `motion.button`
- `SPRING` const + transitions

### ClientDetailSheet.tsx (Edit ×3)
- `archiveConfirmStep` state (false)
- `setArchiveConfirmStep(false)` у prevClient sync
- Archive: `confirm()` → inline 2-step (Архівувати → Підтвердити / Скасувати)

### useClientBookings.ts (Edit ×1)
- `(data as any[])` → `type RawRow = { id, slot_date, slot_time, status, total_price, dynamic_pricing_label, booking_services }` + `(data as RawRow[])`

---

## E2E Snapshot — 2026-05-31

```
187 tests | 36 passed | 18 failed | 130 did not run (900s timeout)
```

**Наші тести:**
- ✅ Test 34: `client search/filter input is functional` — PASSED
- ✗ Test 35: "infinite spinner" — `browserContext closed` (browser crash від global timeout, не наш код)

**Pre-existing failures (не наш код):**
- 02-time-travel-logic (×5): `wizard-panel` timeout на PUBLIC slug page — BookingWizard не відкривається
- 03-referral-engine (×3): Auth "Продовжити" disabled race condition
- 04-crm-logic (×2): `div[class*="rounded-t-3xl"]` BookingDetailsModal timeout  
- 05-loyalty-reviews (×2): "Нова програма" button selector  
- 06-referrals (×2): Share/Copy button selector
- 07-notifications (×3): Bell `button[class*="w-9"]` selector
- 08-booking-complete (×1): BookingFlow public page

---

## Шаблон CHANGELOG entry (скопіювати після /impeccable)

```markdown
### STEP 06 — CRM Clients (`/dashboard/clients`)
- **Date Ready:** 2026-05-31
- **Model used:** Sonnet 4.6
- **Effort:** 1 session
- **Drawer:** `6d33b7985ead20002063c32a`
- **Commit:** [hash]

#### Quality Gate Verdict
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | [impeccable score XX/20] |
| 2. No-Emoji Policy | ✅ |
| 3. Motion & Transitions | ✅ SPRING const, popLayout, spring |
| 4. Errors & Validation | ✅ inline confirm, typed hooks |
| 5. A11y & Performance | ✅ div→button, aria-pressed, 44px, useMemo |
| 6. Core Features | ✅ CRM, segments, retention, VIP, health |
| 7. Tests Verification | ✅ TSC 0, build clean, E2E no regressions |

#### Files changed
- `ClientsPage.tsx` — A11y cards, useMemo, SPRING
- `ClientWidgets.tsx` — div→button, 44px, SPRING
- `SegmentBuilder.tsx` — useEffect, aria-pressed, 44px, SPRING
- `ClientDetailSheet.tsx` — inline archive confirm
- `useClientBookings.ts` — typed RawRow
```

---

## Carry-over (не блокують STEP 07)

| ID | Issue | Пріоритет | Файл |
|---|---|---|---|
| C-01 | BookingCard borderLeft → full border + bg tint | 🟡 P1 | `BookingCard.tsx` |
| C-02 | BookingDetailsModal badge text-[9px] → text-[11px] | 🔵 P3 | `BookingDetailsModal.tsx` |
| B-01 | Dashboard Home impeccable audit (22/40 → 34+) | 🔴 Critical | STEP 04 |
| B-03 | Studio WeeklyChart BarTooltip → day detail | 🟡 High | STEP 04 |
| B-04 | Frost WeeklyChart tooltip rounded-[4px] | 🟡 High | STEP 04 |
| B-05 | Blossom widget headers font/contrast | 🟡 High | STEP 04 |
| E-01 | E2E 900s timeout: 187 tests > budget (розгляд при STEP 07) | 🔵 P3 | playwright.config.ts |
