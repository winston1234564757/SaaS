# B-03 + B-04 + B-05 + B-06 — Dashboard UI

> Трекер: [00_TRACKER.md](./00_TRACKER.md)

---

## B-03 — Консолідація заголовків + висоти блоків (десктоп)
**Пріоритет:** P2 UI  
**Скіл:** `design-taste-frontend` + `impeccable`  
**Статус:** TODO

### Проблема
- Блок "Записи" (TodaySchedule) і "Вільно сьогодні" (FreeSlotsWidget) мають різні шрифтові класи у заголовках
- На десктопі ці два блоки різної висоти по дефолту (навіть коли пусті)
- Потрібні гарні empty states для обох

### Файли
- `bookit/src/components/master/dashboard/widgets/frost/FreeSlotsWidget.tsx`
- `bookit/src/components/master/dashboard/TodaySchedule.tsx`
- `bookit/src/components/master/dashboard/FrostDashboard.tsx` (grid layout)
- Всі `widgets/frost/*.tsx` — аудит заголовків

### Стандарти типографіки (з MEMORY.md)
Дозволені класи: `greeting-script`, `heading-serif`, `font-service`, `metric-value`, `accent-breathe`  
`font-black` — ЗАБОРОНЕНО

### Кроки виконання
1. `Grep "font-" bookit/src/components/master/dashboard/` — знайти всі шрифтові класи у виджетах
2. Визначити який клас має бути стандартним заголовком виджета (мабуть `font-service` або окремий CSS var)
3. Уніфікувати всі заголовки виджетів на один клас
4. Зробити empty states для TodaySchedule (ілюстрація або іконка + текст "Записів немає") і FreeSlotsWidget
5. Зробити filled states — переконатись що обидва виглядають Premium
6. Перевірити CSS Grid: `3fr 2fr` row для TodaySchedule + FreeSlotsWidget — додати `min-h` якщо потрібно
7. `impeccable` audit після змін

### QA
- Відкрити `/dashboard` на десктопі (> 1024px)
- Перевірити що обидва блоки однакової висоти при порожньому стані
- Перевірити шрифти заголовків — однаковий розмір і вага

---

## B-04 — Income 40% / PeakHours 60% Layout
**Пріоритет:** P3 UI  
**Скіл:** `design-taste-frontend`  
**Статус:** TODO

### Проблема
Зараз виджет доходу і пікових годин мають однакові пропорції (`55fr 45fr`). Потрібно:
- Блок "Пікові години" → 60% ширини (більший шрифт для годин і днів)
- Блок "Дохід/EarningsPulse" → 40% ширини

### Файли
- `bookit/src/components/master/dashboard/FrostDashboard.tsx`
- Знайти рядок `55fr 45fr` або `gridTemplateColumns` для відповідного row
- `bookit/src/components/master/dashboard/widgets/frost/WeeklyChartWidget.tsx`
- `bookit/src/components/master/dashboard/widgets/frost/PeakHoursWidget.tsx`

### Кроки виконання
1. `Read FrostDashboard.tsx` — знайти grid row де WeeklyChart + PeakHours
2. Змінити `55fr 45fr` → `40fr 60fr`
3. У PeakHoursWidget — збільшити шрифт для лейблів годин і днів тижня (heatmap)
4. Перевірити що heatmap коректно масштабується при більшій ширині

### QA
- Відкрити `/dashboard` десктоп — PeakHours займає 60% row

---

## B-05 — Referral Block Copy Humanizer
**Пріоритет:** P3 Copy  
**Скіл:** `humanizer`  
**Статус:** TODO

### Проблема
Текст у блоці рефералок описує вигоду нудно/AI-style. Потрібно яскравіше і живіше.

### Файли
- `bookit/src/components/master/dashboard/widgets/frost/InsightsRow.tsx` (перевірити)
- АБО `bookit/src/components/master/growth/GrowthHubClient.tsx`

### Кроки виконання
1. `Grep "реферал\|referral\|запрос" bookit/src/components/master/dashboard/` — знайти текст
2. Виписати всі рядки з текстом
3. Запустити `/humanizer` на всіх рядках
4. Замінити у файлах

### QA
- Переглянути блок — текст має бути живим, конкретним, без AI-штампів

---

## B-06 — Free Days Click → BottomSheet зі слотами
**Пріоритет:** P2 Feature  
**Скіл:** `senior-frontend`  
**Статус:** TODO  
**Уточнено:** BottomSheet зі слотами на обраний день ✅

### Поточний стан
`NextFreeDaysWidget.tsx` — показує вільні дні, але клік нічого не робить.

### Бажана поведінка
Клік на день → Vaul BottomSheet → список доступних слотів на цей день → кнопка "Записати клієнта" → ManualBookingForm з pre-filled датою

### Файли
- `bookit/src/components/master/dashboard/widgets/frost/NextFreeDaysWidget.tsx`
- `bookit/src/components/master/dashboard/FrostDashboard.tsx` (state + BottomSheet ownership)
- `bookit/src/lib/utils/smartSlots.ts` — `generateAvailableSlots` функція (вже існує)
- `@/components/ui/BottomSheet` — Vaul компонент

### Архітектурний паттерн
Той самий паттерн що вже є у FreeSlotsWidget → ManualBookingForm:
```
FrostDashboard owns state:
  const [wizardSlot, setWizardSlot] = useState<WizardSlot|null>(null)
  const [selectedFreeDay, setSelectedFreeDay] = useState<string|null>(null)
```

### Кроки виконання
1. `Read NextFreeDaysWidget.tsx` — побачити поточну структуру
2. `Read FrostDashboard.tsx` — побачити як `FreeSlotsWidget → ManualBookingForm` реалізований (взяти за шаблон)
3. Додати `onDayClick?: (date: string) => void` prop до `NextFreeDaysWidget`
4. Перетворити дні з `<div>` або `<span>` на `<button type="button">` з `onClick`
5. У `FrostDashboard` — додати `selectedFreeDay` state + BottomSheet
6. У BottomSheet — завантажити слоти через `generateAvailableSlots(selectedFreeDay)`
7. Slot click → встановити `wizardSlot` → ManualBookingForm відкривається

### A11y
- Кнопки днів: `aria-label={\`Переглянути слоти на ${formatDate(day)}\`}`
- Touch target ≥ 44px

### QA
- Клікнути на вільний день → BottomSheet відкривається зі слотами
- Клікнути слот → ManualBookingForm відкривається з датою
- Перевірити на mobile (Playwright або браузер)
