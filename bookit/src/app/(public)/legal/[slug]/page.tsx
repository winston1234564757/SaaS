import { readFileSync } from 'fs';
import { join } from 'path';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
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
    // V-08: Sanitize HTML to prevent XSS — marked does not strip script tags by default.
    const rawHtml = await marked(raw);
    html = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['h1','h2','h3','h4','p','ul','ol','li','strong','em','a','br','hr','table','thead','tbody','tr','th','td','blockquote'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  } catch {
    notFound();
  }

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
        dangerouslySetInnerHTML={{ __html: html! }}
      />

      <p className="mt-10 pt-6 border-t border-[#E8D0C8] text-xs text-muted-foreground/60 text-center">
        Цей документ носить інформаційний характер і складений відповідно до чинного законодавства України.
        З питань — <a href="mailto:viktor.koshel24@gmail.com" className="text-primary hover:underline">viktor.koshel24@gmail.com</a>.
      </p>
    </div>
  );
}
