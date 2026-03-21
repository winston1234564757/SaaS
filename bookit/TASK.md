Проаналізуй файли src/components/public/ExplorePage.tsx та src/components/client/MyMastersPage.tsx. Завдання — відновити відображення майстрів у каталозі та покращити навігацію для існуючих клієнтів (AAA UX).

Ремонт сторінки Explore (ExplorePage.tsx):

Перевір запит supabase.from('master_profiles').select(...). Якщо він використовує жорсткі фільтри (наприклад, вимагає наявність аватарки, послуг або робочих годин), тимчасово послаб їх або додай обробку помилок (safeQuery), щоб вивести в console.error причину, чому дані не приходять.

SQL RLS: Створи новий файл міграції у supabase/migrations/ (наприклад, 021_explore_rls.sql), який гарантовано відкриває публічний доступ на читання до профілів майстрів:

SQL
-- Дозволяємо всім (anon та authenticated) читати публічні дані майстрів
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (role = 'master');
CREATE POLICY "Master profiles are viewable by everyone" ON master_profiles FOR SELECT USING (true);
-- Якщо є таблиці services/portfolio, додайте policies і для них
AAA UX для MyMastersPage.tsx:

Знайди місце, де рендериться список існуючих майстрів (коли masters.length > 0).

Додай в кінці списку (або як sticky-елемент внизу екрана) преміальну CTA-кнопку "Знайти нових майстрів" (з іконкою Search або Compass).

Дизайн кнопки має бути елегантним (Secondary/Ghost style), щоб не конфліктувати з основними діями: <Link href="/explore" className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 rounded-2xl bg-[#F5E8E3]/50 text-[#6B5750] font-semibold hover:bg-[#F5E8E3] active:scale-[0.98] transition-all border border-[#F5E8E3]">...

Виконай ці зміни. Переконайся, що кнопка коректно працює на мобільних пристроях, а каталог /explore відображає дані.