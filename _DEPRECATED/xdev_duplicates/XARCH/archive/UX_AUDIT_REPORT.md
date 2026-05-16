# 💎 UX/UI Premium Audit Report
**Project:** BookIT
**Date:** 2026-04-29
**Role:** Principal UX Engineer & QA Lead

Цей аудит виявляє критичні порушення дизайн-системи, невідповідності стандартам a11y (accessibility) та проблеми зі станом компонентів. 

## 1. Хардкод кольорів та розмірів (Hardcoded Magic Values)
*Проблема:* Замість використання Tailwind-токенів дизайн-системи (shadcn/ui style), у багатьох компонентах присутні довільні HEX-значення в класах на кшталт `text-[#2C1A14]`, `bg-[#FFE8DC]`. Це руйнує гнучкість, ускладнює підтримку тем та порушує консистентність.
*Знайдено в:*
- `src/components/ui/Button.tsx`: `bg-[#789A99]`, `text-[#2C1A14]`, `bg-[#C05B5B]/12` тощо.
- `src/components/ui/Input.tsx`: `text-[#2C1A14]`, `border-[#C05B5B]`, `placeholder:text-[#A8928D]`.
- `src/components/ui/skeleton.tsx`: `bg-[#F5E8E3]`.
- `src/lib/toast/context.tsx`: `text-[#2C1A14]`, `max-w-[340px]`.
*Як виправити:* Створити `@theme` блок у `globals.css` з мапінгом змінних (`--color-primary`, `--color-background`, `--color-muted` тощо) та замінити хардкод на `bg-background`, `text-foreground`, `text-muted-foreground`.

## 2. Неконсистентність станів (State Management & Feedback)
*Проблема:* Елементи управління не завжди відображають свій стан належним чином, коли відбувається дія. Це створює відчуття "зависання" інтерфейсу для користувача.
*Знайдено в:*
- `src/components/ui/Button.tsx`: Використовує кастомний `isLoading`, але не завжди керує `aria-disabled` атрибутом (що критично для скрін-рідерів та a11y).
- Багато форм не застосовують стан `isSubmitting` (від React Hook Form) напряму до усіх інпутів (блокування редагування під час відправки).
*Як виправити:* Гарантувати, що кнопка має `aria-disabled={disabled || isLoading}` та `data-state="loading"`. 

## 3. Доступність (a11y) та Focus Trap у Модалках
*Проблема:* Модальні вікна розроблені як звичайні `div` із `fixed` позиціонуванням. Відсутній Focus Trap, користувач може "проклікувати" фон або переходити Tab'ом на приховані елементи. Відсутня підтримка закриття клавішею `ESC`.
*Знайдено в:*
- `src/components/ui/PopUpModal.tsx`
- `src/components/ui/DashboardDrawer.tsx`
- `src/components/ui/BottomSheet.tsx`
*Як виправити:* Рефакторинг на використання primitives від Radix UI (або shadcn/ui Dialog/Sheet), які з коробки обробляють `aria-modal`, `role="dialog"`, Focus Trap та натискання `ESC`.

## 4. Конфлікти z-index
*Проблема:* Ручне та хаотичне присвоєння `z-index` значень створює шаруваті конфлікти (оверлей перекриває тост або тост перекриває модалку).
*Знайдено в:*
- `src/lib/toast/context.tsx`: `z-[500]`
- `src/components/ui/BottomSheet.tsx`: `z-50`
- `src/components/ui/PopUpModal.tsx`: `z-10`
*Як виправити:* Створити строгу ієрархію шарів. Всі модалки мають бути `z-50`, Toaster має бути `z-[100]`. Використовувати Portals для перенесення оверлеїв в кінець DOM.

---
**Висновок:** Для створення по-справжньому преміального продукту, ми повинні повністю відмовитись від "кастомних милиць" у базових компонентах та перейти на строгі токени і headless UI компоненти.
