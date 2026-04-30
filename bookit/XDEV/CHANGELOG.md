# 📝 CHANGELOG — BookIT Development

Усі значущі зміни в проекті, зафіксовані Antigravity.

## [0.2.0] — 2026-04-30
### 🏗 Архітектура (AI & XDEV)
- **Створено XDEV**: Нова структура для документації, стандартів та звітів.
- **AI Core**: Додано `CONSTITUTION.md`, `ANTIGRAVITY_MINDSET.md` та `UX_STANDARDS.md`.
- **System Map**: Створено високорівневу карту проекту `SYSTEM_MAP.md`.
- **Cleanup**: Всі звіти з кореня перенесено в `XDEV/REPORTS/`.

### ✨ UX Stabilization (Premium Standards)
- **BottomSheet Migration**: Всі модалки (включаючи `BookingWizard`) переведено на `vaul`.
- **Premium Sticky Buttons**: Реалізовано "плаваючі" кнопки дій над навбаром у всіх кроках запису.
- **Safe Areas**: Додано `pb-32` до контейнерів для запобігання перекриття контенту навігацією.
- **Animation Decoupling**: Впроваджено 400ms затримку закриття для усунення UI-фрізів.
- **Auto-save Indicators**: Стабілізовано відображення статусу "Зберігаємо..." через `mutateAsync`.

### 🐛 Bug Fixes
- **Client Notes**: Виправлено збереження нотаток (перехід з `client_id` на `client_phone` у серверних діях).
- **Rules of Hooks**: Виправлено runtime-помилку в `BookingWizard.tsx` (некоректний порядок хуків).
- **Duplicate Removal**: Видалено дубльований код у хвості `BookingWizard.tsx`.

---

## [0.1.0] — 2026-04-25
- Початковий реліз Tier 3 Roadmap.
- Базова реалізація CRM та сповіщень.

---
*Mantra: Premium Quality or Nothing.*
