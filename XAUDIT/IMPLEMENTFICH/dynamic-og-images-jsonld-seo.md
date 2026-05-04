# [IMPLEMENTFICH] Dynamic OG Images (Edge Runtime) + JSON-LD SEO

## Статус
💎 **Повністю зроблено — НЕ виведено в маркетинг**

## Де реалізовано

### Dynamic OG Images
```typescript
// src/app/[slug]/opengraph-image.tsx — Edge Runtime
// Унікальний дизайн для кожного майстра:
// Master Avatar + Category Emojis + business_name/full_name + рейтинг
// Автоматично генерується для кожної публічної сторінки (/[slug])
```

Ефект: при шерингу посилання майстра в Telegram/WhatsApp/FB — 
відображається красивий Preview з фото профілю та спеціалізацією.

### JSON-LD Structured Data
```typescript
// src/app/[slug]/page.tsx:
// JSON-LD схема: ProfessionalService + AggregateRating
// Дає Google Cards в пошуку з рейтингом зірочками
// Structured data для "Local Business" типу
```

### Shared Data Layer
```typescript
// src/app/[slug]/data.ts — React.cache()
// Єдине джерело для Page, Metadata та OG генерації
// Без дублювання запитів до БД
```

## Де НЕ згадується
- ❌ Лендінг — нічого про SEO і OG preview
- ❌ OnBoarding — не пояснюється клієнтам
- ❌ Pricing — не вказано як диференціатор

## Маркетингова цінність
🚀 **"Готова" до Google і соцмереж сторінка** — Більшість конкурентів дають лише plain URL. BookIT дає:
- Красиві OG прев'ю при шерингу
- Google Rating stars в пошуку (якщо є відгуки)
- SEO-оптимізований профіль майстра

## Рекомендація
1. На лендінг: "Ваша сторінка з'являється в Google з рейтингом зірочками"
2. В OnBoarding: "Поділіться посиланням — воно виглядатиме красиво"
3. BOOKIT.md: додати як SEO competitive advantage
