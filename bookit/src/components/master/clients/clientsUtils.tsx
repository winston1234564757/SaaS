'use client';

import React from 'react';
import {
  CheckCircle2, Moon, AlertTriangle, UserX,
  Crown, Sparkle, Heart, Gem, Calendar,
} from 'lucide-react';
import type { ClientRow, RetentionStatus } from '@/lib/supabase/hooks/useClients';

export const RETENTION_CONFIG: Record<RetentionStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:   { label: 'Активний',    color: '#5C9E7A', bg: '#5C9E7A14', dot: '#5C9E7A' },
  sleeping: { label: 'Дрімає',      color: '#789A99', bg: '#789A9914', dot: '#789A99' },
  at_risk:  { label: 'Під ризиком', color: '#D4935A', bg: '#D4935A14', dot: '#D4935A' },
  lost:     { label: 'Втрачений',   color: '#C05B5B', bg: '#C05B5B14', dot: '#C05B5B' },
};

export interface AutoTag {
  label: string;
  color: string;
  bg: string;
}

export function getAutoTags(client: ClientRow): AutoTag[] {
  const tags: AutoTag[] = [];
  if (client.is_vip) tags.push({ label: 'VIP', color: '#D4935A', bg: '#D4935A15' });
  if (client.total_visits === 1) tags.push({ label: 'Новий', color: '#789A99', bg: '#789A9915' });
  else if (client.total_visits >= 5) tags.push({ label: 'Постійний', color: '#5C9E7A', bg: '#5C9E7A15' });
  if (client.average_check >= 1500) tags.push({ label: 'Великий чек', color: '#D4935A', bg: '#D4935A15' });
  return tags;
}

export type SmartSegment =
  | 'none'
  | 'lost_treasures'
  | 'newbie_danger'
  | 'potential_vip'
  | 'flash_hunters'
  | 'archive_cleanup';

export function getSmartAction(client: ClientRow, segment: SmartSegment | 'none') {
  const name = client.client_name.split(' ')[0];

  if (segment === 'lost_treasures' || client.retention_status === 'lost') {
    return {
      title: 'Повернути клієнта',
      description: 'Клієнт у зоні відтоку. Рекомендуємо запропонувати бонус.',
      template: `Привіт, ${name}! Давно не бачилися в нашому салоні. Маю для вас приємний бонус -10% на наступний візит. Буду рада бачити!`,
      icon: <UserX size={18} />,
    };
  }
  if (segment === 'newbie_danger') {
    return {
      title: 'Закріпити новачка',
      description: 'Клієнт був лише раз. Запитайте про враження.',
      template: `Привіт, ${name}! Як вам результат нашого останнього візиту? Буду вдячна за відгук і з радістю чекатиму знову!`,
      icon: <Sparkle size={18} />,
    };
  }
  if (segment === 'potential_vip' || (client.total_visits > 3 && !client.is_vip)) {
    return {
      title: 'Заохотити до VIP',
      description: 'Лояльний клієнт. Час зробити приємний комплімент.',
      template: `Вітаю, ${name}! Ви наш частий гість, тому на наступний візит я підготувала для вас особливий догляд у подарунок. Дякуємо за довіру!`,
      icon: <Crown size={18} />,
    };
  }
  return {
    title: 'Запросити на запис',
    description: 'Нагадайте про себе та запропонуйте вільне вікно.',
    template: `Привіт, ${name}! Минуло вже достатньо часу з нашої останньої зустрічі. Маю вільні вікна на наступний тиждень, забронювати для вас місце?`,
    icon: <Calendar size={18} />,
  };
}

export function formatClientName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const first = parts[0];
  const lastInitial = parts[1][0].toUpperCase();
  return `${first} ${lastInitial}.`;
}

export function ClientIconStack({ client }: { client: ClientRow }) {
  const icons: { icon: React.ReactElement; color: string; bg: string }[] = [];

  if (client.retention_status === 'active')   icons.push({ icon: <CheckCircle2 size={12} />, color: '#FFFFFF', bg: '#5C9E7A' });
  if (client.retention_status === 'sleeping') icons.push({ icon: <Moon size={12} />, color: '#FFFFFF', bg: '#D4935A' });
  if (client.retention_status === 'at_risk')  icons.push({ icon: <AlertTriangle size={12} />, color: '#FFFFFF', bg: '#C05B5B' });
  if (client.retention_status === 'lost')     icons.push({ icon: <UserX size={12} />, color: '#FFFFFF', bg: '#6B5750' });
  if (client.is_vip)                          icons.push({ icon: <Crown size={12} />, color: '#FFFFFF', bg: '#D4935A' });
  if (client.total_visits === 1)              icons.push({ icon: <Sparkle size={12} />, color: '#FFFFFF', bg: '#789A99' });
  if (client.total_visits > 5)               icons.push({ icon: <Heart size={12} />, color: '#FFFFFF', bg: '#C05B5B' });
  if (client.average_check > 1500)           icons.push({ icon: <Gem size={12} />, color: '#FFFFFF', bg: '#789A99' });

  return (
    <div className="absolute top-4 right-4 flex flex-col items-center pointer-events-none">
      {icons.slice(0, 4).map((item, i) => (
        <div
          key={i}
          className="size-7 rounded-lg border-2 border-[var(--background)] flex items-center justify-center shadow-md relative"
          style={{
            background: item.bg,
            color: item.color,
            marginTop: i === 0 ? 0 : '-10px',
            zIndex: 10 - i,
          }}
        >
          {item.icon}
        </div>
      ))}
    </div>
  );
}
