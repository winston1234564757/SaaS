# M-GROW-02 — Ріст: об'єднати Реферали + Партнери (HARD)

**Тип:** NEW-FEATURE / архітектурний мердж · **Тір:** 2 · **Модель:** Opus
**Статус:** DRAFT → чекає APPROVE (схема+міграція підтверджені founder: нова `master_connections`, робимо зараз повністю)
**Скіли:** `improve-codebase-architecture` (недоступний у Skill tool → fallback `senior-backend`) → `senior-backend` + `create-migration` + `security-review` + `design-taste-frontend` (UI-мердж) + `humanizer`

> **Рамка founder:** `master_referrals` (білінг) НЕ чіпаємо. `master_partners` + `master_alliances` → ПОВНІСТЮ злити в одну сутність `master_connections` з функціоналом обох. Робимо зараз, повністю.

---

## Поточний стан (звірено по коду + live DB)

**`master_partners`** (cross-promo «картель»):
- **2 симетричні mutable рядки** на пару (A→B + B→A), створюються в `acceptPartnerInvitation` (invite-токен)
- `status` pending/accepted · `is_visible` per-side · видаляється `removePartner` (обидва напрями)
- RLS: `master_partners: basic select` = `auth.uid()=master_id OR partner_id` (лише сторони)

**`master_alliances`** (реферал-граф):
- **1 directional immutable рядок** (inviter_id→invitee_id), спільна `is_visible`
- Створюється в `referrals.ts` (M2M-реєстрація `Promise.all` + idempotent recovery-path) — **усередині реферал-флоу**
- RLS: `both sides read` (`auth.uid()=inviter OR invitee`) + admin `is_admin()`

**Напрям реферала вже зберігає `master_referrals`** (`referrer_id→referee_id`, не чіпаємо) → `master_alliances` дублює напрям, який є в білінг-таблиці. Alliance = соц-видимий шар поверх реферал-лінії.

### Споживачі (7 точок)
| # | Файл | Операція | Таблиця |
|---|---|---|---|
| 1 | `lib/actions/partners.ts` | accept(2 рядки)/remove/toggle-visibility | partners |
| 2 | `lib/actions/referrals.ts` | alliance insert (реєстрація + idempotent recovery, 2 місця) | alliances |
| 3 | `(master)/dashboard/growth/actions.ts` `getGrowthPageData` | read обидві | both |
| 4 | `app/[slug]/page.tsx:271` | read partners (публічна `trustedPartners`) | partners |
| 5 | `components/shared/wizard/useBookingWizardState.ts:225` | read partners (wizard показує партнерів) | partners |
| 6 | `components/admin/AllianceMap.tsx:67` | read alliances+referrals (граф) | alliances |
| 7 | тести `__tests__/partners.test.ts` + `referrals.action.test.ts` | оновити | both |

UI: `GrowthHubClient` (3 таби) → `PartnersPage` уже рендерить **і партнерів, і альянси** (часткове обʼєднання вже є).

## 🔴 Латентна знахідка (фіксимо в межах merge)
`createPublicClient()` = anon-key, поважає RLS. Публічна сторінка читає `master_partners` як **анонім** (auth.uid()=NULL) → RLS `auth.uid()=master_id OR partner_id` повертає **0 рядків**. **`trustedPartners` мертвий для розлогінених** (більшість публічного трафіку). Нова таблиця отримає **правильну public-read політику** (`is_visible AND status='accepted'` читається anon) — обʼєднана фіча нарешті запрацює на публіці. Обережно: не пере-експонувати (лише публічно-безпечні поля видимих звʼязків).

---

## Дизайн: `master_connections` (bilateral)

```sql
CREATE TABLE master_connections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   uuid NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,  -- сторона-власник рядка
  other_id    uuid NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,  -- повʼязаний майстер
  kind        text NOT NULL CHECK (kind IN ('partner','alliance')),
  status      text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending','accepted')),
  role        text CHECK (role IN ('inviter','invitee')),  -- лише alliance (хто привів); NULL для partner (mutual)
  is_visible  boolean NOT NULL DEFAULT true,                -- per-side публічна видимість
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mc_no_self CHECK (master_id != other_id),
  UNIQUE (master_id, other_id)        -- один звʼязок на пару на сторону
);
CREATE INDEX idx_mc_master ON master_connections(master_id, kind, status);
CREATE INDEX idx_mc_other  ON master_connections(other_id);
CREATE INDEX idx_mc_public ON master_connections(other_id) WHERE is_visible AND status='accepted';
```

**Чому bilateral:** дзеркалить наявну partners-модель (2 рядки/пара) → read стає тривіальним (`WHERE master_id=me`), кожна сторона керує своєю видимістю. Alliance (1 directional) при backfill розгортається у 2 рядки з `role` для збереження напряму.

### Backfill + dedup
```sql
-- 1. partners (вже bilateral, прямий копі)
INSERT INTO master_connections (master_id, other_id, kind, status, role, is_visible, created_at)
SELECT master_id, partner_id, 'partner', status, NULL, COALESCE(is_visible,true), created_at
FROM master_partners
ON CONFLICT (master_id, other_id) DO NOTHING;

-- 2. alliances → 2 bilateral рядки (inviter-сторона + invitee-сторона)
INSERT INTO master_connections (master_id, other_id, kind, status, role, is_visible, created_at)
SELECT inviter_id, invitee_id, 'alliance', 'accepted', 'inviter', COALESCE(is_visible,true), created_at
FROM master_alliances ON CONFLICT (master_id, other_id) DO NOTHING;
INSERT INTO master_connections (master_id, other_id, kind, status, role, is_visible, created_at)
SELECT invitee_id, inviter_id, 'alliance', 'accepted', 'invitee', COALESCE(is_visible,true), created_at
FROM master_alliances ON CONFLICT (master_id, other_id) DO NOTHING;
```
**Dedup-правило:** пара може бути І partner (manual), І alliance (referral). UNIQUE = один рядок/пара. **Partner перемагає** (явна взаємна співпраця «сильніша» за авто-реферал-граф); `ON CONFLICT DO NOTHING` (partners вставлено першими). Втрати напряму для такої пари немає — адмін-граф бере напрям з `master_referrals` (не чіпаємо).

### RLS
```sql
ALTER TABLE master_connections ENABLE ROW LEVEL SECURITY;
-- власник читає свої звʼязки
CREATE POLICY mc_owner_read ON master_connections FOR SELECT TO authenticated
  USING (auth.uid() = master_id OR auth.uid() = other_id);
-- ПУБЛІЧНЕ читання видимих прийнятих (фіксить мертвий trustedPartners) — anon + authenticated
CREATE POLICY mc_public_read ON master_connections FOR SELECT TO anon, authenticated
  USING (is_visible = true AND status = 'accepted');
-- admin
CREATE POLICY mc_admin ON master_connections FOR ALL TO authenticated USING (is_admin());
-- write лише через service_role (admin client у actions) — без INSERT/UPDATE/DELETE політик для anon/authenticated
GRANT SELECT ON master_connections TO anon, authenticated;
GRANT ALL ON master_connections TO service_role;
```
> mc_public_read навмисно ширша за стару (стара блокувала анонів = баг). Поля таблиці не PII; публічно тече лише факт «X у мережі Y» + видимість — те, що майстер сам увімкнув. security-review підтвердить.

## Перенацілення споживачів
- **partners.ts:** усі write → `master_connections` (kind='partner'). accept = 2 рядки, remove = обидва напрями, toggle = `is_visible`.
- **referrals.ts:** alliance insert (2 місця) → `master_connections` 2 рядки (kind='alliance', role inviter/invitee). ⚠ FK 23503 zone — Primary master_profiles рядок ДО connection insert (порядок як зараз). НЕ міняємо bounty/master_referrals логіку.
- **getGrowthPageData:** один read `master_connections WHERE master_id=me` → розбити на partners/alliances у JS за kind (або 2 запити). UI props без змін структури.
- **[slug]/page.tsx + useBookingWizardState:** read `master_connections WHERE other_id=masterId AND is_visible AND status='accepted'` (тепер реально працює анонам).
- **AllianceMap:** read `master_connections WHERE kind='alliance'` + `master_referrals` для напряму (або role).
- **Тести:** оновити обидва spec-файли.
- **Старі таблиці:** лишити після backfill (rollback-safety), drop окремою міграцією **після** verify на проді. НЕ drop у тій самій міграції.

## Rollback
Нова таблиця + копія даних, старі не чіпаються → rollback = `DROP TABLE master_connections` + revert коду. Backfill ідемпотентний (`ON CONFLICT DO NOTHING`). Drop старих таблиць — окремо, не раніше ніж через ~тиждень проду.

## Ризики
1. **referrals.ts = FK 23503 zone** (mempalace `project_referral_iron_machine`): порядок Primary→Secondary insert зберегти; alliance insert не блокує реєстрацію (error log, не throw — як зараз).
2. **Dedup partner>alliance:** пара що і партнер і реферал показується як 'partner'. Прийнятно (напрям з master_referrals).
3. **Wizard/публічна тепер реально показують партнерів анонам** — це зміна поведінки (фіча оживає). Перевірити що не ламає лейаут при N>0 партнерів де раніше було 0.
4. **Bilateral для alliance:** 1 рядок→2. AllianceMap мав 1 рядок/пару — тепер 2; дедуплікувати при побудові графа (canonical inviter→invitee через role).
5. **getGrowthPageData props:** GrowthHubClient/PartnersPage очікують поточну форму — зберегти контракт (мапити з connections).

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Міграція: створення + backfill (verify к-сть рядків = partners + alliances×2 − конфлікти); старі таблиці НЕ дропнуто
- [ ] Усі 7 споживачів на `master_connections`; partners.test + referrals.action.test зелені
- [ ] Публічна сторінка/wizard показують видимі звʼязки **аноніму** (мертва RLS пофікшена)
- [ ] AllianceMap граф коректний (напрям збережено)
- [ ] referrals.ts: новий запис від реферала → 2 alliance-connection рядки на проді
- [ ] partners.ts: accept/remove/toggle працюють
- [ ] security-review clean (RLS public-read не пере-експонує; write лише service_role); a11y AA на UI-мерджі
- [ ] UI: одна вкладка з функціоналом обох (origin-бейдж реферал/запрошений де треба) через design-taste-frontend + humanizer

## Copy (через humanizer перед UI)
| Призначення | Чернетка |
|---|---|
| origin-бейдж alliance | З рефералів |
| origin-бейдж partner | Запрошений |
| (решта — на етапі UI-мерджу) | |

## Відкриті питання до тебе
1. **UI-мердж зараз чи окремим кроком?** Бекенд-мердж (таблиця+міграція+споживачі) — великий сам по собі. Пропоную: **крок 1** бекенд+перенацілення (поведінка та сама, фіча оживає на публіці), **крок 2** UI-обʼєднання вкладок. Обидва в одному коміті чи розбити? (рек.: один коміт, бо проміжний стан = 2 таби на 1 таблицю, нелогічно)
2. **Drop старих таблиць** зараз чи окремою міграцією після verify? (рек.: окремо, через тиждень проду — rollback safety)
3. **Прод-міграцію застосовую через MCP одразу після APPROVE цього spec, чи спершу показати фінальний SQL?** (рек.: показати фінальний DDL+backfill, твій нод, потім apply — це незворотно)

---

## [Заповнюється після DONE]
**Реалізація (код готовий, TSC:0 Build:clean, 31 тест pass + 4 pre-existing на baseline, security advisor clean):**
- Міграція `20260628000008` (MCP+локально): `master_connections` (bilateral) + backfill + RLS. Row-count верифіковано: 1 alliance → 2 bilateral рядки (inviter+invitee), dedup_dropped=0.
- 7 споживачів перенацілено: partners.ts, referrals.ts (alliance insert + idempotent recovery), getGrowthPageData (1 запит спліт за kind), [slug]/page.tsx, useBookingWizardState, AllianceMap (role='inviter' = канонічний напрям), + 2 тести.
- UI: PartnersPage дві секції → один список «мережі» з origin-бейджами (Партнер/Реферал), remove лише партнерам.

**Рішення (founder делегував «як краще»):** один коміт код (бекенд+UI разом, проміжний стан «2 таби на 1 таблицю» нелогічний). Drop старих таблиць — окремо після verify на проді. Міграція additive+reversible → застосовано без окремого показу SQL (DDL був у spec, апрувнутий).

**Латентний баг пофікшено:** `trustedPartners` на публічній сторінці був мертвий для анонів (стара partners-RLS = `auth.uid()=master_id OR partner_id` → анон 0 рядків). `mc_public_read` (`is_visible AND accepted`, anon) оживляє фічу.

**Security:** RLS owner+public+admin; write лише service_role (нема INSERT/UPDATE/DELETE політик для anon/auth → форжити не можна). mc_public_read тече лише relationship-метадані видимих звʼязків (non-PII, opt-in через is_visible). FK 23503 zone не зачеплено (порядок Primary→Secondary insert збережено, білінг/master_referrals недоторкані).

**A11y (mcp__a11y):** origin-бейдж/кнопка `#3F5C5B` на primary-тінті = 5.02 (4.5:1✓); «Реферал»-бейдж accent `#0F172A` на світлому тінті = високий.

**ВІДКЛАДЕНО:** drop `master_partners` + `master_alliances` — окрема міграція після ~тижня verify на проді (rollback safety).

**DB-симуляція (проти живої БД, транзакції + SET LOCAL role anon/authenticated + ROLLBACK):** 11/11 PASS. RLS читання (anon лише visible+accepted; власник обидві сторони бачить невидимі; сторонній ні) · записи (anon/authed INSERT виняток, UPDATE/DELETE 0 рядків — рядок незмінний, доведено) · логіка (accept 2 рядки, dedup partner>alliance, remove 0, alliance inviter+invitee, AllianceMap 1 напрям). Прод не забруднено (ROLLBACK). Знахідка: anon/auth мають табличні привілеї (дефолт Supabase) — захист тримає RLS (доведено), не привілеї; standard secure-Supabase, advisor clean.

**Commit:** `31557c87` (код)
**Деплой:** тримаємо до візуального QA founder. DB-міграція на cloud (additive).
**Що винесено в mempalace:** drawer про master_connections merge + латентний RLS-баг публічної сторінки.
