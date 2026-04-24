import { readFileSync } from 'fs';
import { join } from 'path';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import type { Metadata } from 'next';

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
  const { slug } = await params; // params is async in Next.js 15+

  if (!LEGAL_META[slug]) notFound();

  let html: string;
  try {
    const filePath = join(process.cwd(), 'src', 'content', 'legal', `${slug}.md`);
    const raw = readFileSync(filePath, 'utf-8');
    html = marked(raw) as string;
  } catch {
    notFound();
  }

  return (
    <div className="bento-card rounded-3xl p-6 sm:p-10">
      <article
        className="prose prose-stone max-w-none
          prose-headings:font-playfair prose-headings:text-[#2C1A14]
          prose-h1:text-3xl prose-h1:mb-6
          prose-h2:text-xl prose-h2:text-[#2C1A14] prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-base prose-h3:text-[#6B5750] prose-h3:font-semibold
          prose-p:text-[#6B5750] prose-p:leading-relaxed
          prose-li:text-[#6B5750]
          prose-strong:text-[#2C1A14]
          prose-a:text-[#789A99] prose-a:no-underline hover:prose-a:underline
          prose-table:text-sm
          prose-th:text-[#2C1A14] prose-th:font-semibold
          prose-td:text-[#6B5750]
          prose-hr:border-[#E8D0C8]
          prose-blockquote:border-l-[#789A99] prose-blockquote:text-[#A8928D]"
        dangerouslySetInnerHTML={{ __html: html! }}
      />

      <p className="mt-10 pt-6 border-t border-[#E8D0C8] text-xs text-[#A8928D] text-center">
        Цей документ носить інформаційний характер і складений відповідно до чинного законодавства України.
        З питань — <a href="mailto:viktor.koshel24@gmail.com" className="text-[#789A99] hover:underline">viktor.koshel24@gmail.com</a>.
      </p>
    </div>
  );
}
