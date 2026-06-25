'use client';

import type { ReactNode } from 'react';
import { Phone } from 'lucide-react';
import { statusGlow } from '@/lib/utils/statusGlow';

interface ClientIdentityHeaderProps {
  name: string;
  phone: string;
  /** Перша літера; за замовчуванням — з імені. */
  avatarChar?: string;
  /** Контекстний піл праворуч: retention-статус (профіль) або статус запису (модалка). */
  statusPill?: ReactNode;
  /** Колір для пастельного glow тіла (M-CLI-05). Якщо не задано — без glow. */
  glowColor?: string;
  isVip?: boolean;
  /** Додатковий рядок під телефоном (напр. бейдж амбасадора). */
  badge?: ReactNode;
}

/**
 * Спільна шапка-ідентичність клієнта (M-CLI-06). Один вигляд скрізь, де показуємо клієнта:
 * ClientDetailSheet (профіль) і BookingDetailsModal (запис). Без кольорового кільця аватара
 * (прибрано в M-CLI-05); статус-сигнал = піл + м'який glow тіла.
 */
export function ClientIdentityHeader({
  name, phone, avatarChar, statusPill, glowColor, isVip, badge,
}: ClientIdentityHeaderProps) {
  return (
    <div
      className="bento-card flex items-center gap-4 p-4 overflow-hidden"
      style={glowColor ? { backgroundImage: statusGlow(glowColor) } : undefined}
    >
      <div
        className="size-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-foreground flex-shrink-0"
        style={{
          background: isVip ? 'rgba(180,83,9,0.14)' : 'var(--surface)',
          boxShadow: '0 0 0 2px var(--background)',
        }}
      >
        {avatarChar ?? name[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-lg font-bold text-foreground truncate">{name}</p>
          {isVip && (
            <span className="text-[10px] font-bold text-warning bg-warning/12 px-2 py-0.5 rounded-full flex-shrink-0">
              VIP
            </span>
          )}
          {statusPill}
        </div>
        <a
          href={`tel:${phone}`}
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <Phone size={13} />
          {phone}
        </a>
        {badge && <div className="mt-1.5">{badge}</div>}
      </div>
    </div>
  );
}
