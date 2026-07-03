'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * EditorialCover — темна editorial-обкладинка (дизайн-мова «Закон темного блоку»).
 * Один герой на поверхню: домінанта + диференційований решток, БЕЗ рівномірних карток.
 * Фіксований slate (`.editorial-cover` / `--cover-bg`) — темний у будь-якій темі.
 *
 * Контент завжди на світлому on-dark ramp: `text-white` головне, `text-white/80` / `/70`
 * другорядне, `text-white/55` найтихіше (усе ≥4.5:1 на #0F172A). Статуси — світлі тінти
 * `*-300` (emerald/teal/amber/rose), НЕ світло-фонові хекси.
 *
 * Приклади-споживачі: `ClientDossierHero` (обкладинка=клієнт), картка запису (обкладинка=чек).
 */
export function EditorialCover({
  children,
  glowColor,
  className,
  padded = true,
}: {
  children: ReactNode;
  /** 6-значний hex контекстного статусу → точковий radial-glow у лівому-верхньому куті. */
  glowColor?: string;
  className?: string;
  /** Стандартний внутрішній відступ. Вимкни для власного (напр. band-хедер картки запису). */
  padded?: boolean;
}) {
  return (
    <div className={cn('editorial-cover', padded && 'px-5 py-5', className)}>
      {glowColor && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(120% 90% at 0% 0%, ${glowColor}40 0%, transparent 56%)` }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
