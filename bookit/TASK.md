ПРОМТ ДЛЯ CLAUDE (TASK 4.2.2 - REFERRAL SYSTEM MVP FRONTEND & UI):

БІЗНЕС-ЗАДАЧА:
Нам потрібно інтегрувати MVP реферальної системи в клієнтський та майстерський інтерфейси. Ми вже маємо бекенд для створення лінків (referrals.ts) та обробки нагород. Тепер треба: 1) Зробити механізм "перехоплення" реферального коду з URL; 2) Передавати цей код при реєстрації та створенні запису; 3) Додати красиві кнопки "Поділитися" в UI.

ВЕКТОР ДІЙ:

Перехоплення коду (URL -> LocalStorage):

Відкрий src/app/layout.tsx (або Providers.tsx).

Додай логіку (useEffect + useSearchParams), яка перевіряє наявність ?ref=... в URL. Якщо параметр є — записуй його в localStorage.setItem('bookit_ref', code). Це потрібно, щоб код "вижив" під час редиректів авторизації.

Ін'єкція коду (Auth & Booking):

Auth: Відкрий src/components/auth/RegisterForm.tsx (або Server Action реєстрації processRegistrationReferral). При успішній реєстрації читай код з localStorage, передавай його в бекенд і потім роби localStorage.removeItem('bookit_ref').

Booking: Відкрий src/components/public/BookingFlow.tsx (або екшен createBooking). При сабміті форми читай ref з localStorage, додавай його до payload бронювання (наприклад, у поле notes з префіксом [REF:...], або в окреме поле, якщо ти його створив), і очищай localStorage.

UI Майстра (ReferralPage.tsx):

Відкрий src/components/master/referral/ReferralPage.tsx.

Зроби UI-редизайн. Додай Card: "Запросити колегу". Текст: "Подаруйте колезі преміум-інструмент і отримайте +30 днів підписки Pro безкоштовно".

Додай кнопку "Згенерувати лінк", яка викликає getOrCreateReferralLink(..., 'B2B').

Відобрази лінк в інпуті readOnly з кнопкою "Копіювати" та кнопкою "Поділитися" (navigator.share, якщо підтримується).

UI Клієнта (MyProfilePage.tsx або ClientRealtimeSync.tsx):

На сторінці профілю клієнта або в деталях майстра додай Card: "Подаруй подрузі знижку".

Текст: "Поділіться своїм майстром з подругою. Вона отримає знижку 10%, а ви — бонус на наступний візит!"

Логіка така ж: генерація C2C лінка, копіювання/шарінг.

ЖОРСТКІ ОБМЕЖЕННЯ:

DO NOT run build or typecheck.

UI має виглядати дорого і нативно (Tailwind), використовуй іконки з lucide-react (Copy, Share2, Gift).

Забезпеч безпечне читання з localStorage (перевірка typeof window !== 'undefined').

Відповідай українською мовою. Видай код логіки перехоплення (п.1 і 2) та оновлені компоненти UI для майстра і клієнта.