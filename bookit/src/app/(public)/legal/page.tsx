import Link from 'next/link';
import { LEGAL_DOCS } from '@/lib/constants/legal';

export default function LegalIndexPage() {
  return (
    <div className="bento-card rounded-3xl p-10">
      <h1 className="heading-serif text-3xl mb-8">Юридичні документи</h1>
      <nav className="flex flex-col gap-4">
        {LEGAL_DOCS.map(doc => (
          <Link
            key={doc.slug}
            href={`/legal/${doc.slug}`}
            className="text-lg font-medium text-primary hover:underline"
          >
            {doc.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
