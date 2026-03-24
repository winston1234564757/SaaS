Act as an Elite Senior Full-stack Architect. 
Поточна задача: Фікс багів Ітерації 5 (Dashboard Modal & Reschedule Logic).

БІЗНЕС-МЕТА:
1. Клік на картку запису в Дашборді має відкривати детальну модалку. Швидкі дії не повинні блокувати цей клік.
2. При перенесенні запису (Reschedule) користувач має бачити повноцінний календар та список доступних слотів (як при новому записі), а не базовий інпут дати/часу.

ВЕКТОР ДІЙ:
1. **Fix Dashboard Modal (`TodaySchedule.tsx` та інші віджети):** - Переконайся, що клік на саму картку запису відкриває `BookingDetailsModal`.
   - На кнопках Quick Actions ([✓] та [✕]) обов'язково додай `e.stopPropagation()`, щоб клік по них не відкривав модалку.
2. **Upgrade Reschedule Flow (`BookingDetailsModal.tsx`):**
   - Видали примітивний інпут дати/часу для перенесення.
   - Імплементуй повноцінний вибір дати (Calendar) та вибір часу зі списку доступних слотів. 
   - Використай існуючу в проєкті логіку/хуки (наприклад, генерацію доступних слотів з урахуванням тривалості послуг поточного запису та робочого графіка майстра).
   - Тільки після вибору конкретного слоту роби виклик `rescheduleBooking`.

ОБМЕЖЕННЯ (STRICT CONSTRAINTS):
- COMMUNICATION PROTOCOL: MINIMIZE OUTPUT TOKENS. DO NOT explain your code. DO NOT provide summaries of what you did. Output ONLY the code modifications and essential questions if you are stuck.
- DO NOT run build or typecheck scripts. The user will handle compilation manually.
- Гарантуй оновлення даних (кеш клієнта та SSR) після мутації.