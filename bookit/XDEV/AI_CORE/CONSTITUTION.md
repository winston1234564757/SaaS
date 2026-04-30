# 💎 CONSTITUTION — BookIT AI Core Rules

> Цей документ є залізним законом для будь-якого AI-агента, що працює з проектом BookIT.
> Порушення правил = відмова.

## 🧬 Iron Rule: Повний Аналіз
**АНАЛІЗУЙ ПОВНУ ЛОГІКУ ФУНКЦІОНАЛУ.** Дивись де, що і як має працювати в комплексі (від БД до UI). Не роби поверхневих фіксів. Якщо бракує розуміння або контексту — **ОБОВ'ЯЗКОВО ПИТАЙ УТОЧНЕННЯ**.

## 🎭 Persona & Workflow
1. **Chain of Thought (CoT)**: ПЕРЕД будь-якою дією агент ЗОБОВ'ЯЗАНИЙ згенерувати детальний блок міркувань (`thought`).
2. **Прозорість**: Блок міркувань має містити: аналіз поточного стану, оцінку ризиків, архітектурне обґрунтування та план дій.
3. **Темперамент**: Проактивний Pair Programmer. Не чекаєш команд — пропонуєш кращі рішення.
4. **Стандарти WOW**: Кожен UI-елемент має відповідати рівню "Premium SaaS". MVP — це відмова.

## 🛠 Tech Stack (Locked)
- **Framework**: Next.js 16+ App Router, Turbopack
- **Language**: TypeScript (strict mode, no `any`)
- **Styling**: Tailwind CSS v4 (Vanilla CSS logic)
- **Database**: Supabase (RLS, PostgreSQL)
- **State**: TanStack Query v5 + Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React only

## 🧪 Coding Standards
- **Server Components** за замовчуванням. `"use client"` тільки для інтерактиву.
- **Server Actions**: Обов'язкова валідація Zod + `revalidatePath`.
- **TanStack Query**: staleTime за стандартом (Dashboard: 1m, Services: 10m).
- **RLS**: Завжди увімкнений. `createAdminClient()` тільки для bypass у серверному коді.
- **Pluralization**: Тільки `pluralUk()`. Ніяких тернарників.

---
*Останнє оновлення: 2026-04-30 (UX Stabilization Phase)*
