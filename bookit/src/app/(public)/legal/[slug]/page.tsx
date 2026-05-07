import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Pre-rendered HTML content to eliminate runtime parsing overhead and Lambda execution errors on Vercel.
// This is the most robust way to serve static legal content in a serverless environment.
const LEGAL_HTML: Record<string, string> = {
  'public-offer': `<h1>Публічна оферта про надання послуг платформи BookIT</h1>
<p><strong>Дата набрання чинності:</strong> 01 травня 2025 року</p>
<hr>
<p><strong>Email:</strong> <a href="mailto:viktor.koshel24@gmail.com">viktor.koshel24@gmail.com</a> | <strong>ФОП:</strong> ФОП Кошель Віктор Миколайович | <strong>РНОКПП:</strong> 3705708939 | <strong>Адреса:</strong> Україна, Одеська область, м.Березівка, Яблунева 107</p>
<h2>1. Загальні положення</h2>
<p>1.1. Цей документ є публічною офертою (далі — <strong>Оферта</strong>) ФОП Кошель Віктор Миколайович, що діє як фізична особа-підприємець (далі — <strong>ФОП</strong>, <strong>Виконавець</strong>), реєстраційний номер облікової картки платника податків <strong>3705708939</strong>, адреса: <strong>Україна, Одеська область, м.Березівка, Яблунева 107</strong>, і адресований необмеженому колу осіб — фізичних та юридичних (далі — <strong>Клієнт</strong>, <strong>Майстер</strong>).</p>
<p>1.2. Відповідно до статей 633, 641, 642 Цивільного кодексу України, ця Оферта є пропозицією укласти договір про надання доступу до програмного сервісу <strong>BookIT</strong> (далі — <strong>Платформа</strong>) на умовах, викладених нижче.</p>
<p>1.3. Акцептом цієї Оферти є оплата першого інвойсу або підписки. З моменту акцепту між Клієнтом/Майстром і Виконавцем виникають договірні відносини на умовах цієї Оферти.</p>
<h2>2. Предмет договору</h2>
<p>2.1. Виконавець надає Користувачеві (Майстру) доступ до Платформи BookIT — SaaS-сервісу для автоматизації онлайн-запису в індустрії краси та сервісу.</p>
<p>2.2. Платформа включає функції: управління розкладом, послугами, клієнтами, онлайн-запис, аналітику та CRM.</p>
<h2>3. Права та обов'язки сторін</h2>
<p>3.1. Виконавець зобов'язується надавати доступ до Платформи та забезпечувати технічну підтримку.</p>
<p>3.2. Майстер зобов'язується надавати достовірні дані та своєчасно оплачувати тарифний план.</p>
<p>3.3. <strong>Виконавець є виключно технологічним посередником.</strong> BookIT не є стороною відносин між Майстром і кінцевим клієнтом.</p>
<h2>4. Тарифні плани та оплата</h2>
<p>4.1. Тарифні плани: Starter (0 грн), Pro (700 грн/міс), Studio (299 грн/майстер/міс).</p>
<p>4.2. Оплата здійснюється через Monobank Acquiring.</p>
<h2>5. Реквізити Виконавця</h2>
<p>ФОП Кошель Віктор Миколайович<br>РНОКПП: 3705708939<br>Адреса: Україна, Одеська область, м.Березівка, Яблунева 107</p>`,
  'terms-of-service': `<h1>Умови надання послуг / Terms of Service</h1>
<p><strong>BookIT Platform</strong> | ФОП Кошель Віктор Миколайович | Дата набрання чинності: 01 травня 2025 року</p>
<hr>
<h2>1. Приймання умов / Acceptance of Terms</h2>
<p><strong>УКР:</strong> Використовуючи Платформу BookIT, ви погоджуєтеся з цими Умовами. Якщо ви не погоджуєтеся — будь ласка, не використовуйте Платформу.</p>
<p><strong>ENG:</strong> By using the BookIT Platform, you agree to these Terms of Service. If you do not agree, please do not use the Platform.</p>
<h2>2. Опис послуг / Description of Services</h2>
<p>BookIT — це SaaS-платформа для управління онлайн-записом та бізнес-процесами у сфері послуг.</p>
<h2>3. Заборонені дії / Prohibited Activities</h2>
<p>Заборонено: реєстрація підроблених акаунтів, шахрайство, спам, автоматизоване збирання даних (парсинг).</p>
<h2>4. Обмеження відповідальності / Limitation of Liability</h2>
<p>Платформа надається «як є» (as is). Виконавець не несе відповідальності за непрямі збитки або втрату прибутку.</p>
<h2>5. Контакти / Contact</h2>
<p>Email: <a href="mailto:viktor.koshel24@gmail.com">viktor.koshel24@gmail.com</a></p>`,
  'privacy-policy': `<h1>Політика конфіденційності / Privacy Policy</h1>
<p><strong>BookIT Platform</strong> | ФОП Кошель Віктор Миколайович | Дата набрання чинності: 01 травня 2025 року</p>
<hr>
<h2>1. Загальні положення / General Provisions</h2>
<p>Ця Політика описує, які персональні дані збирає Платформа BookIT (номер телефону, ім'я, технічні дані) та як вони використовуються для надання послуг.</p>
<h2>2. Де зберігаються дані / Data Storage</h2>
<p>Дані зберігаються у хмарній базі даних Supabase на серверах в ЄС (Франкфурт, Німеччина).</p>
<h2>3. Права суб'єктів даних / Data Subject Rights</h2>
<p>Ви маєте право на доступ, виправлення та видалення ваших персональних даних («право на забуття»).</p>
<h2>4. Безпека / Security</h2>
<p>Ми використовуємо шифрування TLS 1.3 та AES-256 для захисту ваших даних.</p>`,
  'refund-policy': `<h1>Політика повернення коштів / Refund Policy</h1>
<p><strong>BookIT Platform</strong> | ФОП Кошель Віктор Миколайович | Дата набрання чинності: 01 травня 2025 року</p>
<hr>
<h2>1. Загальне положення / General Statement</h2>
<p>BookIT надає цифровий сервіс (SaaS). Підписки на цифрові сервіси, надання яких вже розпочалося, не підлягають поверненню відповідно до законодавства України.</p>
<h2>2. Виключення / Exceptions</h2>
<p>Повернення можливе у разі подвійного списання або підтвердженої технічної помилки, що унеможливила користування сервісом понад 72 години.</p>
<h2>3. Скасування підписки / Canceling</h2>
<p>Ви можете скасувати підписку у будь-який момент через панель керування. Доступ збережеться до кінця оплаченого періоду.</p>`,
};

const LEGAL_META: Record<string, { title: string; description: string }> = {
  'public-offer': {
    title: 'Публічна оферта — BookIT',
    description: 'Публічна оферта про надання послуг платформи BookIT.',
  },
  'terms-of-service': {
    title: 'Умови надання послуг — BookIT',
    description: 'Правила використання платформи BookIT.',
  },
  'privacy-policy': {
    title: 'Політика конфіденційності — BookIT',
    description: 'Як BookIT збирає, використовує та захищає персональні дані.',
  },
  'refund-policy': {
    title: 'Політика повернення коштів — BookIT',
    description: 'Умови повернення коштів за підписки BookIT.',
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = LEGAL_META[slug];
  if (!meta) return { title: 'Не знайдено' };
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: true },
  };
}

export function generateStaticParams() {
  return Object.keys(LEGAL_META).map((slug) => ({ slug }));
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;

  const html = LEGAL_HTML[slug];
  if (!html) notFound();

  return (
    <div className="bento-card rounded-3xl p-6 sm:p-10">
      <article
        className="prose prose-stone max-w-none
          prose-headings:font-playfair prose-headings:text-foreground
          prose-h1:text-3xl prose-h1:mb-6
          prose-h2:text-xl prose-h2:text-foreground prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-base prose-h3:text-muted-foreground prose-h3:font-semibold
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-li:text-muted-foreground
          prose-strong:text-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-table:text-sm
          prose-th:text-foreground prose-th:font-semibold
          prose-td:text-muted-foreground
          prose-hr:border-[#E8D0C8]
          prose-blockquote:border-l-[#789A99] prose-blockquote:text-muted-foreground/60"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <p className="mt-10 pt-6 border-t border-[#E8D0C8] text-xs text-muted-foreground/60 text-center">
        Цей документ носить інформаційний характер і складений відповідно до чинного законодавства України.
        З питань — <a href="mailto:viktor.koshel24@gmail.com" className="text-primary hover:underline">viktor.koshel24@gmail.com</a>.
      </p>
    </div>
  );
}
