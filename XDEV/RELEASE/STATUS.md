# 📊 STATUS.md — Live Release Tracker

> Оновлюється після кожного значущого зрушення. Live джерело правди про прогрес.
> **Updated:** 2026-05-27
> **Active step:** STEP 01 (`/` Landing)
> **Progress:** 0 / 13 complete
> **Model in use:** 🟢 Sonnet 4.6 high

---

## 🗺️ Загальний прогрес

```
[░░░░░░░░░░░░░] 0% (0/13)

Step 01: ⏳ In progress
Steps 02-13: 🔒 Blocked (sequential)
```

---

## 📋 Зведена таблиця 13 кроків

| # | Сторінка | Модель | Статус | Started | Ready | Drawer ID | Commit |
|---|---|---|---|---|---|---|---|
| 01 | `/` Landing | 🟢 Sonnet 4.6 high | ⏳ **In progress** | 2026-05-27 | — | — | — |
| 02 | Auth (`/login`, `/register`, `/callback`) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 03 | Onboarding (`/onboarding`) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 04 | Dashboard Home (`/dashboard`) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 05 | Bookings (`/dashboard/bookings`) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 06 | CRM Clients (`/dashboard/clients`) | 🟡 Mixed | 🔒 Blocked | — | — | — | — |
| 07 | Services + Products | 🟢 Sonnet 4.6 high | 🔒 Blocked | — | — | — | — |
| 08a | Revenue Hub (Flash + Pricing) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 08b | Growth Hub (Loyalty + Referral + Partners) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 08c | Marketing + Billing + Settings + Studio | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 09 | Explore (`/explore`) | 🟢 Sonnet 4.6 high | 🔒 Blocked | — | — | — | — |
| 10 | Public Master Page (`/[slug]`) | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 11 | Shop + Portfolio | 🔴 Opus 4.7 max | 🔒 Blocked | — | — | — | — |
| 12 | Client Portal (`/my/*`) | 🟢 Sonnet 4.6 high | 🔒 Blocked | — | — | — | — |
| 13 | Legal/Offline/`/r/[code]` | 🟡 Mixed | 🔒 Blocked | — | — | — | — |

> **Примітка:** Крок 8 розбито на 3 чати (08a/08b/08c) через об'єм. Кожен має власний playbook.

---

## 🎯 ACTIVE STEP — детальний стан

### STEP 01 — Головний Лендинг (`/`)
- **Playbook:** [STEPS/STEP_01_landing.md](./STEPS/STEP_01_landing.md)
- **Модель:** 🟢 Sonnet 4.6 high
- **Статус:** ⏳ In progress
- **Scope summary:** Повний редизайн лендингу
- **Estimated effort:** TBD

#### 7 Quality Gate progress
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ⏳ Не почато |
| 2. No-Emoji Policy | ⏳ Не почато |
| 3. Motion & Transitions | ⏳ Не почато |
| 4. Errors & Validation | ⏳ Не почато |
| 5. A11y & Performance | ⏳ Не почато |
| 6. Core Features | ⏳ Не почато |
| 7. Tests Verification | ⏳ Не почато |

#### HANDOFF for STEP 02
*Буде заповнено при close-out STEP 01*

---

## 🧭 Legend (статуси)

| Статус | Означає |
|---|---|
| ⏳ **In progress** | Активна робота |
| ✅ **Complete** | Усі 7 вимірів пройдено, doc synced, drawer створено |
| 🔒 **Blocked (sequential)** | Чекає завершення попереднього кроку |
| 🔒 **Blocked (external)** | Чекає зовнішньої дії (e.g., env var, Vercel Pro) |
| ⚠️ **Needs revision** | Виявлено issues, повернення на цей крок |
| 🔄 **In review** | Готово до QA, чекає вердикту користувача |

---

## 📝 Активні issues (cross-step)

| # | Issue | Виявлено в кроці | Блокує | Status |
|---|---|---|---|---|
| — | Vercel Pro upgrade pending — впливає на cron `check-uncompleted` | (з MEMORY.md) | STEP 04, STEP 05 | 🔒 External |
| — | Studio WeeklyChart: BarTooltip click → day detail | Theme Polish Sprint (closed) | STEP 04 (carry-over) | ⏳ Pending |
| — | Frost WeeklyChart: tooltip rounded-[4px] | Theme Polish Sprint (closed) | STEP 04 (carry-over) | ⏳ Pending |
| — | Blossom: global font/contrast widget headers | Theme Polish Sprint (closed) | STEP 04 (carry-over) | ⏳ Pending |

---

## 🔄 Рішення про переходи

Тільки `STEP NN COMPLETE` дозволяє переходити до STEP NN+1.

**Виключення:**
- 🔒 Blocked (external) дозволяє почати NN+1 в окремому чаті, якщо немає коду-залежності
- ⚠️ Needs revision не дозволяє жодного переходу — фікс у тому ж чаті або новому з тим самим Step ID

---

## 📞 Швидкі посилання

- [README.md](./README.md) — правила, моделі, налаштування
- [PROTOCOL.md](./PROTOCOL.md) — workflow одного чату
- [CHANGELOG.md](./CHANGELOG.md) — журнал готових кроків
- [STEPS/](./STEPS/) — детальні playbooks
- [../MAPS/PAGE_RELEASE_ROADMAP.md](../MAPS/PAGE_RELEASE_ROADMAP.md) — sourсе of truth для scope

---

*Останнє оновлення цього файлу: 2026-05-27 (створення)*
