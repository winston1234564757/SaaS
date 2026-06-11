'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';
import type { TrustedPartner } from './TrustedPartnersBlock';

interface Props {
  partners: TrustedPartner[];
}

export function PostBookingPartnersBlock({ partners }: Props) {
  if (partners.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 pt-4 mt-4" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
          <Users size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
          Партнери
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {partners.map((p) => (
          <Link
            key={p.id}
            href={`/${p.slug}`}
            className="flex items-center gap-3 p-3 rounded-[14px] active:scale-[0.98] transition-colors duration-150"
            style={{ background: 'var(--surface)', border: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}
          >
            <span className="size-9 flex items-center justify-center rounded-xl flex-shrink-0 overflow-hidden relative" style={{ background: 'var(--background)' }}>
              {p.avatarUrl ? (
                <Image src={p.avatarUrl} alt={p.name} fill className="object-cover" sizes="36px" />
              ) : (
                <span className="text-xl">{p.avatarEmoji}</span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>{p.specialty}</p>
            </div>
            <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: 'var(--accent)' }}>
              Записатися
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
