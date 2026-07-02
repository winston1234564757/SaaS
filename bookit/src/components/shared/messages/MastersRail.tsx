'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ScrollStrip } from '@/components/shared/ScrollStrip';

export interface RailMaster {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
}

function initialsOf(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * "Написати майстру" — a quiet top rail on the client Messages list. Bridges to
 * a NEW chat with masters the client has visited but has no conversation with
 * yet (the page dedupes against existing conversations). Tapping opens/creates
 * the DM via ?to=id. Uniform avatar rail is a legitimate contact-strip pattern,
 * not a bento of cards.
 */
export function MastersRail({ masters }: { masters: RailMaster[] }) {
  if (masters.length === 0) return null;

  return (
    <div className="px-4 pt-3 pb-3.5 border-b border-border/40">
      <p className="text-xs font-semibold text-text-sub mb-2.5">Написати майстру</p>
      <ScrollStrip
        className="flex gap-3.5"
        role="list"
        aria-label="Майстри, яким можна написати"
      >
        {masters.map(m => (
          <Link
            key={m.id}
            href={`/my/messages?to=${m.id}`}
            role="listitem"
            aria-label={`Написати: ${m.name}`}
            className="flex flex-col items-center gap-1.5 w-16 shrink-0 active:scale-95 transition-transform"
          >
            {m.avatarUrl ? (
              <Image
                src={m.avatarUrl}
                alt=""
                width={56}
                height={56}
                className="size-14 rounded-full object-cover"
              />
            ) : (
              <div className="size-14 rounded-full bg-accent/15 flex items-center justify-center">
                <span className="text-base font-semibold text-accent">{initialsOf(m.name)}</span>
              </div>
            )}
            <span className="text-[11px] leading-tight text-center line-clamp-1 max-w-full text-foreground">
              {m.name}
            </span>
          </Link>
        ))}
      </ScrollStrip>
    </div>
  );
}
