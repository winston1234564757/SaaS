'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { UserPlus, Percent, Crown, Check, Share2, ArrowRight } from 'lucide-react';
import { CORMORANT } from './shared';

/**
 * Referral hook on /explore: a client who didn't find their master invites them.
 * Benefits are verified against the live C2B flow (/invite/[code]):
 *   client → −50% на перший запис · master → 21 день Pro безкоштовно.
 * With a c2b code we share/copy the invite link inline; without one we route to
 * /my/loyalty (which generates the code, and redirects anon visitors to login).
 */
export function ReferralInviteCTA({ inviteCode }: { inviteCode: string | null }) {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/invite/${inviteCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'BookIT', text: 'Хочу записуватись до тебе онлайн. Приєднуйся до BookIT.', url: link });
        return;
      }
    } catch {
      // user cancelled the share sheet — fall through to copy
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard blocked — nothing to do
    }
  }, [inviteCode]);

  return (
    <div className="mt-16 rounded-3xl bg-accent/[0.06] border border-accent/15 px-6 py-7">
      <h2
        className="text-foreground leading-tight"
        style={{ fontFamily: CORMORANT, fontSize: '1.7rem', fontWeight: 500 }}
      >
        Не знайшла свого майстра?
      </h2>
      <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
        Запроси його на BookIT. Виграєте обидва.
      </p>

      <div className="flex flex-col gap-2.5 mt-5">
        <div className="flex items-center gap-3">
          <span className="size-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Percent size={16} className="text-accent" aria-hidden="true" />
          </span>
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Тобі </span>
            <span className="font-semibold">−50% на перший запис до нього</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="size-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Crown size={16} className="text-accent" aria-hidden="true" />
          </span>
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Майстру </span>
            <span className="font-semibold">21 день Pro безкоштовно, без карти</span>
          </p>
        </div>
      </div>

      {inviteCode ? (
        <button
          type="button"
          onClick={share}
          className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-accent text-accent-foreground text-sm font-semibold min-h-[48px] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {copied ? (
            <>
              <Check size={15} aria-hidden="true" />
              Посилання скопійовано
            </>
          ) : (
            <>
              <Share2 size={15} aria-hidden="true" />
              Запросити майстра
            </>
          )}
        </button>
      ) : (
        <Link
          href="/my/loyalty"
          className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-accent text-accent-foreground text-sm font-semibold min-h-[48px] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <UserPlus size={15} aria-hidden="true" />
          Запросити майстра
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
