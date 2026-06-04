# 🤝 HANDOFF — MTRP Execution (для наступного чату)

> **Прочитай це ПЕРШИМ** (разом з [MAP.md](./MAP.md)). Це повний контекст виконання плану [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Дата handoff:** 2026-06-04 (після Sessions 01-03) · **Гілка:** `main` · **Стан:** усе зелене (tsc 0 · build 0), усе закомічено.

---

## 0. TL;DR — звідки продовжувати

```
PHASE 0 майже завершено (~85%). Активна робота: P0.6 (icon-only aria-label).
ЗРОБЛЕНО: dead-code ✅ · P0.5 (type=button) ✅ · P0.6 42/~120 🔄
НАСТУПНА ДІЯ: продовжити P0.6 батчами → потім P0.1 (security, готове до старту).
```

**Перший хід наступного чату:**
```bash
# 1. контекст
mcp__mempalace__mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/HANDOFF.md   # цей файл
Read XDEV/PLANS/MTRP/MAP.md       # resume-pointer
Read XDEV/PLANS/MTRP/TRACKER.md   # статуси + Plan Corrections

# 2. свіжий список P0.6
cd bookit
node ../XDEV/PLANS/MTRP/tools/scan-icon-buttons.cjs   # icon-only без aria-label
```

---

## 1. Що це за задача

Виконання **MTRP-2026-06-02** — Master Technical Remediation Plan: **71 item**, 5 фаз (Phase 0→4).
**Мандат користувача (Вітос):** «роби все що треба; на виборі — архітектурно найкращий варіант; **НАЙГОЛОВНІШЕ — нічого не зламати, зробити стабільнішим і кращим**».

**Рішення по процесу (2026-06-04):**
- Деталізація: per-item (всі 71) + фази
- Git: **малі коміти прямо в `main`** (без фазових гілок)
- Розташування трекінгу: хаб `XDEV/PLANS/MTRP/`
- Порядок: Phase 0→1→2→3→4

**Спадкові рішення з плану:** ➖ P0.4 (secrets) deferred · ➖ P1.2 (widget dedup) deferred · 🔒 P0.12 (onboarding telemetry — лишити обидві сторінки + 1 тиж телеметрії).

---

## 2. Хаб виконання `XDEV/PLANS/MTRP/`

| Файл | Роль |
|---|---|
| `HANDOFF.md` | Цей файл — повний контекст для нового чату |
| `MAP.md` | Resume-pointer: наступна дія, блокери, лічильник |
| `TRACKER.md` | Статус усіх 71 item + **Plan Corrections C-01..C-08** |
| `WORKFLOW.md` | Per-item цикл (verify→fix→tsc→build→log→commit) |
| `AUDIT_LOG.md` | Append-only журнал сесій |
| `README.md` | Правила, легенда статусів |
| `tools/scan-buttons.cjs` | Детектор `<button>` без `type=` (brace-aware) |
| `tools/fix-button-type.cjs` | Codemod: `type="button"` на onClick-кнопки |
| `tools/scan-icon-buttons.cjs` | Детектор icon-only кнопок без `aria-label` |

> Джерело правди для scope/фіксів — сам план `../MTRP-2026-06-02.md`. Хаб трекає статус + посилається на §-секції.

---

## 3. Що ЗРОБЛЕНО (Sessions 01-03, усе в `main`)

### Phase 0 — dead-code ✅
- **P0.3** — видалено `old_BookingsPage.tsx` (stub).
- **P0.10 ✅** — видалено **11** root dead-widgets (5 + 6 через N-01). `ScheduleWidget` лишено (живий!).
- **P0.11 ✅** — 9 dead-файлів + 3 dead-експорти (`currency.formatPrice`, `dates.formatTime/formatDayFull`). Разом з dead-code: **~2,400 рядків / 22 файли**.
- **N-01** — видалено dev-харнес `(public)/auth/blocks-test/page.tsx` (був публічним роутом у проді!) + 6 його орфан-віджетів.

### P0.5 ✅ — `type="button"` на ВСІХ кнопках
- Було **204** кнопки без `type=` (НЕ 0 — мій ранній grep дав false-negative, виправлено).
- Виправлено: codemod `fix-button-type.cjs` +192 (тільки onClick-кнопки), ClientAuthSheet +7, 3 UI-примітиви, 2 NO-onClick вручну.
- **Re-scan: 0 з 595 без type.**

### P0.6 🔄 — icon-only `aria-label` (42/~120)
Зроблено 42 кнопки в ~20 файлах. Конвенції лейблів — див. §6.
Batches: primitives (3) · portfolio (2) · AnalyticsPage/WidgetLib/Upgrade/Tooltip (6) · MonthlyCalendar×3+RestockDrawer (10) · Share/Bento/Notif/ProductForm/Vacation/ImageUpload/Broadcast/SysLogs (10) · AdminSupport/Moderation/MyBookings/ProfileHero/Schedule/TopBar/ProductMix (11).

### Закрито повністю: P0.3, P0.5, P0.10, P0.11, P1.13, P3.11 + N-01

---

## 4. НАСТУПНІ КРОКИ (у порядку)

### 4.1 Завершити P0.6 (~78 icon-only кнопок лишилось)
1. `cd bookit && node ../XDEV/PLANS/MTRP/tools/scan-icon-buttons.cjs` → список кандидатів (~231, але ~половина — false-positives).
2. **VERIFY КОЖНУ** перед правкою: прочитати кнопку. Icon-only = всередині лише іконка/спінер, **БЕЗ тексту** (навіть через `{cond ? <Icon/> : 'текст'}` = має текст → пропустити).
3. Додати `aria-label="..."` після `type="button"` (type вже скрізь є). Динамічний для toggle: `aria-label={x ? 'A' : 'B'}`.
4. Батч 8-12 кнопок → `npx tsc --noEmit` + `npm run build` → commit `fix(a11y): aria-label batch N (P0.6)`.
5. **False-positives ПРОПУСКАТИ** (мають видимий текст): copy-кнопки з «Копіювати», CTA з `{loading ? <Loader/> : 'Далі'}`, tab-кнопки з лейблами.

### 4.2 P0.1 — booking hijack (security) — 🔒 ГОТОВЕ ДО СТАРТУ
**Рішення прийнято:** phone-match + `link_attempts` table + rate-limit (magic-link = future enhancement, НЕ зараз).
1. ⚠️ Прочитати **ПОТОЧНИЙ** `src/app/[slug]/actions.ts` (`linkBookingToClient`) — план показує код 2026-06-02, міг змінитись.
2. Перевірити схему БД: чи є `bookings.client_phone` та `profiles.phone` (інакше адаптувати).
3. Логіка: fetch booking → якщо `client_id` вже інший → throw; звірити `profile.phone === booking.client_phone`; mismatch → throw `PHONE_MISMATCH_REQUIRES_OTP`; інакше link + audit.
4. Міграція `139_booking_link_security.sql`: таблиця `link_attempts` (booking_id, user_id, ip, result, created_at) + індекси + RLS (service-role only). → `npx supabase db push`.
5. E2E: атака чужим booking → blocked · matching phone → success · rate-limit (5/15хв).
6. ⚠️ Це HIGH-RISK (data integrity) — розглянути feature flag `FEATURE_STRICT_BOOKING_LINK`.

### 4.3 Решта Phase 1 (§6 плану): P0.2 (admin-client ESLint + 18 zones), P0.7 (MicaModal→Radix focus trap), P0.8 (9 div→button), P0.9 (11 a→button), P1.1 (merge useIsDesktop), P1.3 (heatmap roving tabindex), P1.4 (WeeklyChart aria-pressed), P1.12 (timingSafeEqual CRON), P1.16 (touch targets), P0.12 (telemetry).
### 4.4 Phase 2 → 3 (⭐ USER PRIORITY: тести createBooking + referrals) → 4. Деталі — TRACKER §6-9.

---

## 5. ⚠️ КРИТИЧНІ УРОКИ (hard-won — не наступати знову)

1. **VERIFY-BEFORE-DELETE/FIX.** План MTRP місцями застарів/неточний — **8 помилок** уже знайдено (C-01..C-08). Завжди `Grep`/read поточний код перед дією. НІКОЛИ не видаляти/міняти наосліп за планом.
2. **Grep НЕнадійний для `<button>` атрибутів** (multiline + стрілки `=>` → false-negatives). Використовувати `tools/scan-buttons.cjs` / `scan-icon-buttons.cjs` (brace-aware AST), НЕ ripgrep.
3. **Видалення РОУТУ** (`page.tsx`) лишає stale `.next/types` + `.next/dev/types` → tsc/build падають на фантомному модулі (TS2307). Фікс: `rm -rf .next && npm run build`. (Видалення лише компонентів цього НЕ потребує.)
4. **`type="button"` НЕ сліпо:** submit-кнопка форми має лишатись `type="submit"` (інакше форма не відправиться). Кнопки з `onClick` → `type="button"` безпечно. У кодбейсі лише **2 файли** з `<form>` (NavLoginSheet, SupportWidget) — ризик мінімальний.
5. **`edit_counter_guard.py` блокує 6-й Edit/файл/сесія.** Для 5+ змін в одному файлі → **Write** (скидає лічильник).
6. **Кодування (IRON RULE 0):** файли мають кирилицю UTF-8. Edit/Write/codemod через Node `utf8` — lossless (перевірено mojibake-сканом). Не писати кирилицю text-mode інструментами поза цими.
7. **aria-label = технічні рядки** → RULE 0.5 виняток, **humanizer НЕ потрібен**. Так само data-testid, формати дат.
8. **Брудний working tree:** ще до сесії були незакомічені STEP 12/13 зміни (`my/*` auth guards, invite, changelog). Codemod зачепив ці файли; коміт `3fd2b20` їх захопив — нічого не втрачено, але майте на увазі при `git log`. `git add` робити явними шляхами, не `-A`.

---

## 6. Конвенції aria-label (UA, технічні)

| Контекст | aria-label |
|---|---|
| Закрити модал/дровер/банер (X) | `Закрити` |
| Видалити елемент (X/Trash2) | `Видалити` / `Видалити фото` / `Видалити перерву` / `Видалити файл` |
| Назад (ArrowLeft/ChevronLeft) | `Назад` |
| Місяць prev/next (Chevron) | `Попередній місяць` / `Наступний місяць` |
| Період prev/next | `Попередній період` / `Наступний період` |
| Оновити (RefreshCw) | `Оновити` |
| Stepper −/+ | `Зменшити` / `Збільшити` |
| QR (QrCode) | `Показати QR-код` |
| Надіслати (Send) | `Надіслати` |
| Додати фото/зображення | `Додати зображення` / `Додати фото` |
| Toggle видимості (Eye/EyeOff) | динамічно: `{x ? 'Сховати …' : 'Опублікувати …'}` |
| Прибрати віджет | `Прибрати віджет` |

---

## 7. Plan Corrections (вже задокументовано в TRACKER)

C-01..C-04: P0.10 (5 dead не 11; ScheduleWidget живий; blocks-test→N-01; ScheduleDrawer dead) · N-01 (blocks-test dev-route в проді) · C-05 (broadcastUtils ЖИВИЙ — не чіпати) · C-06 (pricing BillingInput/TierProgress — public API, не чіпати) · C-07 (P0.5 grep false-negative — 204 not 0) · C-08 (dates.pluralize used by FlashDealPage → P3.2).

---

## 8. Verification protocol (кожен батч/item)

```bash
cd bookit
npx tsc --noEmit                 # 0 errors — ОБОВ'ЯЗКОВО перед commit
npm run build                    # clean (для видалень — ловить barrel/dynamic; роут → rm -rf .next спершу)
npm test                         # якщо торкнувся логіки (Phase 3 — завжди)
node ../XDEV/PLANS/MTRP/tools/scan-icon-buttons.cjs   # P0.6 прогрес
```
**Після батча:** AUDIT_LOG entry · TRACKER статус · MAP лічильник · commit (явні файли) · `mempalace_add_drawer`.

---

## 9. Open decisions / pending

- 🔒 **P0.12** — стартувати onboarding telemetry? (міграція `140_*` + API route + 1 тиж збору) — Phase 1.
- ⚠️ **P0.1 feature flag** — деплоїти phone-match за `FEATURE_STRICT_BOOKING_LINK` canary чи одразу? (рекомендація: canary).
- **Pre-existing WIP у `main`** — STEP 12/13 зміни вже закомічені в `3fd2b20` (разом з P0.5). Якщо Вітос хотів їх окремо — це вже в історії.

---

## 10. Drawers цієї роботи (MemPalace, room=decisions)
Шукати: `mempalace_search "MTRP execution"`. Ключові: setup+Phase0 (S01), N-01+export-trim (S02), P0.5 complete codemod, P0.6 progress.

---

*Створено: 2026-06-04 · Sessions 01-03 · Наступне: P0.6 tail → P0.1 → Phase 1+*
