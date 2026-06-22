# BRIEF · M-SVC-01 — Послуги: статистика по послузі

**Статус:** DONE · commit `028e6820`
**Тип:** DATA + дрібний display (НЕ backend bugfix — див. нижче) · **Тір:** 1
**Заявлена модель:** Opus (за "причина невідома"). Фактично root cause тривіальний → робота рівня **Sonnet**.

---

## ⚠ Контртеза до опису задачі

Беклог стверджує: *"аналітика по послугах **не передається на бекенд**, зламаний пайплайн"*. Це **неправда**. Бекенд-пайплайн цілий:

- `createBooking.ts:559-567` пише `booking_services` з `service_id`, `service_name`, `service_price`, `duration_minutes`.
- БД: **394 рядки** в `booking_services`, з них **0** з `service_id = NULL`. Дані записуються коректно end-to-end.

**Справжній root cause** — read/display side, не backend:
`ServiceEditor.tsx:573-576` — блок "статистики" це **захардкоджений статичний плейсхолдер**:
```tsx
<div className="...border-dashed...">
  <p>Статистика з'явиться після перших записів</p>
</div>
```
Він рендериться **завжди** для будь-якої збереженої послуги, незалежно від кількості записів. Жодного запиту до даних немає. Тобто статистику ніколи не підключали — це не "зламано", це **не реалізовано**.

Наслідок: скіл змінюється з `diagnose → senior-backend` (важка діагностика зламаного пайплайну) на **build read-query + display**. Діагностику вже зроблено (цей розділ).

---

## Пайплайн (джерело → трансформ → відображення)

- **Джерело:** `booking_services` (має `service_id`) ⋈ `bookings` (status, date, master_id).
- **Трансформ:** агрегувати по `service_id = :id`, `bookings.master_id = :master`, `bookings.status = 'completed'` (конвенція виручки з `useAnalytics.ts:188,216` — виручка рахується лише по `completed`).
- **Відображення:** замінити плейсхолдер у `ServiceEditor` на реальні цифри; при 0 завершених — лишити поточний текст-плейсхолдер.

## Метрики (рекомендація)

| Метрика | Розрахунок |
|---------|-----------|
| **Записів** | count completed bookings з цією послугою |
| **Виручка** | Σ `service_price` по completed |
| **Останній запис** | max(`bookings.date`) серед completed, відносна дата |

Тренд/спарклайн — поза скоупом P0 (over-engineering для блоку в едіторі).

## Підхід (рекомендований)

Server action `getServiceStats(serviceId)` у `services/actions.ts` (файл уже існує, з патерном перевірки `master_id`):
- верифікує власність послуги (як `removeServiceConsumableLink`),
- один запит: `booking_services` inner join `bookings`, фільтр по completed + master,
- повертає `{ count, revenue, lastDate }`.

Чому server action, а не клієнтський `createClient()`: уникає залежності від RLS на `booking_services` (яку довелось би перевіряти/додавати), узгоджується зі скілом `senior-backend`, ownership-перевірка вже в цьому файлі. У `ServiceEditor` тягнути в `useEffect` як `fetchLinkedConsumables`.

## Файли

- `bookit/src/app/(master)/dashboard/services/actions.ts` — новий `getServiceStats`
- `bookit/src/components/master/services/ServiceEditor.tsx` — заміна плейсхолдера (573-576) на реальний блок + fetch

## Ризики

- Статуси: рахуємо лише `completed`. Якщо хочемо враховувати `confirmed` (майбутні записи) — це інша семантика ("заплановано"), уточнити.
- `booking_services.service_price` — історична ціна на момент запису (не поточна `services.price`). Це правильно для виручки, але "середній чек" ≠ поточна ціна. Ок для P0.

## Acceptance

- [ ] root cause задокументовано (✓ вище: плейсхолдер, не backend)
- [ ] блок показує Записів / Виручка / Останній запис для послуги з історією
- [ ] 0 завершених → плейсхолдер-текст лишається
- [ ] ownership-перевірка в action (майстер не бачить чужі дані)
- [ ] TSC 0 · Build clean
- [ ] `security-review` (новий server action читає bookings)
