# [IMPLEMENTFICH] Story Generator — Маркетинговий Конвеєр Сторіс

## Статус
💎 **ГОТОВО ДО ВИКОРИСТАННЯ — Ніде не рекламується окремо**

## Що є?

`src/components/master/marketing/StoryGenerator.tsx` — **1559 рядків / 74 KB**

Найбільший компонент маркетинг-модуля. Повноцінний генератор Instagram-сторіс.

### 7 режимів контенту:

| Режим | Рівень | Опис |
|---|---|---|
| `announcement` | Starter + | Кастомне текстове повідомлення |
| `free_slots` | 🔒 Pro | Автоматично показує вільні вікна зі справжнього розкладу |
| `vacation` | 🔒 Pro | Дати відпустки — щоб клієнти не записувались |
| `promo` | 🔒 Pro | Flash Deal зі знижкою з Revenue Hub |
| `review_spotlight` | 🔒 Pro | 5★ відгук красиво оформлений |
| `flash_window` | 🔒 Pro | Гарячий слот + відсоток знижки |
| `portfolio_item` | 🔒 Pro | Фото з портфоліо + підпис |

### Технічні можливості
- 6 палітр (Nude, Sage, Mono, Blush, Sky, Dark)
- Завантаження власного фото як фону
- Фото з портфоліо як фон
- Аватар майстра (photo або emoji)
- Позиція блоку (top/center/bottom)
- Вирівнювання тексту
- Прозорість glassmorphism-панелі
- Exportується як JPEG 1260×2240 (3.5x) через `modern-screenshot`
- Інтеграція з `useWizardSchedule` (реальний розклад), `usePortfolioItems`, `useActiveFlashDeals`

### Starter обмеження
Режими Pro доступні, але після 10 секунд → blur overlay → Upgrade prompt. Потім: `blurTimerRef` скидається при кожній взаємодії (онбординг юзерів).

## Де доступно?
`/dashboard/marketing` → вкладка "Сторіс" + з `PortfolioPage` при кліку на фото

## Маркетингова проблема
В `LandingPricing.tsx` написано лише:
> "Всі маркетингові інструменти (Вільні вікна, Відгуки, Анонси)"

**Story Generator — найбільший WOW-feature — не має власної Feature Card на лендінгу!**

## Рекомендація
Додати Bento-картку "AI Story Generator" в `LandingBentoFeatures.tsx` з демо-анімацією.
