# [PLANFICH] Панель управління Studio (Власник салону)

## Статус
🔴 **ОБІЦЯНО, але НЕ зроблено**

## Що обіцяно

### На Лендінгу (`LandingPricing.tsx` — тариф Studio)
- Управління розкладом команди
- Розділення прав (власник / адмін / майстер)
- Зведена аналітика по всіх майстрах
- Спільна сторінка салону
- Єдина база клієнтів студії
- Пріоритетна підтримка

### В BOOKIT.md
> Studio Режим: Invite-by-token (хеш, TTL), всі майстри студії під одним slug власника

## Що реально існує

### Є в коді
- `studios` таблиця — зберігає `owner_id`, `name`, `slug`, `invite_token`
- `studio_members` таблиця — зберігає учасників
- `src/app/studio/join/` — сторінка ПРИЄДНАННЯ майстра до студії за посиланням
- `StudioJoinPage.tsx` — UI для прийняття запрошення
- `StudioPublicPage.tsx` — публічна сторінка студії (`/studio/[slug]`)
- `studio/actions.ts` — server actions для Studio

### Чого НЕМАЄ
- `dashboard/studio/page.tsx` — **ЗАГЛУШКА**: показує "Модуль Studio готується" з `WaitlistButton`
- Немає компонента управління командою майстрів
- Немає UI для запрошення нових майстрів через дашборд
- Немає зведеної аналітики студії
- Немає розподілу ролей (owner/admin/master) в UI або в `studio_members`

## Докази

```tsx
// src/app/(master)/dashboard/studio/page.tsx — рядок 32:
<span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full tracking-wide">
  У розробці
</span>
// ...
<WaitlistButton featureSlug="studio" />
```

## Рівень критичності
🔴 **Критичний** — Studio є окремим платним тарифом (299₴/майстер/місяць), обіцяним на лендінгу як `disabled: true` + CTA "Очікується". Платити нема за що.

## Рекомендація
Або реалізувати мінімальний Studio MVP (invite flow + список членів команди), або прибрати Studio з лендінгу повністю та позначити як "roadmap".
