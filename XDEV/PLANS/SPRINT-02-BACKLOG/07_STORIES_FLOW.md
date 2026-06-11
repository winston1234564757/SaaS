# B-11 + B-12 — Portfolio → Stories Flow + Animation

> Трекер: [00_TRACKER.md](./00_TRACKER.md)

---

## B-11 — Portfolio → Stories: Прямий Перехід
**Пріоритет:** P2 Feature  
**Скіл:** `senior-frontend`  
**Статус:** TODO

### Проблема
Зі сторінки деталей портфоліо (`/[slug]/portfolio/[id]`) є кнопка "Сторіс", але вона веде на конструктор без контексту. Майстер змушений вручну вибирати:
1. Тип сторіс = "Робота"
2. Вибирати конкретну роботу зі списку

Потрібно: мінімальна кількість кліків.

### Бажаний флоу
```
/[slug]/portfolio/[id]
  ↓ Клік "Створити сторіс"
/dashboard/marketing?tab=story&type=work&portfolioId=[id]
  → StoryGenerator відкривається з:
    - type = "work" (pre-selected)
    - portfolioItem = перша в списку (або конкретна за id)
```

### Файли

| Файл | Роль |
|------|------|
| `bookit/src/app/[slug]/portfolio/[id]/page.tsx` | Публічна сторінка деталей портфоліо |
| `bookit/src/components/public/portfolio/PortfolioBookingButton.tsx` | Кнопка бронювання (шаблон) |
| `bookit/src/app/(master)/dashboard/marketing/page.tsx` | Marketing Hub |
| `bookit/src/components/master/marketing/StoryGenerator.tsx` | Конструктор сторіс |
| `bookit/src/components/master/marketing/story/storyTypes.ts` | Типи сторіс |

### Кроки виконання
1. `Read portfolio/[id]/page.tsx` — знайти кнопку "Сторіс" (або де вона має бути)
2. `Read StoryGenerator.tsx` — перевірити чи приймає props/URL params для pre-selection
3. `Read storyTypes.ts` — знайти тип "work" та його структуру
4. Додати `searchParams` обробку у `marketing/page.tsx`:
   ```ts
   const { tab, type, portfolioId } = searchParams;
   if (tab === 'story') → показати StoryGenerator з pre-selected type + portfolioId
   ```
5. Додати кнопку "Створити сторіс" на `portfolio/[id]/page.tsx` з посиланням:
   ```
   /dashboard/marketing?tab=story&type=work&portfolioId={id}
   ```
6. У `StoryGenerator` — читати `initialType` + `initialPortfolioId` prop/param → pre-select

### Важливо
- Кнопка "Сторіс" має бути видима **тільки для авторизованого майстра** (не для публічних відвідувачів)
- Перевірити auth context на публічній сторінці портфоліо

### QA
- Зайти як майстер → відкрити `/[slug]/portfolio/[id]`
- Бачу кнопку "Створити сторіс"
- Клікаю → StoryGenerator відкривається з pre-selected "Робота" і цим портфоліо-елементом

---

## B-12 — Story Constructor: Анімована Стрілка Вниз
**Пріоритет:** P3 Animation  
**Скіл:** `emil-design-eng`  
**Статус:** TODO

### Проблема
На мобільному пристрої:
- Конструктор сторіс відкривається
- Preview сторіс (StoryCanvas) знаходиться НИЖЧЕ форми параметрів
- Коли юзер вперше змінює параметр — preview НЕ видно (треба скролити)
- Немає жодної підказки що нижче є щось цікаве

### Бажана поведінка
1. При першій зміні будь-якого параметру → з'являється анімована стрілка вниз
2. Стрілка пульсує або анімується (привертає увагу)
3. Клік або scroll → стрілка зникає

### Файли

| Файл | Роль |
|------|------|
| `bookit/src/components/master/marketing/StoryGenerator.tsx` | Головний конструктор |
| `bookit/src/components/master/marketing/story/StoryCanvas.tsx` | Preview сторіс |

### Кроки виконання
1. `Read StoryGenerator.tsx` — знайти де зберігається стан параметрів
2. Додати `const [hasChanged, setHasChanged] = useState(false)` — track першої зміни
3. На кожному `onChange` параметра — `if (!hasChanged) setHasChanged(true)`
4. Render:
   ```tsx
   <AnimatePresence>
     {hasChanged && !hasScrolled && (
       <motion.div
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0 }}
         className="fixed bottom-20 left-1/2 -translate-x-1/2 z-10"
       >
         <ChevronDown className="animate-bounce" />
       </motion.div>
     )}
   </AnimatePresence>
   ```
5. Додати `useEffect` для scroll listener → `setHasScrolled(true)` коли юзер скролить вниз
6. `spring as const` для variants (правило BookIT)

### Emil Kowalski правила
- `mode="popLayout"` якщо animate контент що змінює висоту
- Spring: `{ type: 'spring' as const, stiffness: 340, damping: 30, bounce: 0.1 }`
- Анімація має бути **functional** (допомагає юзеру) а не decorative

### QA
- На мобільному: відкрити StoryGenerator → змінити колір → бачу стрілку вниз
- Скролити вниз → стрілка зникає
- Не змінювати параметр → стрілки немає
