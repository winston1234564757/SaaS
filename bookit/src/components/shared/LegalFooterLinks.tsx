import Link from 'next/link';
import { LEGAL_DOCS } from '@/lib/constants/legal';

interface Props {
  /** Compact = тільки текстові лінки в рядок (для footer) */
  variant?: 'compact' | 'list';
  className?: string;
}

export function LegalFooterLinks({ variant = 'compact', className = '' }: Props) {
  if (variant === 'list') {
    return (
      <nav className={`flex flex-col gap-1 ${className}`}>
        {LEGAL_DOCS.map(doc => (
          <Link
            key={doc.slug}
            href={`/legal/${doc.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors py-1"
          >
            {doc.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      {LEGAL_DOCS.map((doc, i) => (
        <span key={doc.slug} className="flex items-center gap-3">
          <Link
            href={`/legal/${doc.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors"
          >
            {doc.label}
          </Link>
          {i < LEGAL_DOCS.length - 1 && (
            <span className="text-[#E8D0C8] select-none">·</span>
          )}
        </span>
      ))}
    </nav>
  );
}
