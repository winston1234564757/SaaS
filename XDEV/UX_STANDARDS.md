# ✨ PREMIUM UX STANDARDS — Design & Interaction Rules

> Правила для створення інтерфейсу рівня BookIT Premium.

## 📱 Mobile-First Sheets (Vaul)
- Всі модалки на мобільних — тільки через `BottomSheet` (`vaul`).
- Обов'язкова підтримка свайпу для закриття.
- **Розділений Lifecycle**:
  ```typescript
  // 1. Локальний стейт для анімації
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 2. Закриття з затримкою для плавності
  const handleClose = () => {
    setIsModalOpen(false);
    setTimeout(onClose, 400); // Даємо час анімації Vaul
  };
  ```

## 🔘 Sticky Action Buttons
- Кнопки "Далі", "Зберегти", "Підтвердити" мають бути **липкими** (`sticky`).
- **Позиція**: `bottom-6` (над навігаційною панеллю).
- 

## 💾 Persistence & Feedback
- Автозбереження нотаток: 500ms debounce.
- Індикатор "Зберігаємо..." обов'язковий.
- Використовуй `mutateAsync` для точного відстеження стану `isAutoSaving`.

---
*Стандарт BookIT: Кожен клік має приносити задоволення.*
