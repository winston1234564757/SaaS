## ✅ Ітерація 28 — Портфоліо (2026-04-28) — ВИКОНАНО

Реалізовано повністю:
- Окремий пункт меню `/dashboard/portfolio` в майстер-дашборді
- PortfolioItemEditor: єдиний флоу (auto-create draft → редагування → збереження на "Готово")
- Фото: до 5 на кейс, drag-to-reorder (@dnd-kit), error display
- Прив'язка до послуги (service_id) та відгуків (many-to-many)
- Тегування клієнта → consent flow (in-app + Telegram + SMS) → approve/decline
- Starter: 5 published items max; Pro/Studio: необмежено
- Upsell nudge при досягненні ліміту
- Публічна сторінка майстра: горизонтальний strip (2 кейси + "Всі роботи"), розміщено після магазину
- `/[slug]/portfolio` — SSR grid, `/[slug]/portfolio/[id]` — детальна з inline BookingFlow
- Кнопка "Записатись" відкриває BookingFlow з pre-selected послугою (без redirect)
- Клієнт бачить consent запити в `/my/notifications`
- Детальна сторінка показує тегованого клієнта (approved → зелений значок, pending → бурштиновий)

Баги виправлені в процесі:
- services query: `duration_minutes` (не `duration`), `is_popular` (не `popular`)
- getMasterClients: RPC `get_master_clients` замість FK join
- Storage bucket `portfolios` відновлено (migration 115 після видалення в 056)
- PortfolioPhotoUploader: акумуляція фото в циклі через `currentPhotos`, error display

---

## Наступна задача

(поставити нову задачу)
