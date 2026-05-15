# BookIT UI Modals Map

> Архітектурна карта всіх спливаючих вікон, модалок (Modals), виїзних панелей (Sheets) та Drawer-ів у проекті. Допомагає дотримуватися консистентності UI (єдиного стилю) та уникнути дублювання.

---

## 🏗 Базові Контейнери (UI Wrappers)

Ці компоненти-обгортки відповідають за базову поведінку, анімації, бекдропи (backdrop) та блокування фокусу. **Завжди** використовуйте їх для створення нових спливаючих вікон.

- **`PopUpModal`** (`src/components/ui/PopUpModal.tsx`)
  - *Тип:* Універсальний (Адаптивний). На десктопі відкривається як класична модалка (`Dialog` Radix UI), на мобільному фолбечить у `BottomSheet`.
  - *Застосування:* Загальні налаштування, підтвердження дій, інформаційні попапи.
  
- **`BottomSheet`** (`src/components/ui/BottomSheet.tsx`)
  - *Тип:* Mobile-first виїзна панель знизу (Framer Motion).
  - *Застосування:* Детальна інформація, форми редагування, CRM-картки. Забезпечує свайп для закриття та нативне відчуття на мобілках.

- **`DashboardDrawer`** (`src/components/ui/DashboardDrawer.tsx`)
  - *Тип:* Бічна виїзна панель (Radix UI `Dialog`).
  - *Застосування:* Великі форми, налаштування та фільтри на десктопній версії.

- **`MicaModal`**
  - *Тип:* Специфічна десктопна модалка з ефектом Mica (напівпрозоре скло). Використовується в публічному флоу бронювання (`BookingWizard`).

---

## 🎯 Специфічні Модалки (По Доменах)

### 👥 CRM та Клієнти (`/master/clients`)
1. **`ClientDetailSheet`** (`ClientDetailSheet.tsx`)
   - *Формат:* `BottomSheet`
   - *Функція:* Повна картка клієнта з історією візитів, Vibe-мітками та LTV.
2. **SmartActionSheet** (Inline `BottomSheet` у `ClientsPage.tsx`)
   - *Функція:* Модалка для відправки автоматизованого повідомлення (Telegram) вибраному клієнту.
3. **`SegmentBuilder`** (`SegmentBuilder.tsx`)
   - *Формат:* `BottomSheet`
   - *Функція:* Конструктор кастомних клієнтських сегментів (фільтрація).
4. **Average Check & Referral Details** (Inline `BottomSheet` у `ClientWidgets.tsx`)
   - *Функція:* Детальна розшифровка метрик по середньому чеку та реферальній мережі майстра.

### ✂️ Послуги та Товари (`/master/services`)
1. **`ServiceForm`** (`ServiceForm.tsx`)
   - *Формат:* `BottomSheet`
   - *Функція:* Створення та редагування послуги.
2. **`ProductForm`** (`ProductForm.tsx`)
   - *Формат:* `BottomSheet`
   - *Функція:* Створення та редагування товарів.

### 📊 Дашборд та Аналітика (`/master/dashboard`)
1. **`FlashDealDrawer`** (`FlashDealDrawer.tsx`)
   - *Формат:* `PopUpModal`
   - *Функція:* Створення флеш-знижок для заповнення порожніх "вікон" у розкладі.
2. **`PricingDrawer`** (`PricingDrawer.tsx`)
   - *Формат:* `PopUpModal`
   - *Функція:* Управління динамічним ціноутворенням.
3. **Revenue / Top Clients Popups** (Inline `PopUpModal` у `StatsMosaicWidget.tsx`)
   - *Функція:* Розширений розріз виручки за сьогодні або список топ-клієнтів тижня.
4. **`HubDrawer`** (`HubDrawer.tsx`)
   - *Формат:* `PopUpModal`
   - *Функція:* Глобальний хаб налаштувань.

### 📢 Маркетинг (`/master/marketing`)
1. **`BroadcastDetailSheet`** (`BroadcastDetailSheet.tsx`)
   - *Формат:* `BottomSheet`
   - *Функція:* Аналітика конверсії та відправлених повідомлень по конкретній розсилці.

### 🛒 Публічний Флоу Бронювання та Магазин (`/public`)
1. **`BookingWizard`** (`BookingWizard.tsx`)
   - *Формат:* Адаптивний (`MicaModal` на Desktop / `BottomSheet` на Mobile).
   - *Функція:* Багатокроковий процес запису на прийом.
2. **`ProductDetailSheet`** (Inline у `ShopPage.tsx`)
   - *Функція:* Детальна сторінка товару в публічному магазині.
3. **`NavLoginSheet`** (`NavLoginSheet.tsx`) & **`ClientAuthSheet`** (`ClientAuthSheet.tsx`)
   - *Функція:* Швидка авторизація клієнта (OTP) без переходу на окрему сторінку логіну.

### 💳 Білінг та Підписки (`/master/billing`)
1. **Billing Checkout Modal** (Inline `PopUpModal` у `BillingPage.tsx`)
   - *Функція:* Вікно оплати, вибору тарифу та підключення MonoBank.

---

## 📋 Best Practices (Правила)
1. **Mobile-First:** Всі сутності на мобільному повинні відкриватися як знизу-вгору (`BottomSheet`), щоб користувач міг легко свайпнути їх вниз для закриття (one-handed use).
2. **Z-Index Менеджмент:** `Toasts` > `Modals/Dialogs/Sheets` > `CommandBars/Sticky Headers`. Завжди контролювати z-index для дропдаунів в межах модалок.
3. **Focus Trap:** Усі `Dialog` (через Radix) і `BottomSheet` блокують скрол позаду себе (body scroll lock).
4. **Легковажність:** Намагайтеся тримати локальний стан форм (state) всередині компонентів модалок, щоб не викликати зайві ре-рендери батьківських сторінок.
