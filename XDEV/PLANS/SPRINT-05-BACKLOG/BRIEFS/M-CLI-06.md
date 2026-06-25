# BRIEF: M-CLI-06 — Сторінка клієнта (деталі) у CRM: глибокий редизайн

**Статус:** ✅ DONE — commit `1f05146a` · deploy READY · 2026-06-25. TSC 0 · Build clean · encoding fixed (30 латинських i) · humanizer · security self-review. Деталі результату — `HANDOFF.md` секція M-CLI-06.
**Тип:** REDESIGN (profile-card) + DATA (реальний LTV) + NEW-FEATURE (збереження тегів) → **Tier 2**
**Ціль-файл:** `src/components/master/clients/ClientDetailSheet.tsx` (~458 рядків) + 1 server-action + 1 lightweight hook
**Скіли:** `design-taste-frontend` + `impeccable` (форма) · `senior-frontend` (tag-persist) · `humanizer` (весь UA-копірайт)
**Формат:** лишається adaptive `Sheet` (vaul bottom моб / dialog десктоп). Окремого route немає; `C-CLI-01` — то інша задача (клієнтська зона). Архітектуру не міняємо.

---

## ⚠ РОЗШИРЕННЯ СКОУПУ (директива founder): «для всіх викликів профілю на всіх сторінках»

**Покриття точок виклику (факт із grep):**
- `ClientDetailSheet` — **вже спільний**. Рендериться у 6 місцях з ідентичними пропами `{client, onClose}`: `ClientsPage`, `dashboard frost/blossom/studio InsightsRow`, `dashboard StatsModals`, `AnalyticsPage`. → **Редизайн самого `ClientDetailSheet` автоматично покриває клієнтів + дашборд (усі 3 теми) + аналітику.** Нуль додаткової роботи на цих 5 точках.
- `BookingDetailsModal.tsx` (записи) — **ДУБЛЬ**. Має власний інлайн «Identity Header (Matching ClientDetailSheet style)» (р.441) + міні-блок «Профіль клієнта» з 3 метриками visits/revenue/avg (р.500–522). НЕ юзає спільний компонент. Це і є «на записах є таке».

**Підхід — DRY через екстракцію (як `statusGlow` у M-CLI-05):**
- Винести **`ClientIdentityHeader`** (аватар + ім'я + статус-піл + телефон + ambassador) і **`ClientStatChips`** (4 метрики) у спільні під-компоненти (тека `clients/`).
- `ClientDetailSheet` споживає їх угорі.
- `BookingDetailsModal` замінює свій інлайн-дубль identity + «Профіль клієнта» на ті самі під-компоненти → візуально ідентично скрізь, один код.
- **Межа:** у `BookingDetailsModal` лишається лише identity + stat-chips (контекст = запис). Багаті секції повного профілю (LTV-віджет, vibe-теги, нотатки, здоров'я, історія) — ТІЛЬКИ у `ClientDetailSheet`; пхати їх у booking-модалку було б неправильно.

**Файли +:** `clients/ClientIdentityHeader.tsx` (новий), `clients/ClientStatChips.tsx` (новий), `BookingDetailsModal.tsx` (заміна дубля).

---

## Рішення founder (AskUserQuestion 2026-06-25)
1. **Напрям = Профіль-картка** (relationship-first).
2. **LTV-віджет → зробити справжнім** (реальна формула + реальний прогрес).
3. **Vibe-мітки → зробити справжніми** (зберігати в БД + редагування).

---

## Поточний стан (root critique)
- **2 фейкові віджети:** «Прогноз доходу» = `average_check × 10` + хардкод бар `w-[70%]` «Високий потенціал»; «Vibe-мітки» = локальний `useState`, ніколи не зберігаються, кнопка «+» мертва.
- **Дрейф від M-CLI-05:** блоки на старому `bg-secondary/60 + border`, аватар має `3px solid` retention-кільце (його прибрали з карток у M-CLI-05). Не консистентно з картками.
- **Англійські заголовки:** «Safety & Health», «Ambassador», «VIP Ambassador».
- **Підозра на encoding:** «Вiзитiв/клiєнта/Зберiгаємо» (латинська `i`?) — batch-check перед Write.
- Retention-статус ніде не показаний як піл — `RETENTION_CONFIG` юзається лише для кольору кільця.

---

## Доступні дані (факт, не припущення)
`ClientRow`: `total_visits, total_spent, average_check, last_visit_at, last_service_name, is_vip, relation_id, retention_status, health_notes, medical_notes`.
**Немає:** `first_visit_at`/`created_at`, `tags[]` (колонка в БД є, але RPC `get_master_clients` її не повертає і UI її не читає → колізій із сегментами немає).
`useClientBookings` → лише останні **5** записів.

---

## План реалізації

### A. Структура (профіль-картка, порядок зверху вниз)
1. **Identity** — аватар (без кольорового кільця, як у M-CLI-05) + ім'я + VIP-піл + **retention-статус піл** (`RETENTION_CONFIG`) + телефон (`tel:`) + ambassador-бейдж. Тіло = `bento-card` + `statusGlow(retention.color)` (переюз M-CLI-05/M-BOOK-01).
2. **Стата (компактна, 4 чіпи)** — Візити · Витрачено · Сер. чек · **Останній візит** (`last_visit_at` → `timeAgo`/`formatDate`). Зараз 3 — додаю «останній візит».
3. **Цінність клієнта** (екс-LTV, реальна — див. B).
4. **Історія записів** — як є (останні 5), на `bento`-стилі.
5. **Vibe-мітки** (реальні — див. C).
6. **Нотатки + Здоров'я** — об'єднати візуально, прибрати англ. «Safety & Health» → «Безпека та здоров'я». Логіку автозбереження не чіпати.
7. **Дії** — нагадати про запис (at_risk/lost) · VIP toggle · архівувати (2-step). Лишити; accent лише на головному (тут — без accent-CTA, дії семантичні).

### B. Реальний LTV — БЕЗ міграції
Заміна фейку `avg×10`:
- **Головне число = `total_spent`** (реально принесено за весь час). Лейбл «Принесла за весь час» / «Цінність».
- **Прогрес-бар = ранг vs топ-клієнт** майстра: `total_spent / max(total_spent усіх клієнтів)`. Дані вже є — `ClientsPage` тримає весь список; прокинути `maxSpent` пропом у Sheet. Підпис: позиція/частка, не вигадане «Високий потенціал».
- **Вторинний сигнал = каденс** з останніх ≤5 записів (`useClientBookings`): середній розрив між візитами → «≈ раз на N тижнів», лейбл «за останніми візитами». Якщо <2 записів — ховаємо рядок.
- ⚠ **Чесне обмеження:** справжній *forward 12-міс прогноз* потребує `first_visit_at` → це розширення RPC `get_master_clients` (міграція + `security-review`). **Не роблю** в цій задачі без окремого ОК — realized LTV + ранг + каденс уже чесні й достатні. Якщо founder хоче forward-прогноз — окремий DATA-підтаск.

### C. Реальні Vibe-мітки — additive міграція (ВИПРАВЛЕНО: tags[] не існує)
⚠ **Поправка до брифа:** перевірка живої БД — колонки `tags[]` НЕМАЄ (SYSTEM_MAP хибний). Є лише `client_tag text` (одиночний, мертвий — ніде в коді) + `created_at`. Founder ОК на additive-міграцію.
- **Міграція:** `alter table client_master_relations add column if not exists vibe_tags text[] not null default '{}'`. RLS успадковується (row-level, наявні політики покривають). Rollback = drop column.
- **Новий server-action `saveClientTags(relationId, tags: string[])`** у `clients/actions.ts` → `update client_master_relations.vibe_tags` (ownership по `master_id`, як інші actions).
- **Читання назад:** lightweight-хук `useClientTags(relationId)` — точковий select `vibe_tags` по `relation_id` (НЕ розширюю важкий `get_master_clients` RPC → не чіпаю security-surface). Інвалідація після save.
- SYSTEM_MAP оновити: прибрати хибний `tags[]`, додати `vibe_tags text[]`.
- **UI:** чіпи з пресету (наявні 7 «Тихий клієнт…») toggle + «+ Додати мітку» = інлайн-інпут (вільний текст). Debounce-save 1с (як нотатки). `relation_id === null` → блок disabled із підказкою (як VIP).
- **Скоуп-чесність:** це NEW-FEATURE приріст, founder підтвердив. `security-review` на новий action.

### D. Консистентність (роблю в будь-якому разі)
- Усі блоки → `bento-card` + Frost-токени; прибрати `3px` кільце аватара.
- Усі англ. заголовки → UA через `humanizer`.
- Encoding batch-check (PowerShell grep mojibake) перед Write; писати коректну кирилицю.

---

## Файли
| Файл | Зміна |
|------|-------|
| `ClientDetailSheet.tsx` | повний редизайн (Write — >5 змін) |
| `clients/actions.ts` | +`saveClientTags` |
| `hooks/useClientTags.ts` | НОВИЙ lightweight-хук |
| `ClientsPage.tsx` | прокинути `maxSpent` проп у Sheet |

## Ризики
- `tags[]` нібито вільна — **double-check** RPC/тригери перед записом (grep по migrations на `tags`).
- `maxSpent` проп: не зламати мемоізацію `ClientsPage`.
- Sheet-висота на моб + клавіатура (інпут тегів/нотаток) — `dvh` правило (M-SHOP-04).

## Acceptance
- [ ] Жодних фейкових даних (LTV реальний, теги зберігаються між відкриттями).
- [ ] Візуально консистентно з картками M-CLI-05 (bento + glow, без кільця).
- [ ] Суцільна UA-копія (humanizer).
- [ ] `relation_id===null` коректно деградує (VIP+теги disabled).
- [ ] TSC 0 · Build clean · encoding clean · `security-review` на action.
