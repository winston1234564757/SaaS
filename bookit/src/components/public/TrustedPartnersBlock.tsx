'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';

export interface TrustedPartner {
  id: string;
  slug: string;
  name: string;
  avatarEmoji: string;
  specialty: string;
}

interface Props {
  partners: TrustedPartner[];
}

export function TrustedPartnersBlock({ partners }: Props) {
  if (partners.length === 0) return null;

  return (
    <section className="bento-card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0">
          <Users size={17} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Перевірені партнери</h3>
          <p className="text-xs text-muted-foreground/60">Майстри з цієї ж мережі довіри</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {partners.map((p) => (
          <Link
            key={p.id}
            href={`/${p.slug}`}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 border border-[#E8D0C8] hover:bg-secondary active:scale-[0.98] transition-all"
          >
            <span className="text-2xl w-9 h-9 flex items-center justify-center rounded-xl bg-background flex-shrink-0">
              {p.avatarEmoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground/60 truncate">{p.specialty}</p>
            </div>
            <span className="text-xs text-primary font-medium flex-shrink-0">Записатись →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
