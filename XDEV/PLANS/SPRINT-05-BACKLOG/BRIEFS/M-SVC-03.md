# M-SVC-03 — Послуги: режим «картка товару» (опис + відгуки) для клієнта + прев'ю майстра

**Статус:** DONE · commit `e2973465` (очікує візуального QA founder)
**Тип:** NEW-FEATURE + DATA (гібрид) · **Тір:** 2 · **Модель:** Opus
**Скіли:** `spec-driven-workflow` → `create-migration` → impl → `adversarial-reviewer` + `security-review` → `ship-gate`

---

## Рішення founder (QA 4/4)

1. **Відкриття картки = окрема кнопка «Детальніше»** на картці послуги. Тап по картці = вибір (toggle) лишається. Деталь відкривається у Sheet.
2. **Відгуки прив'язуємо до конкретної послуги через БД.**
3. **Майстер теж отримує цей режим** — read-only прев'ю «як бачить клієнт» (з сітки/списку M-SVC-02).
4. **Порожній опис:** клієнту — грацій­но ховати блок; майстру (в його прев'ю) — м'який нудж «додайте опис».

---

## Контекст з коду (факти, що формують спек)

- `Service` має: `name, icon_name, category, price, duration, popular, active, description?` (один опц. текст), `imageUrl?` (одне фото). **Галереї немає.**
- Клієнт обирає послуги в `ServiceSelector` → `CategoryCarousel`-картках (`components/shared/wizard/`). Картка зараз: фото/іконка-fallback, назва, тривалість, ціна, бейдж «популярне», чекмарк вибору. Опису/відгуків немає.
- `WizardService` (тип) уже має `description` + `image_url` — дані доходять до картки, просто не показуються.
- **Відгуки НЕ прив'язані до послуги.** `reviews(id, rating, comment, client_name, is_published, created_at, booking_id, master_id)`. Жодного `service_id`.
- **`bookings.service_id`/`service_name` НЕ заповнюються** в `createBooking` (legacy-стовпці). Єдине джерело послуг запису — join `booking_services(booking_id, service_id, service_name, service_price, duration_minutes)`.
- ⇒ Єдиний коректний шлях «відгук → послуга»: `reviews.booking_id → booking_services.service_id`.
- Публічне читання `reviews where is_published=true` через RLS вже працює (`app/[slug]/page.tsx`).

### ⚠ Ключовий флаг (для founder) — багатопослуговий запис
Відгук належить **запису (візиту)**, не окремій послузі. Запис може містити кілька послуг. Тож відгук візиту «Манікюр + Педикюр» з'явиться **під обома** послугами. Це чесне трактування (клієнт оцінив візит, що включав цю послугу), але це НЕ «відгук саме про манікюр». Денормалізований стовпець `reviews.service_id` цього не вирішує (його все одно довелось би виводити з `booking_services`, де послуг кілька), тільки додав би backfill-ризик. **Тому: derivation через RPC, без зміни схеми reviews.**

---

## Spec: Service Detail Card (M-SVC-03)

**Goal:** Клієнт під час онлайн-запису може відкрити детальну картку будь-якої послуги (повний опис, фото, рейтинг+відгуки саме по цій послузі) і звідти обрати її; майстер бачить ту саму картку як read-only прев'ю.

**Inputs:**
- Клієнт тапає «Детальніше» на картці послуги у `ServiceSelector` → відкривається `ServiceDetailSheet` для `service.id`.
- Майстер тапає прев'ю-тригер на картці у `ServicesPage` (grid/list) → той самий Sheet у режимі `master` (read-only, без CTA «Обрати», з нуджем якщо опис порожній).

**Outputs:**
- UI: bottom Sheet (vaul) з контентом картки. Жодних мутацій БД при перегляді.
- Нова БД-функція (RPC) `get_service_reviews(p_service_id uuid)` → `{ rating, comment, client_name, created_at }[]` + агрегати (avg, count) для published-відгуків записів, що містили цю послугу.
- Вибір послуги з Sheet (client) → той самий `onToggle(service)`, що й тап картки (нуль нової мутаційної логіки).

**Acceptance Criteria:**
- [ ] Given картка послуги в `ServiceSelector`, when клієнт тапає «Детальніше», then відкривається Sheet з фото/іконкою-hero, назвою, категорією, тривалістю, ціною, повним описом, блоком відгуків. Тап по тілу картки (не по кнопці) досі тоглить вибір.
- [ ] Given послуга має published-відгуки (через `booking_services`), when відкрито Sheet, then показано середній рейтинг по послузі + кількість + список відгуків (rating, коментар, ім'я, дата).
- [ ] Given послуга без відгуків, when відкрито Sheet, then блок відгуків показує порожній стан (клієнту — нейтральний; без «битого» вигляду).
- [ ] Given послуга без опису, when клієнт відкриває Sheet, then блок опису просто відсутній (без порожнечі).
- [ ] Given послуга без опису, when **майстер** відкриває прев'ю, then показано м'який нудж «додати опис».
- [ ] Given Sheet відкрито в `client` mode, when клієнт тисне CTA «Обрати», then послуга додається у вибір і Sheet закривається (або CTA стає «Прибрати»); стан синхронний з чекмарком на картці.
- [ ] Given Sheet відкрито в `master` mode, then CTA «Обрати» відсутній (read-only прев'ю).
- [ ] RPC `get_service_reviews` повертає ТІЛЬКИ `is_published=true` відгуки; доступний анонімному (public) клієнту; не тече службових полів (без booking_id/client_id/master_notes).
- [ ] a11y: «Детальніше»/прев'ю-тригер = `<button>` з `aria-label`, ≥44px; Sheet закривається свайпом/Esc; зірки рейтингу мають текстовий еквівалент.
- [ ] TSC 0 · build clean · міграція застосована · security-review пройдено.

**Edge Cases:**
- Багатопослуговий запис → відгук під кожною послугою (див. флаг вище; задокументовано, прийнято).
- Прихований/неопублікований відгук → не потрапляє у RPC.
- Послуга видалена після відгуку (`booking_services.service_id` ON DELETE SET NULL?) → відгук просто не матчиться, не падає.
- Дуже довгий опис → скрол усередині Sheet, не ламає висоту.
- Немає фото → hero = Frost-градієнт + `ServiceIcon` (як у M-SVC-02), не плейсхолдер.
- Anon RLS: RPC `SECURITY DEFINER` з явним `is_published` фільтром + `search_path` pinned (правило безпеки проєкту).

**Out of Scope:**
- Зміна схеми `reviews` (денормалізація `service_id`) — не робимо.
- Збір відгуків саме «по послузі» при сабміті (клієнт оцінює візит) — не змінюємо флоу сабміту.
- Галерея кількох фото послуги — поля немає, поза скоупом.
- Магазин/товари (`M-SHOP-03` — окрема дзеркальна задача).
- Редагування опису з прев'ю майстра (нудж лише веде в редактор послуги, що вже існує).

---

## Файли (план)

- **Міграція:** `supabase/migrations/NNN_get_service_reviews.sql` — RPC `get_service_reviews(uuid)` SECURITY DEFINER, grant до `anon, authenticated`, pinned `search_path`.
- **NEW** `components/shared/wizard/ServiceDetailSheet.tsx` — спільний Sheet (vaul), проп `mode: 'client'|'master'`, `onSelect?`, `isSelected`. Hero + опис + reviews-блок.
- **NEW** `lib/supabase/hooks/useServiceReviews.ts` — TanStack Query хук, що кличе RPC (enabled при відкритті Sheet).
- `components/shared/wizard/ServiceSelector.tsx` — кнопка «Детальніше» на картці + state відкритого Sheet.
- `components/master/services/ServiceCard.tsx` + `ServicesPage.tsx` — прев'ю-тригер → той самий Sheet у `master` mode.

## Ризики
- RLS/безпека RPC — головний ризик (тому `security-review` обов'язковий).
- Не зламати тап=вибір на картці клієнта (кнопка «Детальніше» має `stopPropagation`).
- Не зламати DnD/toggle майстра при додаванні прев'ю-тригера (M-SVC-02 щойно стабілізовано).
- Context-ціна: Sheet — спільний компонент клієнт+майстер, без дублювання.

## UI-копія (через humanizer — нижче в чаті)
- «Детальніше» · «Обрати» / «Обрати · {ціна}» · «Прибрати»
- Заголовок відгуків · порожній стан відгуків · нудж порожнього опису (майстер) · банер прев'ю майстра
