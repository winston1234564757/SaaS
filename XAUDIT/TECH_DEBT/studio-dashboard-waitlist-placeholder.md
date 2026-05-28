# [TECH_DEBT] Studio Dashboard = WaitList Placeholder

## Статус
🟠 **НАПІВФАБРИКАТ — UI є, функціонал відсутній**

## Симптом

При переході на `/dashboard/studio` майстер бачить:

```tsx
// src/app/(master)/dashboard/studio/page.tsx

<h1 className="heading-serif text-xl text-foreground">Студія</h1>
<span>У розробці</span>

<p>Модуль Studio готується</p>
<p>Ми активно будуємо інструменти для команд та салонів.</p>

<WaitlistButton featureSlug="studio" />
```

**ЖОДНИХ** управляючих компонентів не рендериться.

## Конфліктуючий стан

Водночас є:
- `studios` таблиця з данними
- `studio_members` таблиця
- `src/app/studio/join/` — flow приєднання до студії (ПРАЦЮЄ!)
- `StudioPublicPage.tsx` — публічна сторінка студії (ПРАЦЮЄ!)
- `studio/actions.ts` — Server Actions (є, але не використовуються з дашборду)

Тобто: **приєднатися до студії можна, управляти нею — ні**.

## Бізнес-ризик
- Якщо майстер приймає запрошення в Studio — він потрапить в `studio_members`
- Але власник студії не має інтерфейсу для управління командою
- WaitlistButton призводить до накопичення waitlist, але немає SLA коли модуль буде готовий

## Файли
- `src/app/(master)/dashboard/studio/page.tsx` — placeholder
- `src/components/master/studio/WaitlistButton.tsx` — waitlist button
- `src/components/master/studio/StudioJoinPage.tsx` — join flow (робочий)

## Рекомендація
**Варіант A (швидкий):** Показати хоча б список членів команди та кнопку invite  
**Варіант B (правильний):** Повноцінний Studio Dashboard MVP
