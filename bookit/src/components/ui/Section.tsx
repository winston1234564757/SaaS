'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Section — світлий допоміжний блок (дизайн-мова «Закон білого блоку»).
 * Це «тіло/чек» до темної обкладинки-героя: служить, не конкурує. Hairline-хедер
 * (тихий eyebrow + опційна дія) + слот тіла. Тіло — відповідальність споживача, але
 * має бути диференційованим (НЕ N рівних рядків/карток — маркер провалу).
 *
 * Замінює повторюваний хендрольний патерн `bento-card p-5` + `<p uppercase eyebrow>`.
 * Токени тихі: eyebrow/другорядне = `text-text-sub` (#475569, 5.9:1), головне = foreground.
 */
export function Section({
  title,
  icon: Icon,
  action,
  children,
  className,
  tone = 'default',
  bodyClassName,
}: {
  /** Тихий eyebrow-заголовок блока. */
  title: string;
  icon?: LucideIcon;
  /** Опційна дія праворуч у хедері (лінк, індикатор збереження). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** `alert` — тонке кільце для критичних блоків (напр. здоров'я). */
  tone?: 'default' | 'alert';
}) {
  return (
    <div className={cn('bento-card p-5', tone === 'alert' && 'ring-1 ring-destructive/20', className)}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={14} className="text-text-sub shrink-0" />}
          <p className="text-[10px] font-bold text-text-sub uppercase tracking-[0.16em] truncate">{title}</p>
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
