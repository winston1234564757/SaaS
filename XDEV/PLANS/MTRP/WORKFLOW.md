# 🔁 WORKFLOW.md — Per-Item цикл виконання MTRP

> Один **item** (P0.x / P1.x / P2.x / P3.x) = одна одиниця роботи = (зазвичай) один малий коміт у `main`.
> Великі items (P0.5 «209 кнопок», P1.11 «тести createBooking») розбиваються на під-коміти всередині item.
> Версія: 1.0 · 2026-06-04

---

## ⏱️ Цикл одного item (7 кроків)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PICK     → взяти наступний ⏳ item з TRACKER (за фазою)    │
│ 2. SEARCH   → mempalace_search "[item keywords]"             │
│ 3. VERIFY   → Grep importers / поточний стан коду (НАОСЛІП = ЗАБОРОНЕНО) │
│ 4. FIX      → застосувати зміну (Bulk Edit Protocol якщо 3+ файлів)      │
│ 5. CHECK    → npx tsc --noEmit  +  npm run build (+ test якщо є логіка)  │
│ 6. LOG      → AUDIT_LOG entry + TRACKER статус + MAP resume-pointer       │
│ 7. COMMIT   → малий коміт у main (явні файли, не git add -A)             │
└─────────────────────────────────────────────────────────────┘
        → mempalace_add_drawer (після значущого item / фази)
```

---

## КРОК 3 — VERIFY (критичний, не пропускати)

План MTRP згенеровано сканами і **застаріває**. Перед будь-яким видаленням/фіксом:

| Тип item | Команда верифікації |
|---|---|
| Видалення файлу/експорту | `Grep "import.*<Name>"` → 0 importers? Інакше — НЕ видаляти |
| Видалення root-widget | `Grep "widgets/<Name>\b"` (без theme-папки) → 0 importers? |
| `type="button"` | `Grep "<button"` без `type=` у конкретному файлі |
| `aria-label` | прочитати рядок кнопки — чи справді icon-only |
| Security fix | прочитати **поточний** код функції (не код з плану — він міг змінитись) |

**Розбіжність план↔код → одразу в [TRACKER → Plan Corrections](./TRACKER.md) + AUDIT_LOG.**

---

## КРОК 4 — FIX (Bulk Edit Protocol)

При зміні **3+ файлів** (IRON RULE 5):
```
0. Encoding batch-check (Cyrillic файли): PowerShell grep E28099|E2809C
1. Read ТІЛЬКИ файли що змінюєш (Grep → scope → Read)
2. Write/Edit ВСІ паралельно (один round)
3. tsc + build (один round)
```
- ≥5 змін у файлі → **Write** повну версію. ≤3 рядки з верифікованим контекстом → **Edit**.
- `files_changed == files_read`. Не читати «для контексту».

### Гайки за типом item
- **A11y (`type="button"`, `aria-label`, `aria-pressed`)** — технічні рядки, **humanizer НЕ потрібен**.
- **Будь-який видимий UI-copy** (нові кнопки/повідомлення/empty states) — спершу `/humanizer`.
- **DB-міграції** (P0.1, P0.12, P2.14) — нова нумерована `*.sql`, RLS за замовчуванням, перевірити проти AI_MASTER_GUIDE RLS-секції.
- **Framer** — `mode="popLayout"`, `spring as const`, без емодзі.

---

## КРОК 5 — CHECK (gate перед комітом)

```bash
cd bookit
npx tsc --noEmit                 # 0 errors — ОБОВ'ЯЗКОВО
npm run build                    # clean — для видалень (ловить barrel/dynamic imports)
npm test                         # якщо item торкнувся логіки (Phase 3 — завжди)
npm run test:e2e -- --grep "X"   # для security/booking items
```
**Не комітити, поки tsc ≠ 0.** Видалення коду → build обов'язковий (tsc не ловить runtime-only imports).

---

## КРОК 6 — LOG (3 файли, синхронно)

1. **AUDIT_LOG.md** — новий entry (дата, item, що зроблено, verify-результат, tsc/build, commit, drawer).
2. **TRACKER.md** — статус item → ✅/🔄/🔒 + нотатка.
3. **MAP.md** — оновити resume-pointer («наступна дія») + лічильник прогресу.

> Це **частина** item, не «потім». Item не ✅, поки 3 файли не оновлено.

---

## КРОК 7 — COMMIT (малі коміти в main)

```bash
git add <явні-файли>             # НЕ git add -A (working tree має сторонні зміни)
git commit -m "<type>(<scope>): <опис> (Px.y)

<1-2 речення>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
**Типи:** `feat` `fix` `chore` `refactor` `test` `docs` `perf` `security`
**Префікси scope:** `a11y` `security` `mtrp` `dead-code` `types`

> Working tree наразі брудний (сторонні M/D файли). **Стейджити лише свої файли явним списком.** Ніколи `--amend`, ніколи `--no-verify`.

---

## 🧭 Перехід між фазами

- Фаза вважається завершеною, коли всі її items = ✅ / ➖ / 🔒(з причиною).
- Перед стартом нової фази: оновити MAP.md (Phase N → N+1), `mempalace_add_drawer` з підсумком фази.
- 🔒 items не блокують фазу, якщо мають зафіксовану причину + handoff-нотатку.

---

## 🚨 Anti-patterns

| ❌ ЗАБОРОНЕНО | ✅ ПРАВИЛЬНО |
|---|---|
| Видалити файл «бо план сказав» | Grep importers → 0 → видалити |
| `git add -A` при брудному tree | `git add <явні файли>` |
| ✅ без tsc/build | CHECK перед LOG/COMMIT |
| Закрити сесію без MAP-update | MAP resume-pointer = останній крок завжди |
| Security-fix за кодом з плану | Прочитати поточний код функції |
| Humanizer для aria-label | aria-label/data-testid — технічні, без humanizer |

---

*Версія: 1.0 · 2026-06-04 · Узгоджено з RELEASE/PROTOCOL.md та IRON_RULES.md*
